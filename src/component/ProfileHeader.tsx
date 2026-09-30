import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

// On définit ce que le composant a besoin de recevoir (props)
interface ProfileHeaderProps {
  userName: string;
  userPhone: string;
  isAffiliate: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userName,
  userPhone,
  isAffiliate,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.avatarContainer}>
        <Image
          source={{
            uri: `https://ui-avatars.com/api/?name=${userName}&background=E31C25&color=fff`,
          }}
          style={styles.avatar}
        />
        {/* On affiche le badge doré seulement si l'utilisateur est un partenaire */}
        {isAffiliate && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={22} color="#FFD700" />
          </View>
        )}
      </View>

      <Text style={styles.userName}>{userName}</Text>
      <Text style={styles.userPhone}>
        {userPhone || "Numéro non enregistré"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingVertical: 30,
    backgroundColor: "#fdfdfd",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#E31C25",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#fff",
    borderRadius: 12,
    // Petit effet d'ombre pour le badge
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#000",
  },
  userPhone: {
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
});

export default ProfileHeader;
