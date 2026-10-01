import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react-native';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visible, setVisible] = useState(false);
  const [iosModalVisible, setIosModalVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. Détecter si l'application est déjà installée en mode standalone
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (standaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Détecter iOS (Safari sur iPhone/iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // 3. Vérifier si l'utilisateur a fermé l'invite récemment dans cette session
    const isDismissed = sessionStorage.getItem('kemtchop_pwa_dismissed');
    if (isDismissed) return;

    // 4. Capturer l'événement natif d'installation sur Android / Chrome
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Si on est sur iOS, afficher la bannière après un court délai pour guider l'utilisateur
    let iosTimer: any = null;
    if (isIosDevice && !standaloneMode) {
      iosTimer = setTimeout(() => {
        setVisible(true);
      }, 1500);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setIosModalVisible(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          console.log('[PWA] Installation acceptée par l’utilisateur');
          setVisible(false);
        }
        setDeferredPrompt(null);
      } catch (e) {
        console.warn('[PWA] Erreur prompt:', e);
      }
    } else {
      // Fallback explicite
      alert("Pour installer KemTchop : ouvrez le menu du navigateur (⋮ en haut à droite) et choisissez 'Ajouter à l'écran d'accueil'.");
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('kemtchop_pwa_dismissed', 'true');
    }
  };

  if (!visible || isStandalone) return null;

  return (
    <>
      {/* 📲 Bannière flottante d'installation */}
      <View style={styles.bannerContainer}>
        <View style={styles.bannerContent}>
          <View style={styles.iconBadge}>
            <Smartphone size={22} color="#ffffff" />
          </View>

          <View style={styles.textWrapper}>
            <Text style={styles.bannerTitle}>Ajouter KemTchop à l'écran</Text>
            <Text style={styles.bannerSubtitle}>
              Commandez directement sans passer par le navigateur !
            </Text>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={handleDismiss}>
            <X size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss}>
            <Text style={styles.dismissBtnText}>Plus tard</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.installBtn} onPress={handleInstallClick}>
            <Download size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.installBtnText}>Installer l'application</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🍏 Modal d'instructions pour iPhone / iPad Safari */}
      <Modal
        visible={iosModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📲 Installer sur votre iPhone</Text>
              <TouchableOpacity onPress={() => setIosModalVisible(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructionIntro}>
              Ajoutez KemTchop à votre écran d'accueil en 3 étapes simples :
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Share size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 1</Text>
                <Text style={styles.stepText}>
                  Appuyez sur le bouton <Text style={styles.boldText}>Partager</Text> (icône en bas du navigateur Safari).
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <PlusSquare size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 2</Text>
                <Text style={styles.stepText}>
                  Faites défiler vers le bas et touchez <Text style={styles.boldText}>« Sur l'écran d'accueil »</Text>.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Smartphone size={20} color="#10B981" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 3</Text>
                <Text style={styles.stepText}>
                  Touchez <Text style={styles.boldText}>« Ajouter »</Text> en haut à droite. C'est prêt !
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setIosModalVisible(false);
                handleDismiss();
              }}
            >
              <Text style={styles.modalCloseButtonText}>J'ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#E31C25',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  bannerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  dismissBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  dismissBtnText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  installBtn: {
    backgroundColor: '#E31C25',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#E31C25',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  installBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalInstructionIntro: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 20,
    lineHeight: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
  },
  stepIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepTextWrapper: {
    flex: 1,
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E31C25',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  stepText: {
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
