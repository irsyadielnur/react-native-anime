import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { User } from "@supabase/supabase-js";
import { useColorScheme } from "../components/useColorScheme";
import Colors from "../constants/Colors";
import { useFavorites } from "../context/FavoritesContext";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const { favorites } = useFavorites();

  // Auth State
  const [user, setUser] = useState<User | null>(null);

  // Form States
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUsername(
          session.user.user_metadata?.username ||
            session.user.email?.split("@")[0] ||
            "",
        );
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setUsername(
          session.user.user_metadata?.username ||
            session.user.email?.split("@")[0] ||
            "",
        );
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  // Helper to convert base64 to Uint8Array safely without global atob or Buffer
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    const lookup = new Uint8Array(256);
    for (let i = 0; i < chars.length; i++) {
      lookup[chars.charCodeAt(i)] = i;
    }

    const cleanBase64 = base64.replace(/=/g, "");
    const len = cleanBase64.length;
    const bufferLength = Math.floor(len * 0.75);
    const bytes = new Uint8Array(bufferLength);

    let p = 0;
    for (let i = 0; i < len; i += 4) {
      const encoded1 = lookup[cleanBase64.charCodeAt(i)];
      const encoded2 = lookup[cleanBase64.charCodeAt(i + 1)];
      const encoded3 = i + 2 < len ? lookup[cleanBase64.charCodeAt(i + 2)] : 0;
      const encoded4 = i + 3 < len ? lookup[cleanBase64.charCodeAt(i + 3)] : 0;

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      if (p < bufferLength) {
        bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      }
      if (p < bufferLength) {
        bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
      }
    }

    return bytes;
  };

  // Select photo from library
  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access media library is required.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images", // Fixed deprecated MediaTypeOptions
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true, // Request base64 data to bypass BlobManager ArrayBuffer crash
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.base64) {
          await uploadAvatar(asset.base64, asset.uri);
        } else {
          setErrorMsg("Failed to pick image data.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to pick image.");
    }
  };

  // Upload image array buffer to Supabase Storage and update auth metadata
  const uploadAvatar = async (base64Data: string, uri: string) => {
    if (!user) return;
    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Convert base64 data to binary Uint8Array
      const binaryData = base64ToUint8Array(base64Data);

      // 2. Prepare file path
      const fileExt = uri.split(".").pop() || "jpg";
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 3. Upload binary data to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatar")
        .upload(filePath, binaryData, {
          contentType: `image/${fileExt === "png" ? "png" : "jpeg"}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 4. Retrieve Public URL
      const { data } = supabase.storage.from("avatar").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;

      // 5. Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: publicUrl,
        },
      });

      if (updateError) throw updateError;

      setSuccessMsg("Profile photo updated!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  // Save profile updates (Username and/or Password)
  const handleSaveProfile = async () => {
    if (!user) return;
    setUploading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // 1. Update Username
      const { error: nameError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          username: username.trim(),
        },
      });

      if (nameError) throw nameError;

      // 2. Update Password if entered
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }
        if (newPassword !== confirmPassword) {
          throw new Error("Passwords do not match.");
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword.trim(),
        });

        if (passwordError) throw passwordError;

        setNewPassword("");
        setConfirmPassword("");
      }

      setSuccessMsg("Profile updated successfully!");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to save profile changes.");
    } finally {
      setUploading(false);
    }
  };

  const currentAvatar = user?.user_metadata?.avatar_url;
  const initialLetter = (
    username?.charAt(0) ||
    user?.email?.charAt(0) ||
    "U"
  ).toUpperCase();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header Close */}
          <View style={styles.closeHeader}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.closeButton, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Profile Photo Upload Header */}
          <View style={styles.avatarHeader}>
            <Pressable
              onPress={pickImage}
              disabled={uploading}
              style={styles.avatarWrapper}
            >
              <View
                style={[styles.avatarBorder, { borderColor: colors.primary }]}
              >
                {currentAvatar ? (
                  <Image
                    source={{ uri: currentAvatar }}
                    style={styles.avatar}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarPlaceholder,
                      { backgroundColor: colors.primary + "15" },
                    ]}
                  >
                    <Text
                      style={[styles.avatarInitials, { color: colors.primary }]}
                    >
                      {initialLetter}
                    </Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.uploadBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                )}
              </View>
            </Pressable>
            <Text style={[styles.avatarHelpText, { color: colors.mutedText }]}>
              Tap photo to upload new avatar
            </Text>
          </View>

          {/* Alerts */}
          {errorMsg && (
            <View
              style={[
                styles.alertBox,
                styles.errorBox,
                { borderColor: colors.primary },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.primary} />
              <Text style={[styles.alertText, { color: colors.text }]}>
                {errorMsg}
              </Text>
            </View>
          )}

          {successMsg && (
            <View
              style={[
                styles.alertBox,
                styles.successBox,
                { borderColor: "#10B981" },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.alertText, { color: colors.text }]}>
                {successMsg}
              </Text>
            </View>
          )}

          {/* Form Credentials */}
          <View style={styles.form}>
            {/* Email Address (ReadOnly) */}
            <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.border + "30",
                },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={16}
                color={colors.mutedText}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.readOnlyText, { color: colors.mutedText }]}>
                {user?.email}
              </Text>
            </View>

            {/* Username Input */}
            <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
              Username
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.mutedText}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={colors.mutedText}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Password Reset Section */}
            <View style={styles.passwordSectionHeader}>
              <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
                Change Password (Optional)
              </Text>
            </View>

            {/* New Password */}
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={colors.mutedText}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password (Min. 6 chars)"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Confirm Password */}
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={16}
                color={colors.mutedText}
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Submit Update */}
            <Pressable
              onPress={handleSaveProfile}
              disabled={uploading}
              style={({ pressed }) => [
                styles.saveButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || uploading ? 0.9 : 1,
                },
              ]}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </Pressable>
          </View>

          {/* Quick Metrics */}
          <View
            style={[
              styles.statsCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {favorites.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                My Watchlist
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#10B981" }]}>
                Cloud
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedText }]}>
                Sync Status
              </Text>
            </View>
          </View>

          {/* Sign Out */}
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [
              styles.signOutButton,
              {
                backgroundColor: colors.primary + "15",
                borderColor: colors.primary,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={18}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={[styles.signOutText, { color: colors.primary }]}>
              Sign Out
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
  },
  closeHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 45,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarHeader: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarBorder: {
    borderWidth: 2.5,
    borderRadius: 54,
    padding: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: "900",
  },
  uploadBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarHelpText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  alertBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 18,
  },
  errorBox: {
    backgroundColor: "#FF385C10",
  },
  successBox: {
    backgroundColor: "#10B98110",
  },
  alertText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  form: {
    width: "100%",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 50,
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  passwordSectionHeader: {
    marginTop: 10,
    marginBottom: 2,
  },
  saveButton: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  statsCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
    textTransform: "uppercase",
  },
  statDivider: {
    width: 1,
    height: "100%",
  },
  signOutButton: {
    flexDirection: "row",
    height: 50,
    borderWidth: 1.5,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  signOutText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
