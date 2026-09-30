// src/services/offlineQueue.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { log, formatPhoneForWhatsApp, getApiUrl } from "../utils/platform";
import { api } from '../../config/api';
// ? IMPORT CRITIQUE : Utiliser la config centralis�e
// 🟢 Ajoute cette constante directement pour remplacer la configuration manquante :
const API_BASE_URL = 'https://kemtchop-backend-production.up.railway.app';
const QUEUE_KEY = '@kemtchop:offline_queue';
const MAX_RETRIES = 3;

export interface QueuedRequest {
  id: string;
  endpoint: string;  // Doit �tre un chemin relatif, ex: '/orders/create'
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'normal' | "low";
  requiresAuth?: boolean;  // ? Nouveau: indiquer si la requ�te n�cessite un token
}

export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: QueuedRequest[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private constructor() {
    this.loadQueue();
    this.startAutoSync();
    
    // �couter les changements de connexion
    NetInfo.addEventListener((state) => {
      log('?? Connexion:', state.isConnected ? 'ONLINE' : 'OFFLINE');
      if (state.isConnected) {
        this.sync();
      }
    });
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  // ? Charger la queue depuis AsyncStorage
  private async loadQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        log(`?? Queue charg�e: ${this.queue.length} requ�tes en attente`);
      }
    } catch (e) {
      log('? Erreur chargement queue:', e);
    }
  }

  // ? Sauvegarder la queue dans AsyncStorage
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      log('? Erreur sauvegarde queue:', e);
    }
  }

  // ? Ajouter une requ�te � la queue
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queued: QueuedRequest = {
      ...request,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      priority: request.priority || 'normal',
      requiresAuth: request.requiresAuth ?? true,  // ? Par d�faut, requiert auth
    };

    // Insertion par priorit� (high en premier)
    if (queued.priority === 'high') {
      this.queue.unshift(queued);
    } else {
      this.queue.push(queued);
    }

    await this.saveQueue();
    log(`? Requ�te en queue: ${queued.endpoint} (ID: ${queued.id})`);

    // Tenter une sync imm�diate si online
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      this.sync();
    }

    return queued.id;
  }

  // ? Synchroniser la queue avec le backend
  async sync(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      log('? Sync d�j� en cours');
      return { success: 0, failed: 0 };
    }

    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      log('?? Offline: sync report�e');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    const results = { success: 0, failed: 0 };

    // Trier par priorit� puis par anciennet�
    const sorted = [...this.queue].sort((a, b) => {
      const priorityOrder = { high: 0, normal: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.timestamp - b.timestamp;
    });

    for (const request of sorted) {
      try {
        // ? CORRECTION 1: Construire l'URL correctement avec API_BASE_URL
        const cleanEndpoint = request.endpoint.startsWith('/') ? request.endpoint : `/${request.endpoint}`;
        const url = `${API_BASE_URL}${cleanEndpoint}`;

        // ? CORRECTION 2: Pr�parer les headers avec auth si n�cessaire
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        
        if (request.requiresAuth) {
          const token = await AsyncStorage.getItem('token');
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
        }

        const response = await fetch(url, {
          method: request.method,
          headers,
          body: JSON.stringify(request.payload),
        });

        if (response.ok) {
          // Supprimer de la queue si succ�s
          this.queue = this.queue.filter((q) => q.id !== request.id);
          results.success++;
          log(`? Sync r�ussi: ${request.endpoint}`);
        } else {
          // G�rer les erreurs 4xx (ne pas retry) vs 5xx (retry)
          if (response.status >= 500 && request.retryCount < MAX_RETRIES) {
            request.retryCount++;
            log(`?? Erreur serveur, retry ${request.retryCount}/${MAX_RETRIES}: ${request.endpoint}`);
          } else {
            this.queue = this.queue.filter((q) => q.id !== request.id);
            results.failed++;
            const errorData = await response.json().catch(() => ({}));
            log(`? �chec d�finitif: ${request.endpoint} (status: ${response.status}, detail: ${errorData.detail || 'N/A'})`);
          }
        }
      } catch (error: any) {
        // Erreur r�seau: incr�menter retryCount si possible
        if (request.retryCount < MAX_RETRIES) {
          request.retryCount++;
          log(`?? Erreur r�seau, retry ${request.retryCount}/${MAX_RETRIES}: ${request.endpoint}`);
        } else {
          this.queue = this.queue.filter((q) => q.id !== request.id);
          results.failed++;
          log(`? �chec apr�s ${MAX_RETRIES} retries: ${request.endpoint} - ${error.message}`);
        }
      }
    }

    await this.saveQueue();
    this.isSyncing = false;
    
    log(`?? Sync termin�e: ${results.success} succ�s, ${results.failed} �checs`);
    return results;
  }

  // ? D�marrer la sync automatique toutes les 30 secondes
  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      this.sync();
    }, 30000);
  }

  // ? Nettoyer (� appeler au d�montage de l'app si n�cessaire)
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // ? Getters pour l'UI
  getQueueLength(): number {
    return this.queue.length;
  }

  getQueue(): QueuedRequest[] {
    return [...this.queue];
  }

  // ? Vider la queue (pour debug ou reset)
  async clear(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    log("??? Queue vid�e");
  }
}