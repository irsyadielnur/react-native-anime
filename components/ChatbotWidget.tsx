import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeOutDown,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { askGemini, GeminiHistoryMessage } from "@/services/gemini";
import { Anime, jikanApi } from "@/services/jikanApi";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  recommendations?: Anime[];
  loadingRecs?: boolean;
  isNew?: boolean;
}

// Typing Text Effect for word-by-word animation
function TypingText({
  text,
  onComplete,
}: {
  text: string;
  onComplete?: () => void;
}) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    const words = text.split(" ");
    let currentIdx = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        setDisplayedText(
          (prev) => (prev ? prev + " " : "") + words[currentIdx],
        );
        currentIdx++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 70); // 70ms per word is smooth and readable

    return () => clearInterval(interval);
  }, [text]);

  return <Text style={styles.messageText}>{displayedText}</Text>;
}

export default function ChatbotWidget() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      sender: "bot",
      text:
        colorScheme === "dark"
          ? "Konnichiwa! 🌌 Saya Aiki, asisten AI anime kamu. Ada rekomendasi anime yang ingin kamu tanyakan hari ini?"
          : "Konnichiwa! 🌸 Saya Aiki, asisten AI anime kamu. Mau cari rekomendasi anime seru hari ini?",
      isNew: true,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll to bottom on open or when messages list grows
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 350);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);

  // Keyboard show listener to scroll chat to bottom
  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 150);
      },
    );
    return () => showSubscription.remove();
  }, []);

  // Android hardware back button handler to close chatbot
  useEffect(() => {
    const backAction = () => {
      if (isOpen) {
        setIsOpen(false);
        return true; // handled
      }
      return false; // let default behavior happen
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isOpen]);

  // Clear / Reset Conversation
  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "bot",
        text:
          colorScheme === "dark"
            ? "Halo lagi! 🌌 Chat telah di-reset. Ada rekomendasi anime lain yang ingin kamu tanyakan?"
            : "Halo lagi! 🌸 Chat telah di-reset. Mau cari rekomendasi anime seru apa sekarang?",
        isNew: true,
      },
    ]);
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userText = inputText.trim();
    setInputText("");

    // Add user message
    const userMsgId = `user-${Date.now()}`;
    const newMessages = [
      ...messages,
      { id: userMsgId, sender: "user" as const, text: userText },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Build FULL conversation history for complete context (excluding welcome)
      const fullHistory = messages
        .filter((msg) => !msg.id.startsWith("welcome"))
        .map(
          (msg): GeminiHistoryMessage => ({
            role: msg.sender === "user" ? "user" : "model",
            parts: [{ text: msg.text }],
          }),
        );

      // Call Gemini AI API
      const response = await askGemini(userText, fullHistory);

      const botMsgId = `bot-${Date.now()}`;
      const botMsgPlaceholder: ChatMessage = {
        id: botMsgId,
        sender: "bot",
        text: response.reply,
        isNew: true,
      };

      if (response.searchQuery) {
        botMsgPlaceholder.loadingRecs = true;
        setMessages((prev) => [...prev, botMsgPlaceholder]);

        // Fetch recommendations from Jikan optimized for relevance
        try {
          const JikanRes = await jikanApi.searchAnimeForChat(
            response.searchQuery,
          );
          const recAnimeList = JikanRes.data?.slice(0, 6) || []; // limit to 6 cards

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId
                ? { ...msg, recommendations: recAnimeList, loadingRecs: false }
                : msg,
            ),
          );
        } catch (jikanErr) {
          console.error("Failed to fetch bot recommended anime:", jikanErr);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === botMsgId ? { ...msg, loadingRecs: false } : msg,
            ),
          );
        }
      } else {
        setMessages((prev) => [...prev, botMsgPlaceholder]);
      }
    } catch (err) {
      console.error("Chatbot response error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: "bot",
          text: "Gomen, sepertinya saya kesulitan menghubungi server otak AI saya. Coba tanya lagi ya!",
          isNew: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = (animeId: number) => {
    setIsOpen(false);
    router.push(`/anime/${animeId}`);
  };

  const renderAnimeCard = (anime: Anime, index: number) => {
    const imageUrl =
      anime.images?.webp?.large_image_url ||
      anime.images?.jpg?.large_image_url ||
      "";

    return (
      <Animated.View
        key={`bot-rec-${anime.mal_id}-${index}`}
        entering={FadeInRight.delay(index * 120)}
        style={[
          styles.miniCard,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Pressable onPress={() => handleCardPress(anime.mal_id)}>
          <Image source={{ uri: imageUrl }} style={styles.miniCardImage} />
          {anime.score && (
            <View
              style={[styles.scoreBadge, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="star" size={10} color="#FFFFFF" />
              <Text style={styles.scoreText}>{anime.score.toFixed(1)}</Text>
            </View>
          )}
          <View style={styles.miniCardInfo}>
            <Text
              style={[styles.miniCardTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {anime.title}
            </Text>
            <Text
              style={[styles.miniCardEpisodes, { color: colors.mutedText }]}
              numberOfLines={1}
            >
              {anime.type || "TV"} •{" "}
              {anime.episodes ? `${anime.episodes} eps` : "? eps"}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderMessageItem = ({ item }: { item: ChatMessage }) => {
    const isBot = item.sender === "bot";

    return (
      <Animated.View
        entering={FadeInDown.duration(300)}
        layout={Layout.springify()}
        style={[styles.messageRow, isBot ? styles.botRow : styles.userRow]}
      >
        {isBot && (
          <View
            style={[
              styles.avatarPlaceholder,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="sparkles" size={16} color={colors.primary} />
          </View>
        )}
        <View style={styles.bubbleContainer}>
          <View
            style={[
              styles.messageBubble,
              isBot
                ? [
                    styles.botBubble,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]
                : [styles.userBubble, { backgroundColor: colors.primary }],
            ]}
          >
            {isBot && item.isNew ? (
              <TypingText
                text={item.text}
                onComplete={() => {
                  // Remove isNew flag so it doesn't re-animate on scroll
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === item.id ? { ...msg, isNew: false } : msg,
                    ),
                  );
                }}
              />
            ) : (
              <Text
                style={[
                  styles.messageText,
                  { color: isBot ? colors.text : "#FFFFFF" },
                ]}
              >
                {item.text}
              </Text>
            )}
          </View>

          {/* Render Recommendations list below bot bubble */}
          {isBot && item.loadingRecs && (
            <View style={styles.recLoader}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text
                style={[styles.loadingRecText, { color: colors.mutedText }]}
              >
                Mencari rekomendasi anime...
              </Text>
            </View>
          )}

          {isBot && item.recommendations && item.recommendations.length > 0 && (
            <View style={styles.recContainer}>
              <Text style={[styles.recTitle, { color: colors.mutedText }]}>
                Rekomendasi Anime:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
              >
                {item.recommendations.map((anime, idx) =>
                  renderAnimeCard(anime, idx),
                )}
              </ScrollView>
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      {!isOpen && (
        <Animated.View
          entering={ZoomIn.delay(500)}
          style={[
            styles.fabContainer,
            { bottom: 10 + insets.bottom }, // Positioned safely above the bottom navigation bar
          ]}
        >
          <Pressable
            onPress={() => setIsOpen(true)}
            style={({ pressed }) => [
              styles.fabButton,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}

      {/* Full-Screen Chat Overlay Drawer */}
      {isOpen && (
        <Animated.View
          entering={FadeInDown.duration(350)}
          exiting={FadeOutDown.duration(300)}
          style={[styles.fullOverlay, { backgroundColor: colors.background }]}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  paddingTop: Math.max(insets.top, 16),
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={styles.headerInfo}>
                <View
                  style={[
                    styles.headerAvatar,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Aiki AI
                  </Text>
                  <Text style={[styles.headerStatus, { color: "#10B981" }]}>
                    Active Assistant
                  </Text>
                </View>
              </View>
              <View style={styles.headerRightActions}>
                <Pressable
                  onPress={handleResetChat}
                  style={[styles.headerActionBtn, { marginRight: 3 }]}
                >
                  <Ionicons
                    name="refresh-circle-outline"
                    size={24}
                    color={colors.primary}
                  />
                </Pressable>
                <Pressable
                  onPress={() => setIsOpen(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={colors.text} />
                </Pressable>
              </View>
            </View>

            {/* Messages List Area (flex: 1 so it shrinks when keyboard rises) */}
            <View style={{ flex: 1 }}>
              <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessageItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.messageList,
                  { paddingBottom: insets.bottom + 20 },
                ]}
                showsVerticalScrollIndicator={false}
              />
            </View>

            {/* Input Bar */}
            <View
              style={[
                styles.inputBar,
                {
                  borderTopColor: colors.border,
                  backgroundColor: colors.card,
                  paddingBottom: Math.max(insets.bottom, 10),
                },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Tanya Aiki AI..."
                placeholderTextColor={colors.mutedText}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={400}
              />
              <Pressable
                onPress={handleSend}
                disabled={!inputText.trim() || loading}
                style={({ pressed }) => [
                  styles.sendButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed || !inputText.trim() || loading ? 0.7 : 1,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    right: 10,
    zIndex: 999,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  fullOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerStatus: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    width: "100%",
  },
  botRow: {
    justifyContent: "flex-start",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 4,
  },
  bubbleContainer: {
    maxWidth: "82%",
  },
  messageBubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  botBubble: {
    borderWidth: 1,
    borderTopLeftRadius: 4,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 14,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 1,
  },
  recLoader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingLeft: 4,
  },
  loadingRecText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 8,
  },
  recContainer: {
    marginTop: 10,
    width: "120%", // Allow overflow of scroll bounds
  },
  recTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
    paddingLeft: 4,
  },
  horizontalScroll: {
    paddingLeft: 4,
    paddingRight: 60, // padding for overflow
    paddingVertical: 4,
  },
  miniCard: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 10,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  miniCardImage: {
    width: "100%",
    height: 140,
    resizeMode: "cover",
  },
  scoreBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    marginLeft: 3,
  },
  miniCardInfo: {
    padding: 8,
  },
  miniCardTitle: {
    fontSize: 11,
    fontWeight: "800",
  },
  miniCardEpisodes: {
    fontSize: 9,
    fontWeight: "500",
    marginTop: 3,
  },
});
