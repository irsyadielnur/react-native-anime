import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatbotWidget from "@/components/ChatbotWidget";

import SkeletonLoader from "@/components/SkeletonLoader";
import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useFavorites } from "@/context/FavoritesContext";
import {
  Anime,
  CharacterInfo,
  jikanApi,
  RecommendationInfo,
} from "@/services/jikanApi";

import { supabase } from "../../lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AnimeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const animeId = parseInt(id, 10);

  // States
  const [anime, setAnime] = useState<Anime | null>(null);
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationInfo[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSynopsisExpanded, setIsSynopsisExpanded] = useState(false);

  // Comments States
  const [user, setUser] = useState<User | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Ref for auto-scroll when keyboard opens — MUST be declared before any early returns
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch current user auth state and comments
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    const fetchComments = async () => {
      const { data, error } = await supabase
        .from("anime_comments")
        .select("*")
        .eq("anime_id", animeId)
        .order("created_at", { ascending: false });
      if (data) {
        setComments(data);
      }
    };
    fetchComments();

    const channel = supabase
      .channel(`comments-channel-${animeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "anime_comments",
          filter: `anime_id=eq.${animeId}`,
        },
        (payload) => {
          setComments((prev) => {
            // Avoid duplicate if already added optimistically (same content + username within 5s)
            const alreadyExists = prev.some(
              (c) =>
                c.id === payload.new.id ||
                (c.content === payload.new.content &&
                  c.username === payload.new.username &&
                  Math.abs(
                    new Date(c.created_at).getTime() -
                      new Date(payload.new.created_at).getTime()
                  ) < 5000)
            );
            if (alreadyExists) return prev;
            return [payload.new, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      channel.unsubscribe();
    };
  }, [animeId]);

  const handlePostComment = async () => {
    if (!commentText.trim()) return;

    setPostingComment(true);

    const isPermanent = !!(user && !user.is_anonymous && user.email);
    let authorName = "Guest";
    let authorAvatar = null;

    if (isPermanent) {
      authorName = user.user_metadata?.username || user.email?.split("@")[0] || "User";
      authorAvatar = user.user_metadata?.avatar_url || null;
    } else {
      authorName = guestName.trim() || "Guest";
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticComment = {
      id: optimisticId,
      anime_id: animeId,
      anime_title: anime?.title || "Unknown Anime",
      user_id: isPermanent ? user?.id : null,
      username: authorName,
      avatar_url: authorAvatar,
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    };

    // Immediately show the comment (optimistic)
    setComments((prev) => [optimisticComment, ...prev]);
    setCommentText("");

    try {
      const { data, error } = await supabase
        .from("anime_comments")
        .insert({
          anime_id: animeId,
          anime_title: anime?.title || "Unknown Anime",
          user_id: isPermanent ? user?.id : null,
          username: authorName,
          avatar_url: authorAvatar,
          content: optimisticComment.content,
        })
        .select()
        .single();

      if (error) throw error;

      // Replace the optimistic placeholder with the real record
      if (data) {
        setComments((prev) =>
          prev.map((c) => (c.id === optimisticId ? data : c))
        );
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
      // Remove the optimistic comment on failure
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
    } finally {
      setPostingComment(false);
    }
  };

  // Favorites Hook
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const favorited = anime ? isFavorite(anime.mal_id) : false;

  useEffect(() => {
    loadAnimeData();
  }, [id]);

  const loadAnimeData = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch Anime Main Info
      const detailsRes = await jikanApi.getAnimeDetails(animeId);
      setAnime(detailsRes.data);

      // Stagger fetches slightly (300ms) to avoid triggering 429 Jikan rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 2. Fetch Characters
      const charRes = await jikanApi.getAnimeCharacters(animeId);
      setCharacters(charRes.data || []);

      await new Promise((resolve) => setTimeout(resolve, 300));

      // 3. Fetch Recommendations
      const recRes = await jikanApi.getAnimeRecommendations(animeId);
      setRecommendations(recRes.data || []);
    } catch (error) {
      console.error("Failed to load anime detail screen data:", error);
      setErrorMsg("Failed to load anime details. Tap here to retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = async () => {
    if (!anime) return;
    if (favorited) {
      await removeFavorite(anime.mal_id);
    } else {
      await addFavorite(anime);
    }
  };

  const handleShare = async () => {
    if (!anime) return;
    try {
      await Share.share({
        message: `Check out ${anime.title} on Jikan! Score: ${anime.score || "N/A"}\n${anime.url}`,
        title: anime.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        {/* Absolute Header Overlay just for Back Button while loading */}
        <View style={[styles.loadingHeader, { top: insets.top + 10 }]}>
          <Pressable onPress={() => router.back()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={22} color="#1A1D20" />
          </Pressable>
        </View>
        <ScrollView style={styles.scroll}>
          <SkeletonLoader variant="detail" />
        </ScrollView>
      </View>
    );
  }

  if (errorMsg || !anime) {
    return (
      <View
        style={[styles.errorContainer, { backgroundColor: colors.background }]}
      >
        <Ionicons name="alert-circle" size={48} color={colors.primary} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Oops!</Text>
        <Text style={[styles.errorText, { color: colors.mutedText }]}>
          {errorMsg || "Anime not found"}
        </Text>
        <Pressable
          onPress={loadAnimeData}
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  const imageUrl =
    anime.images?.webp?.large_image_url ||
    anime.images?.jpg?.large_image_url ||
    "";
  const score = anime.score ? anime.score.toFixed(1) : "N/A";
  const scoreCount = anime.scored_by ? anime.scored_by.toLocaleString() : "0";
  const studios = anime.studios?.map((s) => s.name).join(", ") || "N/A";
  const genres = anime.genres || [];

  const handleCommentFocus = () => {
    // Delay slightly so keyboard has time to measure its height
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero Banner Section */}
        <View style={styles.heroSection}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.backdropImage}
            blurRadius={Platform.OS === "ios" ? 12 : 6}
          />
          <View style={styles.backdropOverlay} />

          {/* Main Poster over Blur Backdrop */}
          <View style={styles.posterContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.posterImage}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* Title, Genres & Info Card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.animeTitle, { color: colors.text }]}>
            {anime.title}
          </Text>
          {anime.title_japanese && (
            <Text style={[styles.japaneseTitle, { color: colors.mutedText }]}>
              {anime.title_japanese}
            </Text>
          )}

          {/* Genres row */}
          {genres.length > 0 && (
            <View style={styles.genresRow}>
              {genres.map((genre) => (
                <Pressable
                  key={genre.mal_id}
                  onPress={() => {
                    // Go to catalog with genre parameters
                    router.dismissAll();
                    router.push({
                      pathname: "/catalog",
                      params: {
                        genreId: genre.mal_id.toString(),
                        genreName: genre.name,
                      },
                    });
                  }}
                  style={[
                    styles.genreBadge,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[styles.genreBadgeText, { color: colors.mutedText }]}
                  >
                    {genre.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Quick Metrics (Score, Rank, Popularity) */}
          <View style={styles.metricsRow}>
            <View
              style={[
                styles.metricItem,
                { backgroundColor: colors.background },
              ]}
            >
              <View style={styles.metricHeader}>
                <Ionicons name="star" size={14} color={colors.rating} />
                <Text style={[styles.metricValue, { color: colors.text }]}>
                  {score}
                </Text>
              </View>
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
                {scoreCount} reviews
              </Text>
            </View>

            <View
              style={[
                styles.metricItem,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.text }]}>
                #{anime.rank || "N/A"}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
                Ranked
              </Text>
            </View>

            <View
              style={[
                styles.metricItem,
                { backgroundColor: colors.background },
              ]}
            >
              <Text style={[styles.metricValue, { color: colors.text }]}>
                #{anime.popularity || "N/A"}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
                Popularity
              </Text>
            </View>

            <View
              style={[
                styles.metricItem,
                { backgroundColor: colors.background },
              ]}
            >
              <Text
                style={[
                  styles.metricValue,
                  { color: colors.text, textTransform: "uppercase" },
                ]}
              >
                {anime.type || "TV"}
              </Text>
              <Text style={[styles.metricLabel, { color: colors.mutedText }]}>
                Format
              </Text>
            </View>
          </View>
        </View>

        {/* Synopsis Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Synopsis
          </Text>
          <Text
            style={[styles.synopsisText, { color: colors.text }]}
            numberOfLines={isSynopsisExpanded ? undefined : 5}
          >
            {anime.synopsis || "No synopsis available for this anime."}
          </Text>
          {anime.synopsis && anime.synopsis.length > 220 && (
            <Pressable
              onPress={() => setIsSynopsisExpanded(!isSynopsisExpanded)}
              style={styles.readMoreButton}
            >
              <Text style={[styles.readMoreText, { color: colors.primary }]}>
                {isSynopsisExpanded ? "Read Less" : "Read Full Synopsis"}
              </Text>
              <Ionicons
                name={isSynopsisExpanded ? "chevron-up" : "chevron-down"}
                size={14}
                color={colors.primary}
                style={styles.chevronIcon}
              />
            </Pressable>
          )}
        </View>

        {/* Specifications Grid */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Details Info
          </Text>
          <View style={[styles.specsTable, { borderColor: colors.border }]}>
            <View
              style={[styles.specRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.specColumn}>
                <Text style={[styles.specLabel, { color: colors.mutedText }]}>
                  Status
                </Text>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {anime.status || "N/A"}
                </Text>
              </View>
              <View style={styles.specColumn}>
                <Text style={[styles.specLabel, { color: colors.mutedText }]}>
                  Studio
                </Text>
                <Text
                  style={[styles.specVal, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {studios}
                </Text>
              </View>
            </View>

            <View
              style={[styles.specRow, { borderBottomColor: colors.border }]}
            >
              <View style={styles.specColumn}>
                <Text style={[styles.specLabel, { color: colors.mutedText }]}>
                  Episodes
                </Text>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {anime.episodes ?? "N/A"}
                </Text>
              </View>
              <View style={styles.specColumn}>
                <Text style={[styles.specLabel, { color: colors.mutedText }]}>
                  Source
                </Text>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {anime.source || "N/A"}
                </Text>
              </View>
            </View>

            <View style={styles.specRow}>
              <View style={styles.specColumn}>
                <Text style={[styles.specLabel, { color: colors.mutedText }]}>
                  Premiered
                </Text>
                <Text style={[styles.specVal, { color: colors.text }]}>
                  {anime.season ? `${anime.season} ${anime.year}` : "N/A"}
                </Text>
              </View>
              <View style={styles.specColumn}>
                <Text style={[styles.specLabel, { color: colors.mutedText }]}>
                  Rating
                </Text>
                <Text
                  style={[styles.specVal, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {anime.rating || "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Characters Section */}
        {characters.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Characters
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {characters.slice(0, 15).map((char, idx) => {
                const avatar =
                  char.character?.images?.webp?.image_url ||
                  char.character?.images?.jpg?.image_url ||
                  "";
                return (
                  <View key={idx} style={styles.characterCard}>
                    <Image
                      source={{ uri: avatar }}
                      style={styles.characterAvatar}
                    />
                    <Text
                      style={[styles.characterName, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {char.character?.name || "Unknown"}
                    </Text>
                    <Text
                      style={[
                        styles.characterRole,
                        { color: colors.mutedText },
                      ]}
                    >
                      {char.role || "Supporting"}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommended For You
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {recommendations.slice(0, 10).map((rec, idx) => {
                const recImage =
                  rec.entry?.images?.webp?.large_image_url ||
                  rec.entry?.images?.jpg?.large_image_url ||
                  "";
                return (
                  <Pressable
                    key={idx}
                    onPress={() =>
                      rec.entry?.mal_id &&
                      router.push(`/anime/${rec.entry.mal_id}` as any)
                    }
                    style={styles.recCard}
                  >
                    <Image
                      source={{ uri: recImage }}
                      style={styles.recImage}
                      resizeMode="cover"
                    />
                    <Text
                      style={[styles.recTitle, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {rec.entry?.title || "Unknown Title"}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Comments Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Discussions ({comments.length})
          </Text>

          {/* Comment Form */}
          <View style={[styles.commentFormCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.commentFormTitle, { color: colors.text }]}>Join the Buzz</Text>
            
            {!user || user.is_anonymous ? (
              <TextInput
                value={guestName}
                onChangeText={setGuestName}
                onFocus={handleCommentFocus}
                placeholder="Your Name (e.g. OtakuLover)"
                placeholderTextColor={colors.mutedText}
                maxLength={20}
                style={[styles.guestNameInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              />
            ) : (
              <View style={styles.commentUserBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={[styles.commentUserBadgeText, { color: "#10B981" }]}>
                  Posting as: {user.user_metadata?.username || user.email?.split("@")[0]}
                </Text>
              </View>
            )}

            <View style={[styles.commentInputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                onFocus={handleCommentFocus}
                placeholder="Share your thoughts..."
                placeholderTextColor={colors.mutedText}
                multiline
                maxLength={300}
                style={[styles.commentInput, { color: colors.text }]}
              />
              <Pressable
                onPress={handlePostComment}
                disabled={postingComment || !commentText.trim()}
                style={({ pressed }) => [
                  styles.commentSubmitButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: pressed || postingComment || !commentText.trim() ? 0.7 : 1,
                  }
                ]}
              >
                {postingComment ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="send" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          {/* Comments List */}
          <View style={styles.commentsList}>
            {comments.length === 0 ? (
              <Text style={[styles.noCommentsText, { color: colors.mutedText }]}>
                No comments yet. Start the conversation!
              </Text>
            ) : (
              comments.map((comment) => (
                <View
                  key={comment.id}
                  style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  {comment.avatar_url ? (
                    <Image source={{ uri: comment.avatar_url }} style={styles.commentCardAvatar} />
                  ) : (
                    <View style={[styles.commentCardAvatarPlaceholder, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.commentCardAvatarText, { color: colors.primary }]}>
                        {(comment.username?.charAt(0) || "?").toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.commentCardBody}>
                    <View style={styles.commentCardHeader}>
                      <Text style={[styles.commentCardUsername, { color: colors.text }]} numberOfLines={1}>
                        {comment.username}
                      </Text>
                      {comment.user_id && (
                        <View style={[styles.verifiedBadge, { backgroundColor: "#10B981" }]}>
                          <Text style={styles.verifiedText}>User</Text>
                        </View>
                      )}
                      <Text style={[styles.commentCardTime, { color: colors.mutedText }]}>
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text
                      style={[styles.commentCardContent, { color: colors.text }]}
                      numberOfLines={2}
                    >
                      {comment.content}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Absolute Header Overlay */}
      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.headerRightActions}>
          <Pressable
            onPress={handleShare}
            style={[styles.iconButton, styles.headerActionButton]}
          >
            <Ionicons name="share-social-outline" size={21} color="#FFFFFF" />
          </Pressable>
          <Pressable onPress={handleFavoriteToggle} style={styles.iconButton}>
            <Ionicons
              name={favorited ? "heart" : "heart-outline"}
              size={22}
              color={favorited ? colors.primary : "#FFFFFF"}
            />
          </Pressable>
        </View>
      </View>
      <ChatbotWidget />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingHeader: {
    position: "absolute",
    left: 16,
    zIndex: 10,
  },
  headerOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
    backgroundColor: "transparent",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  headerActionButton: {
    marginRight: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSection: {
    height: 250,
    position: "relative",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "#000",
  },
  backdropImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.5,
  },
  backdropOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  posterContainer: {
    width: 130,
    aspectRatio: 11 / 16,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    bottom: -30,
    zIndex: 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  infoCard: {
    marginTop: 46,
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
  },
  animeTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  japaneseTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
  },
  genreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 0.5,
    margin: 3,
  },
  genreBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 18,
  },
  metricItem: {
    width: "23%",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "800",
    marginLeft: 2,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
    textAlign: "center",
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  synopsisText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
  },
  readMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  chevronIcon: {
    marginLeft: 4,
  },
  specsTable: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  specRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  specColumn: {
    flex: 1,
    padding: 12,
    backgroundColor: "transparent",
  },
  specLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  specVal: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  horizontalScroll: {
    paddingVertical: 4,
    paddingRight: 16,
  },
  characterCard: {
    width: 80,
    marginRight: 14,
    alignItems: "center",
  },
  characterAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EAECEF",
  },
  characterName: {
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 6,
  },
  characterRole: {
    fontSize: 9,
    fontWeight: "600",
    marginTop: 2,
  },
  recCard: {
    width: 110,
    marginRight: 14,
  },
  recImage: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    backgroundColor: "#EAECEF",
  },
  recTitle: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  commentFormCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  commentFormTitle: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 10,
  },
  guestNameInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
  },
  commentUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "transparent",
  },
  commentUserBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  commentInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    maxHeight: 80,
    paddingTop: 4,
    paddingBottom: 4,
  },
  commentSubmitButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  commentsList: {
    marginTop: 10,
    backgroundColor: "transparent",
  },
  noCommentsText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 20,
  },
  commentCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  commentCardAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  commentCardAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  commentCardAvatarText: {
    fontSize: 14,
    fontWeight: "800",
  },
  commentCardBody: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "transparent",
  },
  commentCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    backgroundColor: "transparent",
  },
  commentCardUsername: {
    fontSize: 12,
    fontWeight: "800",
    maxWidth: 100,
  },
  verifiedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  verifiedText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  commentCardTime: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: "auto",
  },
  commentCardContent: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
});
