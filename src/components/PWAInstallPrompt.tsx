import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform, Image } from 'react-native';
import { Download, X, Share, PlusSquare, Smartphone, MoreVertical, CheckCircle2, Sparkles, RefreshCw, Trash2, Globe } from 'lucide-react-native';

const CURRENT_PWA_VERSION = 2;
const KEY_INSTALLED_VERSION = 'kemtchop_pwa_version';
const KEY_BANNER_DISMISSED = 'kemtchop_pwa_dismissed';
const KEY_UPDATE_DISMISSED = 'kemtchop_pwa_update_dismissed_v2';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInApp, setIsInApp] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [needsIconUpdate, setNeedsIconUpdate] = useState(false);

  const [installBannerVisible, setInstallBannerVisible] = useState(false);
  const [updateBannerVisible, setUpdateBannerVisible] = useState(false);
  const [iosModalVisible, setIosModalVisible] = useState(false);
  const [inAppModalVisible, setInAppModalVisible] = useState(false);
  const [fallbackModalVisible, setFallbackModalVisible] = useState(false);
  const [updateHelpModalVisible, setUpdateHelpModalVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    // 1. Détecter si l'application tourne actuellement en mode autonome (PWA / Standalone)
    const standaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(standaloneMode);

    // 2. Détecter iOS et In-App Browsers (WhatsApp, Facebook, Instagram, etc.)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    const isInAppBrowser = /fban|fbav|instagram|whatsapp|micromessenger|snapchat|tiktok/i.test(userAgent);
    setIsInApp(isInAppBrowser);

    // 3. Lire la version enregistrée dans le stockage local
    const storedVersion = Number(localStorage.getItem(KEY_INSTALLED_VERSION) || 0);

    // 4. Détecter si l'application est déjà installée sur l'appareil (Chrome getInstalledRelatedApps)
    const checkInstalledApps = async () => {
      // CAS A : L'utilisateur navigue DÉJÀ dans l'application installée (mode autonome)
      if (standaloneMode) {
        setAlreadyInstalled(true);
        if (storedVersion < CURRENT_PWA_VERSION) {
          const updateDismissed = sessionStorage.getItem(KEY_UPDATE_DISMISSED);
          if (!updateDismissed) {
            setNeedsIconUpdate(true);
            setUpdateBannerVisible(true);
          }
        } else {
          localStorage.setItem(KEY_INSTALLED_VERSION, String(CURRENT_PWA_VERSION));
        }
        return;
      }

      // CAS B : Visite depuis un onglet web ordinaire
      // Ne bloquer que si l'API native de Chrome confirme formellement l'installation
      let isInstalledOnDevice = false;
      if ('getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            isInstalledOnDevice = true;
          }
        } catch (e) {
          // Ignorer l'erreur silencieusement
        }
      }

      setAlreadyInstalled(isInstalledOnDevice);

      // Si l'application est déjà confirmée comme installée sur l'appareil -> NE PAS afficher
      if (isInstalledOnDevice) {
        return;
      }

      // Sinon : vérifier si dismissé dans cette session
      const sessionDismissed = sessionStorage.getItem(KEY_BANNER_DISMISSED);
      if (!sessionDismissed) {
        // Laisser 1.2s pour que le client profite du premier rendu
        setTimeout(() => {
          setInstallBannerVisible(true);
        }, 1200);
      }
    };

    checkInstalledApps();

    // 5. Capturer l'événement beforeinstallprompt de Chrome
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      (window as any).deferredPWAPrompt = e;
      setDeferredPrompt(e);
      console.log('[PWA] beforeinstallprompt capturé');
    };

    const handlePromptReady = () => {
      if ((window as any).deferredPWAPrompt) {
        setDeferredPrompt((window as any).deferredPWAPrompt);
      }
    };

    const handleAppInstalled = () => {
      console.log('[PWA] Application installée avec succès !');
      localStorage.setItem(KEY_INSTALLED_VERSION, String(CURRENT_PWA_VERSION));
      setInstallBannerVisible(false);
      setUpdateBannerVisible(false);
      setAlreadyInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      (window as any).deferredPWAPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-prompt-ready', handlePromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-prompt-ready', handlePromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Déclenchement de l'installation
  const handleInstallClick = async () => {
    // Si l'utilisateur est dans le navigateur interne de WhatsApp / Facebook
    if (isInApp) {
      setInAppModalVisible(true);
      return;
    }

    if (isIOS) {
      setIosModalVisible(true);
      return;
    }

    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? (window as any).deferredPWAPrompt : null);

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;

        if (choice && choice.outcome === 'accepted') {
          localStorage.setItem(KEY_INSTALLED_VERSION, String(CURRENT_PWA_VERSION));
          setInstallBannerVisible(false);
          setAlreadyInstalled(true);
        }

        setDeferredPrompt(null);
        if (typeof window !== 'undefined') {
          (window as any).deferredPWAPrompt = null;
        }
      } catch (e) {
        setFallbackModalVisible(true);
      }
    } else {
      setFallbackModalVisible(true);
    }
  };

  const handleDismissInstall = () => {
    setInstallBannerVisible(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(KEY_BANNER_DISMISSED, 'true');
    }
  };

  const handleDismissUpdate = () => {
    setUpdateBannerVisible(false);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(KEY_UPDATE_DISMISSED, 'true');
    }
  };

  const handleMarkUpdateDone = () => {
    localStorage.setItem(KEY_INSTALLED_VERSION, String(CURRENT_PWA_VERSION));
    setUpdateBannerVisible(false);
    setUpdateHelpModalVisible(false);
  };

  return (
    <>
      {/* 🔴 CAS 1 : BANNIÈRE DE MISE À JOUR VISUELLE (Pour les utilisateurs de l'ancienne PWA) */}
      {updateBannerVisible && (
        <View style={styles.updateBannerContainer}>
          <View style={styles.bannerContent}>
            <View style={styles.iconBadgeUpdate}>
              <Sparkles size={20} color="#ffffff" />
            </View>

            <View style={styles.textWrapper}>
              <Text style={styles.updateBannerTitle}>✨ Nouvelle identité KemTchop</Text>
              <Text style={styles.updateBannerSubtitle}>
                Pour afficher le nouveau logo sur votre écran d'accueil, renouvelez votre raccourci.
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={handleDismissUpdate}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.dismissBtn} onPress={handleDismissUpdate}>
              <Text style={styles.dismissBtnText}>Plus tard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.updateBtn}
              onPress={() => setUpdateHelpModalVisible(true)}
            >
              <RefreshCw size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.updateBtnText}>Comment faire ?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🟢 CAS 2 : BANNIÈRE D'INSTALLATION STANDARD (Uniquement si PAS encore installée) */}
      {installBannerVisible && !alreadyInstalled && !isStandalone && (
        <View style={styles.bannerContainer}>
          <View style={styles.bannerContent}>
            <View style={styles.iconBadge}>
              <Smartphone size={22} color="#ffffff" />
            </View>

            <View style={styles.textWrapper}>
              <Text style={styles.bannerTitle}>Ajouter KemTchop à l'écran</Text>
              <Text style={styles.bannerSubtitle}>
                Commandez vos repas en 1 clic sans passer par le navigateur !
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={handleDismissInstall}>
              <X size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.dismissBtn} onPress={handleDismissInstall}>
              <Text style={styles.dismissBtnText}>Plus tard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.installBtn} onPress={handleInstallClick}>
              <Download size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.installBtnText}>Installer l'application</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 🔄 MODALE D'AIDE À LA MISE À JOUR DE L'ICÔNE */}
      <Modal
        visible={updateHelpModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setUpdateHelpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>✨ Actualiser votre icône</Text>
              <TouchableOpacity onPress={() => setUpdateHelpModalVisible(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructionIntro}>
              Pour afficher la nouvelle icône avec la marmite rouge officielle sur votre téléphone :
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Trash2 size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 1</Text>
                <Text style={styles.stepText}>
                  Sur l'écran d'accueil de votre téléphone, supprimez l'ancien raccourci <Text style={styles.boldText}>KemTchop</Text>.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <PlusSquare size={20} color="#10B981" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 2</Text>
                <Text style={styles.stepText}>
                  Depuis votre navigateur, touchez le menu <Text style={styles.boldText}>⋮</Text> ou <Text style={styles.boldText}>Partager</Text> puis <Text style={styles.boldText}>« Installer »</Text>.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalConfirmButton}
              onPress={handleMarkUpdateDone}
            >
              <CheckCircle2 size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.modalConfirmButtonText}>C'est fait, merci !</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🍏 Modal d'instructions pour iPhone Safari */}
      <Modal
        visible={iosModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIosModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📲 Installer sur iPhone</Text>
              <TouchableOpacity onPress={() => setIosModalVisible(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructionIntro}>
              Ajoutez KemTchop à votre écran d'accueil en 3 étapes :
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Share size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 1</Text>
                <Text style={styles.stepText}>
                  Touchez le bouton <Text style={styles.boldText}>Partager</Text> en bas de Safari.
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
                  Choisissez <Text style={styles.boldText}>« Sur l'écran d'accueil »</Text>.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <CheckCircle2 size={20} color="#10B981" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 3</Text>
                <Text style={styles.stepText}>
                  Touchez <Text style={styles.boldText}>« Ajouter »</Text> en haut à droite.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setIosModalVisible(false);
                handleDismissInstall();
              }}
            >
              <Text style={styles.modalCloseButtonText}>J'ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 💬 Modal d'instructions pour WhatsApp & In-App Browser */}
      <Modal
        visible={inAppModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setInAppModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>🌐 Ouvrir dans votre navigateur</Text>
              <TouchableOpacity onPress={() => setInAppModalVisible(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructionIntro}>
              Vous êtes actuellement dans le navigateur interne de WhatsApp / réseaux sociaux. Pour installer l'application :
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <MoreVertical size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 1</Text>
                <Text style={styles.stepText}>
                  Touchez le menu <Text style={styles.boldText}>⋮ (3 points)</Text> ou l'icône de partage en haut à droite.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Globe size={20} color="#10B981" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 2</Text>
                <Text style={styles.stepText}>
                  Appuyez sur <Text style={styles.boldText}>« Ouvrir dans Chrome »</Text> (ou Safari sur iPhone).
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Download size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 3</Text>
                <Text style={styles.stepText}>
                  Une fois dans le navigateur, vous pourrez installer l'application en 1 clic !
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setInAppModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>J'ai compris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 🤖 Modal d'instructions pour Android Chrome (Secours) */}
      <Modal
        visible={fallbackModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFallbackModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📲 Installer sur Android</Text>
              <TouchableOpacity onPress={() => setFallbackModalVisible(false)}>
                <X size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalInstructionIntro}>
              Ajoutez KemTchop à votre écran d'accueil en 3 étapes :
            </Text>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <MoreVertical size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 1</Text>
                <Text style={styles.stepText}>
                  Appuyez sur le menu <Text style={styles.boldText}>⋮ (3 points)</Text> en haut à droite de Chrome.
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <Download size={20} color="#E31C25" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 2</Text>
                <Text style={styles.stepText}>
                  Sélectionnez <Text style={styles.boldText}>« Installer l'application »</Text> (ou « Ajouter à l'écran d'accueil »).
                </Text>
              </View>
            </View>

            <View style={styles.stepItem}>
              <View style={styles.stepIcon}>
                <CheckCircle2 size={20} color="#10B981" />
              </View>
              <View style={styles.stepTextWrapper}>
                <Text style={styles.stepNumber}>Étape 3</Text>
                <Text style={styles.stepText}>
                  Confirmez avec <Text style={styles.boldText}>« Installer »</Text>. C'est prêt !
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setFallbackModalVisible(false);
                handleDismissInstall();
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
  updateBannerContainer: {
    backgroundColor: '#fffbeb',
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
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
  iconBadgeUpdate: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#d97706',
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
  updateBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400e',
  },
  updateBannerSubtitle: {
    fontSize: 12,
    color: '#b45309',
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
  updateBtn: {
    backgroundColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  updateBtnText: {
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
  modalConfirmButton: {
    backgroundColor: '#10B981',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalConfirmButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
