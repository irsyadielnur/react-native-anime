import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AnimeCard from "@/components/AnimeCard";
import AnimeGridItem from "@/components/AnimeGridItem";
import SearchBar from "@/components/SearchBar";
import SectionHeader from "@/components/SectionHeader";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Anime, jikanApi } from "@/services/jikanApi";

import ChatbotWidget from "@/components/ChatbotWidget";
import { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

// ─────────────────────────────────────────────────────────────
// MarqueeRow: smooth infinite horizontal ticker with
// scroll-reactive direction reversal (debounced)
// ─────────────────────────────────────────────────────────────
function MarqueeRow({
  items,
  baseDirection = "right",
  colors,
}: {
  items: any[];
  baseDirection: "left" | "right";
  colors: any;
}) {
  const [measured, setMeasured] = useState(false);
  const contentWidthRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  const startAnim = (dir: "left" | "right", width: number) => {
    if (width === 0) return;
    animRef.current?.stop();

    // left → goes 0 to -width
    // right → goes -width to 0
    const from = dir === "left" ? 0 : -width;
    const to = dir === "left" ? -width : 0;

    translateX.setValue(from);
    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: to,
        duration: Math.max(14000, items.length * 4000),
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animRef.current.start();
  };

  // Start once content is measured
  useEffect(() => {
    if (!measured) return;
    startAnim(baseDirection, contentWidthRef.current);
    return () => animRef.current?.stop();
  }, [measured]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!items || items.length === 0) return null;

  const renderBubble = (item: any, keyPrefix: string, idx: number) => (
    <View
      key={`${keyPrefix}-${idx}`}
      style={[
        styles.commentBubble,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.bubbleAvatar} />
      ) : (
        <View
          style={[
            styles.bubbleAvatarPlaceholder,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.bubbleAvatarText, { color: colors.primary }]}>
            {(item.username?.charAt(0) || "?").toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ marginLeft: 8 }}>
        <Text
          style={[styles.bubbleUser, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.username}{" "}
          <Text style={{ fontWeight: "400", color: colors.mutedText }}>on</Text>{" "}
          <Text style={{ fontWeight: "800" }}>{item.anime_title}</Text>
        </Text>
        <Text
          style={[styles.bubbleContent, { color: colors.mutedText }]}
          numberOfLines={2}
        >
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={{ overflow: "hidden", width: "100%" }}>
      <Animated.View
        style={{ flexDirection: "row", transform: [{ translateX }] }}
      >
        {/* Primary copy — measured */}
        <View
          style={{ flexDirection: "row" }}
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && contentWidthRef.current === 0) {
              contentWidthRef.current = w;
              setMeasured(true);
            }
          }}
        >
          {items.map((item, idx) => renderBubble(item, "a", idx))}
        </View>
        {/* Duplicate for seamless loop */}
        <View style={{ flexDirection: "row" }}>
          {items.map((item, idx) => renderBubble(item, "b", idx))}
        </View>
      </Animated.View>
    </View>
  );
}

