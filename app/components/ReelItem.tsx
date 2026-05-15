import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

const { width: screenWidth } = Dimensions.get("window");

// On ajoute 'onPressOrder' dans les props reçues
const ReelItem = ({ item, isActive, containerHeight, onPressOrder }: any) => {
  const videoRef = useRef<Video>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Synchronisation de la vidéo
  useEffect(() => {
    if (isActive) {
      if (!isPaused) {
        videoRef.current?.playAsync();
      } else {
        videoRef.current?.pauseAsync();
      }
    } else {
      videoRef.current?.pauseAsync();
      videoRef.current?.setPositionAsync(0); // Remet à zéro quand on change de vidéo
    }
  }, [isActive, isPaused]);

  return (
    <View
      style={{
        height: containerHeight,
        width: screenWidth,
        backgroundColor: "#000",
      }}
    >
      <Pressable
        onPress={() => setIsPaused(!isPaused)}
        style={StyleSheet.absoluteFill}
      >
        <Video
          ref={videoRef}
          source={{ uri: item.video_url }}
          style={[styles.backgroundVideo, { height: containerHeight }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive && !isPaused}
          isLooping={true}
          isMuted={false}
        />

        {isPaused && (
          <View style={styles.pauseContainer}>
            <View style={styles.pauseIconCircle}>
              <Text style={styles.pauseIcon}>▶</Text>
            </View>
          </View>
        )}
      </Pressable>

      <View style={styles.overlay}>
        <View style={styles.textShadowContainer}>
          <Text style={styles.title}>{item.product_name}</Text>
          <Text style={styles.price}>{item.price} FCFA</Text>
        </View>

        <TouchableOpacity
          style={styles.btn}
          onPress={onPressOrder} // <--- ICI : On appelle la fonction du parent !
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>COMMANDER (Payer 40% Acompte)</Text>
        </TouchableOpacity>
      </View>

      {/* IMPORTANT : J'ai supprimé <OrderModal /> d'ici. 
          Il est maintenant géré par ReelsScreen.tsx pour plus de performance.
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  backgroundVideo: {
    width: screenWidth,
    position: "absolute",
    top: 0,
    left: 0,
  },
  overlay: { position: "absolute", bottom: 60, left: 20, right: 20, zIndex: 5 },
  textShadowContainer: { marginBottom: 15 },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  price: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
    marginTop: 5,
  },
  btn: {
    backgroundColor: "#E31C25",
    paddingVertical: 18,
    borderRadius: 15,
    alignItems: "center",
    elevation: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  pauseContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  pauseIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  pauseIcon: { fontSize: 40, color: "white", marginLeft: 5 },
});

export default ReelItem;
