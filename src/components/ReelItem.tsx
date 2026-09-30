// app/components/ReelItem.tsx
import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { ShoppingBag, Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react-native';
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
  containerHeight: number;
  onPressOrder: () => void;
}

function ReelItemComponent({ item, isActive, containerHeight, onPressOrder }: ReelItemProps) {
  const [videoError, setVideoError] = React.useState(false);
  const [isMuted, setIsMuted] = React.useState(true);
  const [fitMode, setFitMode] = React.useState<'contain' | 'cover'>('contain');
  const hasVideo = !!item.video_url && item.video_url.startsWith('http') && !videoError;
  const hasImage = !!item.image_url && item.image_url.startsWith('http');

  // Initialisation sécurisée du player (muet par défaut pour autoriser l'autoplay navigateur)
  const player = useVideoPlayer(hasVideo ? item.video_url! : '', (p) => {
    try {
      p.loop = true;
      p.muted = true;
      p.volume = 1.0;
    } catch (e) {
      console.warn('[ReelItem] Erreur init player:', e);
      setVideoError(true);
    }
  });

  const { isPlaying } = useEvent(player, 'playingChange', {
    isPlaying: player?.playing ?? false,
  });

  const toggleMute = () => {
    if (player) {
      const nextMuted = !isMuted;
      player.muted = nextMuted;
      setIsMuted(nextMuted);
    }
  };

  const toggleFitMode = () => {
    setFitMode((prev) => (prev === 'contain' ? 'cover' : 'contain'));
  };

  React.useEffect(() => {
    if (!hasVideo || !player) return;
    let isCurrent = true;
    try {
      if (isActive) {
        const promise = player.play();
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err: any) => {
            if (isCurrent && err?.name !== 'AbortError') {
              console.log('[ReelItem] Autoplay note:', err?.message);
            }
          });
        }
      } else {
        player.pause();
      }
    } catch (e) {
      // Silencieux pour éviter de polluer la console
    }

    return () => {
      isCurrent = false;
      try {
        player.pause();
      } catch {}
    };
  }, [isActive, hasVideo, player]);

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
    // CATALOG_PRODUCT ou sans offre active aujourd'hui
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
        <View style={styles.media}>
          {/* Fond ambiant flouté pour combler harmonieusement le cadre rectangulaire */}
          {hasImage && (
            <Image
              source={{ uri: item.image_url! }}
              style={styles.ambientImage}
              blurRadius={Platform.OS === 'web' ? 25 : 20}
              resizeMode="cover"
            />
          )}
          <View style={styles.ambientDarken} />

          {/* Lecteur vidéo centré avec largeur/hauteur 100% explicite */}
          <VideoView
            player={player}
            style={styles.videoPlayer}
            contentFit={fitMode}
            nativeControls={false}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            onError={() => {
              console.warn('[ReelItem] Erreur VideoView');
              setVideoError(true);
            }}
          />
        </View>
      ) : hasImage ? (
        <View style={styles.media}>
          {/* Fond ambiant flouté */}
          <Image
            source={{ uri: item.image_url! }}
            style={styles.ambientImage}
            blurRadius={Platform.OS === 'web' ? 25 : 20}
            resizeMode="cover"
          />
          <View style={styles.ambientDarken} />

          {/* Image principale centrée */}
          <Image
            source={{ uri: item.image_url! }}
            style={styles.centeredImage}
            resizeMode={fitMode}
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
  orderButtonText: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
});