// Static popular genres for quick access
const POPULAR_GENRES = [
  { id: 1, name: "Action", icon: "flash-outline" },
  { id: 2, name: "Adventure", icon: "compass-outline" },
  { id: 4, name: "Comedy", icon: "happy-outline" },
  { id: 8, name: "Drama", icon: "sad-outline" },
  { id: 10, name: "Fantasy", icon: "color-wand-outline" },
  { id: 22, name: "Romance", icon: "heart-outline" },
  { id: 24, name: "Sci-Fi", icon: "planet-outline" },
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [airingAnime, setAiringAnime] = useState<Anime[]>([]);
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        setShowDropdown(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isPermanentUser = !!(user && !user.is_anonymous && user.email);

  // Live comments state
  const [comments, setComments] = useState<any[]>([]);

  useEffect(() => {
    const fetchRecentComments = async () => {
      const { data, error } = await supabase
        .from("anime_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) {
        setComments(data);
      }
    };

    fetchRecentComments();

    const channel = supabase
      .channel("global-comments-explore")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "anime_comments",
        },
        (payload) => {
          setComments((prev) => [payload.new, ...prev.slice(0, 19)]);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const [loadingAiring, setLoadingAiring] = useState(true);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(() => {
      handleSearchSubmit();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Fetch initial data
  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setErrorMsg(null);
    setLoadingAiring(true);
    setLoadingPopular(true);

    try {
      // Fetch currently airing season
      const airingRes = await jikanApi.getCurrentSeason();
      setAiringAnime(airingRes.data || []);
      setLoadingAiring(false);

      // Fetch top popular anime
      const popularRes = await jikanApi.getTopAnime("bypopularity");
      setPopularAnime(popularRes.data || []);
      setLoadingPopular(false);
    } catch (error) {
      console.error("Error fetching home data:", error);
      setErrorMsg("Failed to load anime data. Tap to retry.");
      setLoadingAiring(false);
      setLoadingPopular(false);
    }
  };

  // Perform search on submit
  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setErrorMsg(null);

    try {
      const res = await jikanApi.searchAnime(searchQuery);
      setSearchResults(res.data || []);
    } catch (error) {
      console.error("Search error:", error);
      setErrorMsg("Search failed. Try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleGenrePress = (genreId: number, genreName: string) => {
    // Navigate to catalog tab with selected genre params
    router.push({
      pathname: "/catalog",
      params: { genreId: genreId.toString(), genreName },
    });
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      {showDropdown && (
        <>
          <Pressable
            style={styles.dropdownBackdrop}
            onPress={() => setShowDropdown(false)}
          />
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                top: insets.top + 55,
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setShowDropdown(false);
                router.push("/profile");
              }}
              style={styles.dropdownItem}
            >
              <Ionicons
                name="person-outline"
                size={16}
                color={colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                Profile
              </Text>
            </Pressable>

            <View
              style={[
                styles.dropdownDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <Pressable
              onPress={() => {
                setShowDropdown(false);
                router.push("/(tabs)/favorites");
              }}
              style={styles.dropdownItem}
            >
              <Ionicons
                name="heart-outline"
                size={16}
                color={colors.text}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.dropdownText, { color: colors.text }]}>
                My List
              </Text>
            </Pressable>

            <View
              style={[
                styles.dropdownDivider,
                { backgroundColor: colors.border },
              ]}
            />

            <Pressable
              onPress={async () => {
                setShowDropdown(false);
                await supabase.auth.signOut();
              }}
              style={styles.dropdownItem}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.dropdownText,
                  { color: colors.primary, fontWeight: "700" },
                ]}
              >
                Logout
              </Text>
            </Pressable>
          </View>
        </>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile/Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {(() => {
                if (!isPermanentUser) return "Konnichiwa! 👋";
                const rawName = user.user_metadata?.username || user.email?.split("@")[0] || "";
                // Split by spaces, underscores, dots or dashes, and capitalize each word
                const formattedName = rawName
                  .split(/[\s._-]+/)
                  .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join(" ");
                return `Hi, ${formattedName}! 👋`;
              })()}
            </Text>
            <Text style={[styles.subGreeting, { color: colors.mutedText }]}>
              {isPermanentUser
                ? "Your personal anime hub is active"
                : "Explore your favorite anime catalog"}
            </Text>
          </View>
          <Pressable
            onPress={() => {
              if (isPermanentUser) {
                setShowDropdown(!showDropdown);
              } else {
                router.push("/auth");
              }
            }}
            style={({ pressed }) => [
              styles.avatarBorder,
              {
                borderColor: isPermanentUser ? colors.primary : colors.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            {isPermanentUser ? (
              user.user_metadata?.avatar_url ? (
                <Image
                  source={{ uri: user.user_metadata.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {(
                      user.user_metadata?.username?.charAt(0) ||
                      user.email?.charAt(0) ||
                      "U"
                    ).toUpperCase()}
                  </Text>
                </View>
              )
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.border },
                ]}
              >
                <Ionicons name="person-outline" size={16} color={colors.text} />
              </View>
            )}
          </Pressable>
        </View>

        {/* Minimalist Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          onClear={handleClearSearch}
          placeholder="Search anime... (e.g. Naruto, Jujutsu)"
        />

        {errorMsg && (
          <Pressable
            onPress={searchQuery ? handleSearchSubmit : fetchHomeData}
            style={[
              styles.errorContainer,
              { backgroundColor: colors.card, borderColor: colors.primary },
            ]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.text }]}>
              {errorMsg}
            </Text>
          </Pressable>
        )}

        {/* Conditional Layout: Search Results vs Explore Content */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.sectionContainer}>
            <SectionHeader title={`Search Results for "${searchQuery}"`} />

            {isSearching ? (
              <SkeletonLoader variant="grid" count={4} />
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={colors.mutedText}
                />
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  No anime found. Try another query or press enter.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {searchResults.map((item, index) => {
                  if (!item) return null;
                  return (
                    <AnimeGridItem
                      key={`search-${item?.mal_id || ""}-${index}`}
                      anime={item}
                    />
                  );
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Horizontal Genre Carousel */}
            <View style={styles.genreSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreScroll}
              >
                {POPULAR_GENRES.map((genre) => (
                  <Pressable
                    key={genre.id}
                    onPress={() => handleGenrePress(genre.id, genre.name)}
                    style={({ pressed }) => [
                      styles.genrePill,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      name={genre.icon as any}
                      size={16}
                      color={colors.primary}
                      style={styles.genreIcon}
                    />
                    <Text style={[styles.genreText, { color: colors.text }]}>
                      {genre.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Currently Airing Now (Horizontal Carousel) */}
            <View style={styles.sectionContainer}>
              <SectionHeader
                title="Airing This Season"
                showSeeAll
                onPressSeeAll={() =>
                  router.push({
                    pathname: "/catalog",
                    params: { filter: "airing" },
                  })
                }
              />
              {loadingAiring ? (
                <View style={styles.horizontalLoader}>
                  <SkeletonLoader variant="grid" count={2} />
                </View>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalList}
                >
                  {airingAnime.map((item, index) => {
                    if (!item) return null;
                    return (
                      <View
                        key={`airing-${item?.mal_id || ""}-${index}`}
                        style={styles.airingItemContainer}
                      >
                        <AnimeGridItem anime={item} fullWidth />
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Popular Hits (Vertical List) */}
            <View style={styles.sectionContainer}>
              <SectionHeader
                title="Popular Anime Hits"
                showSeeAll
                onPressSeeAll={() =>
                  router.push({
                    pathname: "/catalog",
                    params: { filter: "bypopularity" },
                  })
                }
              />
              {loadingPopular ? (
                <SkeletonLoader variant="card" count={4} />
              ) : (
                <View style={styles.verticalList}>
                  {popularAnime.slice(0, 10).map((item, index) => {
                    if (!item) return null;
                    return (
                      <AnimeCard
                        key={`popular-${item?.mal_id || ""}-${index}`}
                        anime={item}
                      />
                    );
                  })}
                </View>
              )}
            </View>

            {/* Live User Comments Section */}
            {comments.length > 0 && (
              <View
                style={[
                  styles.sectionContainer,
                  { marginTop: 24, marginBottom: 12 },
                ]}
              >
                <SectionHeader title="Live User Comments 💬" />
                <View style={styles.marqueeSectionWrapper}>
                  {comments.length <= 5 ? (
                    <MarqueeRow
                      items={comments}
                      baseDirection="right"
                      colors={colors}
                    />
                  ) : (
                    <>
                      <MarqueeRow
                        items={comments.slice(
                          0,
                          Math.ceil(comments.length / 2),
                        )}
                        baseDirection="right"
                        colors={colors}
                      />
                      <View style={{ height: 8 }} />
                      <MarqueeRow
                        items={comments.slice(Math.ceil(comments.length / 2))}
                        baseDirection="left"
                        colors={colors}
                      />
                    </>
                  )}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
      <ChatbotWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "800",
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "transparent",
    zIndex: 998,
  },
  dropdownMenu: {
    position: "absolute",
    right: 16,
    width: 145,
    borderRadius: 14,
    borderWidth: 1,
    padding: 6,
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  dropdownText: {
    fontSize: 13,
    fontWeight: "700",
  },
  dropdownDivider: {
    height: 1,
    marginHorizontal: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  genreSection: {
    marginVertical: 4,
  },
  genreScroll: {
    paddingVertical: 6,
  },
  genrePill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  genreIcon: {
    marginRight: 6,
  },
  genreText: {
    fontSize: 13,
    fontWeight: "700",
  },
  sectionContainer: {
    marginTop: 10,
  },
  horizontalLoader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  horizontalList: {
    paddingVertical: 4,
  },
  airingItemContainer: {
    width: 145,
    marginRight: 14,
  },
  verticalList: {
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  marqueeSectionWrapper: {
    marginTop: 8,
    overflow: "hidden",
    width: "100%",
  },
  marqueeRowContainer: {
    overflow: "hidden",
    width: "100%",
  },
  marqueeAnimatedRow: {
    flexDirection: "row",
  },
  commentBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    minWidth: 220,
    maxWidth: 280,
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  bubbleAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleAvatarText: {
    fontSize: 13,
    fontWeight: "800",
  },
  bubbleUser: {
    fontSize: 11,
    fontWeight: "700",
    maxWidth: 160,
  },
  bubbleContent: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
    maxWidth: 160,
  },
});
