// app/components/ReelItem.tsx
import React, { memo, useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { ShoppingBag, Volume2, VolumeX, Maximize2, Minimize2, Play } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ReelItemProps {
  item: {
    id: string;
    title?: string;
    video_url: string | null;
    image_url: string | null;
    daily_offer_id: string | null;
    product?: {
      id?: number;
      name: string;
      image_url: string;
      price?: number;
      complements?: string;
    };
    status: string | null;
    is_threshold_reached: boolean;
    button_label: string;
    urgency_message: string | null;
    price_per_unit?: number;
    reserved_portions?: number;
    minimum_threshold?: number;
    target_date?: string;
    offer_date?: string;
    type?: 'offer' | 'product';
    item_type?: string;
    reel_category?: 'DAILY_MENU' | 'FUTURE_RESERVATION' | 'CATALOG_PRODUCT';
    sides?: string[];
  };
  isActive: boolean;
  isNext?: boolean;
  containerHeight: number;
  onPressOrder: () => void;
}

function ReelItemComponent({ item, isActive, isNext = false, containerHeight, onPressOrder }: ReelItemProps) {
  const [videoError, setVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [fitMode, setFitMode] = useState<'contain' | 'cover'>('contain');
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  // Sécuriser les URL en HTTPS pour les navigateurs mobiles
  const toHttps = (url: string | null | undefined) => {
    if (!url) return '';
    return url.startsWith('http://') ? 'https://' + url.slice(7) : url;
  };

  const videoUrl = toHttps(item.video_url);
  const imageUrl = toHttps(item.image_url || item.product?.image_url);
  const hasVideo = !!videoUrl && videoUrl.startsWith('https://') && !videoError;
  const hasImage = !!imageUrl && imageUrl.startsWith('https://');

  // Référence spécifique pour le lecteur HTML5 natif sur Web / Safari / Chrome mobile
  const webVideoRef = useRef<HTMLVideoElement | null>(null);

  // Initialisation du player natif expo-video (pour iOS & Android)
  const isWeb = Platform.OS === 'web';
  const player = useVideoPlayer(!isWeb && hasVideo ? videoUrl : '', (p) => {
    try {
      p.loop = true;
      p.muted = true;
      p.volume = 1.0;
    } catch (e) {
      console.warn('[ReelItem Native] Erreur init player:', e);
    }
  });

  // Gestion de la lecture sur Web avec tolérance aux restrictions autoplay des smartphones
  useEffect(() => {
    if (!isWeb || !hasVideo) return;
    const v = webVideoRef.current;
    if (!v) return;

    v.muted = isMuted;

    if (isActive) {
      const playPromise = v.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise
          .then(() => {
            setShowPlayOverlay(false);
          })
          .catch((err) => {
            // Si la politique de sécurité du navigateur mobile exige une interaction ou un mode muet strict
            console.log('[ReelItem Web] Autoplay refusé sans geste utilisateur:', err?.message);
            if (v) {
              v.muted = true;
              setIsMuted(true);
              v.play().catch(() => {
                setShowPlayOverlay(true);
              });
            }
          });
      }
    } else {
      v.pause();
      setShowPlayOverlay(false);
    }
  }, [isActive, isWeb, hasVideo, isMuted]);

  // Gestion de la lecture native iOS / Android
  useEffect(() => {
    if (isWeb || !hasVideo || !player) return;
    try {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    } catch {}
  }, [isActive, isWeb, hasVideo, player]);

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (isWeb && webVideoRef.current) {
      webVideoRef.current.muted = nextMuted;
    } else if (player) {
      player.muted = nextMuted;
    }
  };

  const handleMediaTap = () => {
    if (isWeb && webVideoRef.current) {
      const v = webVideoRef.current;
      if (v.paused) {
        v.play().then(() => setShowPlayOverlay(false)).catch(() => {});
      } else {
        v.pause();
        setShowPlayOverlay(true);
      }
    }
  };

  const toggleFitMode = () => {
    setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  };

  // ✅ LOGIQUE MÉTIER BASÉE STRICTEMENT SUR reel_category
  const isTodayOffer = (item.reel_category === "DAILY_MENU" || !!item.daily_offer_id) && 
                       (item.is_threshold_reached || ['confirmed', 'cooking', 'ready', 'delivering'].includes(String(item.status || '').toLowerCase()));
  
  let actionLabel = "Réserver";
  let buttonStyle = styles.btnPending;
  let iconColor = "#0f172a";
  let badgeText = "À RÉSERVER";
  let descriptiveNote = "🔥 Plat disponible à la réservation";

  if (isTodayOffer) {
    actionLabel = "Commander";
    buttonStyle = styles.btnConfirmed;
    iconColor = "#fff";
    badgeText = "MENU DU JOUR";
    descriptiveNote = "🍲 Menu du Jour — Production garantie aujourd'hui";
  } else if (item.reel_category === "FUTURE_RESERVATION") {
    actionLabel = "Réserver";
    buttonStyle = item.is_threshold_reached ? styles.btnConfirmed : styles.btnPending;
    iconColor = item.is_threshold_reached ? "#fff" : "#0f172a";
    badgeText = "À RÉSERVER";
    descriptiveNote = "🔥 Offre disponible à la réservation";
  } else {
    actionLabel = "Réserver";
    buttonStyle = styles.btnPending;
    iconColor = "#0f172a";
    badgeText = "À RÉSERVER";
    descriptiveNote = "🔥 Choisissez une date et réservez ce plat";
  }

  const handleAction = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onPressOrder();
  };

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      {hasVideo ? (
        <TouchableOpacity 
          style={styles.media} 
          activeOpacity={1} 
          onPress={handleMediaTap}
        >
          {/* Fond ambiant flouté */}
          {hasImage && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.ambientImage}
              blurRadius={Platform.OS === 'web' ? 25 : 20}
              contentFit="cover"
            />
          )}
          <View style={styles.ambientDarken} />

          {/* Lecteur vidéo Web : Un seul stream actif à la fois (preload=none pour le suivant, image pour les autres) */}
          {isWeb ? (
            isActive || isNext ? (
              <video
                ref={webVideoRef}
                src={videoUrl}
                poster={imageUrl}
                playsInline
                // @ts-ignore
                webkit-playsinline="true"
                autoPlay={isActive}
                muted={isMuted}
                loop
                preload={isActive ? "metadata" : "none"}
                crossOrigin="anonymous"
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  objectFit: fitMode,
                  backgroundColor: '#000',
                }}
                onError={(e) => {
                  console.warn('[ReelItem Web] Erreur vidéo HTML5:', e);
                }}
              />
            ) : (
              /* Pour les reels non-adjacents : affiche uniquement l'affiche sans télécharger de flux vidéo */
              hasImage && (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.centeredImage}
                  contentFit={fitMode}
                  cachePolicy="memory-disk"
                />
              )
            )
          ) : (
            isActive && (
              <VideoView
                player={player}
                style={styles.videoPlayer}
                contentFit={fitMode}
                nativeControls={false}
                allowsFullscreen={false}
                allowsPictureInPicture={false}
                onError={() => {
                  console.warn('[ReelItem Native] Erreur VideoView');
                }}
              />
            )
          )}

          {/* Bouton de lecture si le navigateur a bloqué l'autoplay */}
          {showPlayOverlay && (
            <View style={styles.playOverlay}>
              <Play size={44} color="#ffffff" />
            </View>
          )}
        </TouchableOpacity>
      ) : hasImage ? (
        <View style={styles.media}>
          {/* Fond ambiant flouté */}
          <Image
            source={{ uri: imageUrl }}
            style={styles.ambientImage}
            blurRadius={Platform.OS === 'web' ? 25 : 20}
            contentFit="cover"
          />
          <View style={styles.ambientDarken} />

          {/* Image principale centrée */}
          <Image
            source={{ uri: imageUrl }}
            style={styles.centeredImage}
            contentFit={fitMode}
            transition={200}
            cachePolicy="memory-disk"
          />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderEmoji}>🍲</Text>
          <Text style={styles.placeholderName}>{item.product?.name || item.title || "Plat KemTchop"}</Text>
        </View>
      )}

      {/* Bouton Cadrage : Ajuster / Centrer ou Remplir l'écran */}
      <TouchableOpacity
        style={styles.fitButton}
        onPress={toggleFitMode}
        activeOpacity={0.7}
      >
        {fitMode === 'contain' ? (
          <Maximize2 size={17} color="#fff" />
        ) : (
          <Minimize2 size={17} color="#fff" />
        )}
      </TouchableOpacity>

      {/* Bouton Mute / Unmute */}
      {hasVideo && (
        <TouchableOpacity style={styles.muteButton} onPress={toggleMute} activeOpacity={0.7}>
          {isMuted ? <VolumeX size={17} color="#fff" /> : <Volume2 size={17} color="#fff" />}
        </TouchableOpacity>
      )}

      {/* Badge court en haut à droite */}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badgeText}</Text>
      </View>

      <View style={styles.overlay} />

      <View style={styles.infoContainer}>
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>{descriptiveNote}</Text>
        </View>

        {item.urgency_message && (
          <Text style={styles.urgencyText}>{item.urgency_message}</Text>
        )}
        
        <Text style={styles.productName}>{item.product?.name || item.title || "Plat KemTchop"}</Text>
      </View>

      <TouchableOpacity
        style={[styles.orderButton, buttonStyle]}
        onPress={handleAction}
        activeOpacity={0.8}
      >
        <ShoppingBag size={20} color={iconColor} />
        <Text style={[styles.orderButtonText, { color: iconColor }]}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(ReelItemComponent);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  ambientImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.6,
    transform: [{ scale: 1.15 }],
  },
  ambientDarken: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // @ts-ignore
    objectPosition: 'center',
  },
  centeredImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  placeholderEmoji: {
    fontSize: 64,
  },
  placeholderName: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    pointerEvents: 'none',
  },
  fitButton: {
    position: 'absolute',
    top: 50,
    right: 172,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
  muteButton: {
    position: 'absolute',
    top: 50,
    right: 126,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    zIndex: 10,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  noteContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  noteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  urgencyText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  productName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '900',
  },
  orderButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  btnProduct: {
    backgroundColor: '#fff',
  },
  btnConfirmed: {
    backgroundColor: '#10B981',
  },
  btnPending: {
    backgroundColor: '#F59E0B',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 5,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});
