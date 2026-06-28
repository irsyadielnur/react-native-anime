import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

import { useColorScheme } from "../components/useColorScheme";
import Colors from "../constants/Colors";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // States
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Email/Password Sign In
  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data?.user) {
        setSuccessMessage("Successfully logged in!");
        setTimeout(() => {
          router.back();
        }, 800);
      }
    } catch (error: any) {
      console.error("Sign in failed:", error);
      setErrorMessage(error.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Email/Password Sign Up
  const handleSignUp = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
      });

      if (error) throw error;

      if (data?.user) {
        setSuccessMessage("Registration successful! Logging you in...");
        setTimeout(() => {
          router.back();
        }, 1200);
      }
    } catch (error: any) {
      console.error("Sign up failed:", error);
      setErrorMessage(error.message || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Close Modal Button */}
          <View style={styles.closeHeader}>
            <Pressable
              onPress={() => router.back()}
              style={[styles.closeButton, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Heading Logo & Theme */}
          <View style={styles.logoContainer}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.primary + "15" },
              ]}
            >
              <Ionicons name="sparkles" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.logoText, { color: colors.text }]}>
              Anime<Text style={{ color: colors.primary }}>Catalog</Text>
            </Text>
            <Text style={[styles.logoSubText, { color: colors.mutedText }]}>
              Sign in to sync your watchlist list to the cloud
            </Text>
          </View>

          {/* Tabs Control */}
          <View style={[styles.tabBar, { backgroundColor: colors.border }]}>
            <Pressable
              onPress={() => {
                setActiveTab("signin");
                setErrorMessage(null);
              }}
              style={[
                styles.tab,
                activeTab === "signin" && [
                  styles.activeTab,
                  { backgroundColor: colors.card },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "signin" ? colors.text : colors.mutedText,
                  },
                  activeTab === "signin" && styles.activeTabText,
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setActiveTab("signup");
                setErrorMessage(null);
              }}
              style={[
                styles.tab,
                activeTab === "signup" && [
                  styles.activeTab,
                  { backgroundColor: colors.card },
                ],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === "signup" ? colors.text : colors.mutedText,
                  },
                  activeTab === "signup" && styles.activeTabText,
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Messages */}
          {errorMessage && (
            <View
              style={[
                styles.messageBox,
                styles.errorBox,
                { borderColor: colors.primary },
              ]}
            >
              <Ionicons name="alert-circle" size={16} color={colors.primary} />
              <Text style={[styles.messageText, { color: colors.text }]}>
                {errorMessage}
              </Text>
            </View>
          )}

          {successMessage && (
            <View
              style={[
                styles.messageBox,
                styles.successBox,
                { borderColor: "#10B981" },
              ]}
            >
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={[styles.messageText, { color: colors.text }]}>
                {successMessage}
              </Text>
            </View>
          )}

          {/* Input Fields */}
          <View style={styles.form}>
            <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
              Email Address
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={18}
                color={colors.mutedText}
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="dummy@test.com"
                placeholderTextColor={colors.mutedText}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <Text style={[styles.inputLabel, { color: colors.mutedText }]}>
              Password
            </Text>
            <View
              style={[
                styles.inputContainer,
                { borderColor: colors.border, backgroundColor: colors.card },
              ]}
            >
              <Ionicons
                name="lock-closed-outline"
                size={18}
                color={colors.mutedText}
                style={styles.inputIcon}
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={colors.mutedText}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {/* Action Submit Button */}
            <Pressable
              onPress={activeTab === "signin" ? handleSignIn : handleSignUp}
              disabled={loading}
              style={({ pressed }) => [
                styles.submitButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed || loading ? 0.9 : 1,
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {activeTab === "signin" ? "Sign In" : "Create Account"}
                </Text>
              )}
            </Pressable>
          </View>
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
  logoContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 28,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  logoText: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  logoSubText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    fontWeight: "800",
  },
  messageBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: "#FF385C10",
  },
  successBox: {
    backgroundColor: "#10B98110",
  },
  messageText: {
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
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#FF385C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  infoCard: {
    padding: 14,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "flex-start",
    marginTop: 24,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  infoText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
});
