<<<<<<< HEAD
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
=======
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
  Image,
  StatusBar,
  View,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { jikanApi, Anime } from '@/services/jikanApi';
import SearchBar from '@/components/SearchBar';
import SectionHeader from '@/components/SectionHeader';
import SkeletonLoader from '@/components/SkeletonLoader';
import AnimeCard from '@/components/AnimeCard';
import AnimeGridItem from '@/components/AnimeGridItem';

import { supabase } from '../../lib/supabase';
import { User } from '@supabase/supabase-js';
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b

// ─────────────────────────────────────────────────────────────
// MarqueeRow: smooth infinite horizontal ticker with
// scroll-reactive direction reversal (debounced)
// ─────────────────────────────────────────────────────────────
function MarqueeRow({
  items,
<<<<<<< HEAD
  baseDirection = "right",
  colors,
}: {
  items: any[];
  baseDirection: "left" | "right";
=======
  baseDirection = 'right',
  scrollDirection,
  colors,
}: {
  items: any[];
  baseDirection: 'left' | 'right';
  scrollDirection: 'up' | 'down';
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
  colors: any;
}) {
  const [measured, setMeasured] = useState(false);
  const contentWidthRef = useRef(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
<<<<<<< HEAD

  const startAnim = (dir: "left" | "right", width: number) => {
=======
  const prevDir = useRef<'left' | 'right'>(baseDirection);

  // Effective direction: reverse base when user scrolls up
  const effectiveDir: 'left' | 'right' =
    scrollDirection === 'up'
      ? baseDirection === 'right' ? 'left' : 'right'
      : baseDirection;

  const startAnim = (dir: 'left' | 'right', width: number) => {
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    if (width === 0) return;
    animRef.current?.stop();

    // left → goes 0 to -width
    // right → goes -width to 0
<<<<<<< HEAD
    const from = dir === "left" ? 0 : -width;
    const to = dir === "left" ? -width : 0;
=======
    const from = dir === 'left' ? 0 : -width;
    const to   = dir === 'left' ? -width : 0;
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b

    translateX.setValue(from);
    animRef.current = Animated.loop(
      Animated.timing(translateX, {
        toValue: to,
        duration: Math.max(14000, items.length * 4000),
        easing: Easing.linear,
        useNativeDriver: true,
<<<<<<< HEAD
      }),
=======
      })
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    );
    animRef.current.start();
  };

  // Start once content is measured
  useEffect(() => {
    if (!measured) return;
<<<<<<< HEAD
    startAnim(baseDirection, contentWidthRef.current);
    return () => animRef.current?.stop();
  }, [measured]); // eslint-disable-line react-hooks/exhaustive-deps

=======
    startAnim(effectiveDir, contentWidthRef.current);
    prevDir.current = effectiveDir;
    return () => animRef.current?.stop();
  }, [measured]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reverse direction when effectiveDir changes (after measure)
  useEffect(() => {
    if (!measured) return;
    if (prevDir.current === effectiveDir) return;
    prevDir.current = effectiveDir;
    startAnim(effectiveDir, contentWidthRef.current);
  }, [effectiveDir]); // eslint-disable-line react-hooks/exhaustive-deps

>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
  if (!items || items.length === 0) return null;

  const renderBubble = (item: any, keyPrefix: string, idx: number) => (
    <View
      key={`${keyPrefix}-${idx}`}
<<<<<<< HEAD
      style={[
        styles.commentBubble,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
=======
      style={[styles.commentBubble, { backgroundColor: colors.card, borderColor: colors.border }]}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    >
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.bubbleAvatar} />
      ) : (
<<<<<<< HEAD
        <View
          style={[
            styles.bubbleAvatarPlaceholder,
            { backgroundColor: colors.primary + "15" },
          ]}
        >
          <Text style={[styles.bubbleAvatarText, { color: colors.primary }]}>
            {(item.username?.charAt(0) || "?").toUpperCase()}
=======
        <View style={[styles.bubbleAvatarPlaceholder, { backgroundColor: colors.primary + '15' }]}>
          <Text style={[styles.bubbleAvatarText, { color: colors.primary }]}>
            {(item.username?.charAt(0) || '?').toUpperCase()}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
          </Text>
        </View>
      )}
      <View style={{ marginLeft: 8 }}>
<<<<<<< HEAD
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
=======
        <Text style={[styles.bubbleUser, { color: colors.text }]} numberOfLines={1}>
          {item.username}{' '}
          <Text style={{ fontWeight: '400', color: colors.mutedText }}>on</Text>{' '}
          <Text style={{ fontWeight: '800' }}>{item.anime_title}</Text>
        </Text>
        <Text style={[styles.bubbleContent, { color: colors.mutedText }]} numberOfLines={1}>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
          {item.content}
        </Text>
      </View>
    </View>
  );

  return (
<<<<<<< HEAD
    <View style={{ overflow: "hidden", width: "100%" }}>
      <Animated.View
        style={{ flexDirection: "row", transform: [{ translateX }] }}
      >
        {/* Primary copy — measured */}
        <View
          style={{ flexDirection: "row" }}
=======
    <View style={{ overflow: 'hidden', width: '100%' }}>
      <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
        {/* Primary copy — measured */}
        <View
          style={{ flexDirection: 'row' }}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
          onLayout={(e) => {
            const w = e.nativeEvent.layout.width;
            if (w > 0 && contentWidthRef.current === 0) {
              contentWidthRef.current = w;
              setMeasured(true);
            }
          }}
        >
<<<<<<< HEAD
          {items.map((item, idx) => renderBubble(item, "a", idx))}
        </View>
        {/* Duplicate for seamless loop */}
        <View style={{ flexDirection: "row" }}>
          {items.map((item, idx) => renderBubble(item, "b", idx))}
=======
          {items.map((item, idx) => renderBubble(item, 'a', idx))}
        </View>
        {/* Duplicate for seamless loop */}
        <View style={{ flexDirection: 'row' }}>
          {items.map((item, idx) => renderBubble(item, 'b', idx))}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
        </View>
      </Animated.View>
    </View>
  );
}

// Static popular genres for quick access
const POPULAR_GENRES = [
<<<<<<< HEAD
  { id: 1, name: "Action", icon: "flash-outline" },
  { id: 2, name: "Adventure", icon: "compass-outline" },
  { id: 4, name: "Comedy", icon: "happy-outline" },
  { id: 8, name: "Drama", icon: "sad-outline" },
  { id: 10, name: "Fantasy", icon: "color-wand-outline" },
  { id: 22, name: "Romance", icon: "heart-outline" },
  { id: 24, name: "Sci-Fi", icon: "planet-outline" },
=======
  { id: 1, name: 'Action', icon: 'flash-outline' },
  { id: 2, name: 'Adventure', icon: 'compass-outline' },
  { id: 4, name: 'Comedy', icon: 'happy-outline' },
  { id: 8, name: 'Drama', icon: 'sad-outline' },
  { id: 10, name: 'Fantasy', icon: 'color-wand-outline' },
  { id: 22, name: 'Romance', icon: 'heart-outline' },
  { id: 24, name: 'Sci-Fi', icon: 'planet-outline' },
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
];

export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // States
<<<<<<< HEAD
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);

=======
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
  const [airingAnime, setAiringAnime] = useState<Anime[]>([]);
  const [popularAnime, setPopularAnime] = useState<Anime[]>([]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

<<<<<<< HEAD
=======
  // Scroll direction tracking for marquee (debounced to avoid restart thrash)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down');
  const lastScrollY = useRef(0);
  const scrollDirTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

<<<<<<< HEAD
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
=======
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
        .from("anime_comments")
        .select("*")
        .order("created_at", { ascending: false })
=======
        .from('anime_comments')
        .select('*')
        .order('created_at', { ascending: false })
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
        .limit(20);
      if (data) {
        setComments(data);
      }
    };

    fetchRecentComments();

    const channel = supabase
<<<<<<< HEAD
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
=======
      .channel('global-comments-explore')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'anime_comments',
        },
        (payload) => {
          setComments((prev) => [payload.new, ...prev.slice(0, 19)]);
        }
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);
<<<<<<< HEAD

=======
  
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD

=======
    
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    try {
      // Fetch currently airing season
      const airingRes = await jikanApi.getCurrentSeason();
      setAiringAnime(airingRes.data || []);
      setLoadingAiring(false);

      // Fetch top popular anime
<<<<<<< HEAD
      const popularRes = await jikanApi.getTopAnime("bypopularity");
      setPopularAnime(popularRes.data || []);
      setLoadingPopular(false);
    } catch (error) {
      console.error("Error fetching home data:", error);
      setErrorMsg("Failed to load anime data. Tap to retry.");
=======
      const popularRes = await jikanApi.getTopAnime('bypopularity');
      setPopularAnime(popularRes.data || []);
      setLoadingPopular(false);
    } catch (error) {
      console.error('Error fetching home data:', error);
      setErrorMsg('Failed to load anime data. Tap to retry.');
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD

=======
    
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    setIsSearching(true);
    setErrorMsg(null);

    try {
      const res = await jikanApi.searchAnime(searchQuery);
      setSearchResults(res.data || []);
    } catch (error) {
<<<<<<< HEAD
      console.error("Search error:", error);
      setErrorMsg("Search failed. Try again.");
=======
      console.error('Search error:', error);
      setErrorMsg('Search failed. Try again.');
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
<<<<<<< HEAD
    setSearchQuery("");
=======
    setSearchQuery('');
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    setSearchResults([]);
  };

  const handleGenrePress = (genreId: number, genreName: string) => {
    // Navigate to catalog tab with selected genre params
    router.push({
<<<<<<< HEAD
      pathname: "/catalog",
=======
      pathname: '/catalog',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
      params: { genreId: genreId.toString(), genreName },
    });
  };

  return (
<<<<<<< HEAD
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
=======
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {showDropdown && (
        <>
          <Pressable style={styles.dropdownBackdrop} onPress={() => setShowDropdown(false)} />
          <View style={[styles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border, top: insets.top + 55 }]}>
            <Pressable
              onPress={() => {
                setShowDropdown(false);
                router.push('/profile');
              }}
              style={styles.dropdownItem}
            >
              <Ionicons name="person-outline" size={16} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>Profile</Text>
            </Pressable>
            
            <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b

            <Pressable
              onPress={() => {
                setShowDropdown(false);
<<<<<<< HEAD
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
=======
                router.push('/(tabs)/favorites');
              }}
              style={styles.dropdownItem}
            >
              <Ionicons name="heart-outline" size={16} color={colors.text} style={{ marginRight: 8 }} />
              <Text style={[styles.dropdownText, { color: colors.text }]}>My List</Text>
            </Pressable>

            <View style={[styles.dropdownDivider, { backgroundColor: colors.border }]} />
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b

            <Pressable
              onPress={async () => {
                setShowDropdown(false);
                await supabase.auth.signOut();
              }}
              style={styles.dropdownItem}
            >
<<<<<<< HEAD
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
=======
              <Ionicons name="log-out-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.dropdownText, { color: colors.primary, fontWeight: "700" }]}>Logout</Text>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
            </Pressable>
          </View>
        </>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
<<<<<<< HEAD
=======
        onScroll={(e) => {
          const currentY = e.nativeEvent.contentOffset.y;
          const diff = currentY - lastScrollY.current;
          lastScrollY.current = currentY;

          if (Math.abs(diff) < 6) return; // ignore tiny jitter
          const newDir: 'up' | 'down' = diff < 0 ? 'up' : 'down';

          // Debounce: only commit after 450ms of consistent direction
          if (scrollDirTimer.current) clearTimeout(scrollDirTimer.current);
          scrollDirTimer.current = setTimeout(() => {
            setScrollDirection(newDir);
          }, 450);
        }}
        scrollEventThrottle={32}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
      >
        {/* Profile/Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
<<<<<<< HEAD
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
=======
              {isPermanentUser ? `Hi, ${user.user_metadata?.username || user.email?.split('@')[0]}! 👋` : 'Konnichiwa! 👋'}
            </Text>
            <Text style={[styles.subGreeting, { color: colors.mutedText }]}>
              {isPermanentUser ? 'Your personal anime hub is active' : 'Explore your favorite anime catalog'}
            </Text>
          </View>
          <Pressable 
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
            onPress={() => {
              if (isPermanentUser) {
                setShowDropdown(!showDropdown);
              } else {
<<<<<<< HEAD
                router.push("/auth");
              }
            }}
            style={({ pressed }) => [
              styles.avatarBorder,
              {
                borderColor: isPermanentUser ? colors.primary : colors.border,
                opacity: pressed ? 0.9 : 1,
              },
=======
                router.push('/auth');
              }
            }}
            style={({ pressed }) => [
              styles.avatarBorder, 
              { borderColor: isPermanentUser ? colors.primary : colors.border, opacity: pressed ? 0.9 : 1 }
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
            ]}
          >
            {isPermanentUser ? (
              user.user_metadata?.avatar_url ? (
<<<<<<< HEAD
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
=======
                <Image 
                  source={{ uri: user.user_metadata.avatar_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + "15" }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {(user.user_metadata?.username?.charAt(0) || user.email?.charAt(0) || "U").toUpperCase()}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                  </Text>
                </View>
              )
            ) : (
<<<<<<< HEAD
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: colors.border },
                ]}
              >
=======
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.border }]}>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
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
=======
          <Pressable 
            onPress={searchQuery ? handleSearchSubmit : fetchHomeData} 
            style={[styles.errorContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}
          >
            <Ionicons name="alert-circle" size={20} color={colors.primary} />
            <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
          </Pressable>
        )}

        {/* Conditional Layout: Search Results vs Explore Content */}
        {searchQuery.trim().length > 0 ? (
          <View style={styles.sectionContainer}>
            <SectionHeader title={`Search Results for "${searchQuery}"`} />
<<<<<<< HEAD

=======
            
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
            {isSearching ? (
              <SkeletonLoader variant="grid" count={4} />
            ) : searchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
<<<<<<< HEAD
                <Ionicons
                  name="search-outline"
                  size={48}
                  color={colors.mutedText}
                />
=======
                <Ionicons name="search-outline" size={48} color={colors.mutedText} />
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                <Text style={[styles.emptyText, { color: colors.mutedText }]}>
                  No anime found. Try another query or press enter.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {searchResults.map((item, index) => {
                  if (!item) return null;
<<<<<<< HEAD
                  return (
                    <AnimeGridItem
                      key={`search-${item?.mal_id || ""}-${index}`}
                      anime={item}
                    />
                  );
=======
                  return <AnimeGridItem key={`search-${item?.mal_id || ""}-${index}`} anime={item} />;
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                })}
              </View>
            )}
          </View>
        ) : (
          <>
            {/* Horizontal Genre Carousel */}
            <View style={styles.genreSection}>
<<<<<<< HEAD
              <ScrollView
                horizontal
=======
              <ScrollView 
                horizontal 
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genreScroll}
              >
                {POPULAR_GENRES.map((genre) => (
                  <Pressable
                    key={genre.id}
                    onPress={() => handleGenrePress(genre.id, genre.name)}
                    style={({ pressed }) => [
                      styles.genrePill,
<<<<<<< HEAD
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
=======
                      { 
                        backgroundColor: colors.card, 
                        borderColor: colors.border,
                        opacity: pressed ? 0.8 : 1
                      }
                    ]}
                  >
                    <Ionicons name={genre.icon as any} size={16} color={colors.primary} style={styles.genreIcon} />
                    <Text style={[styles.genreText, { color: colors.text }]}>{genre.name}</Text>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Currently Airing Now (Horizontal Carousel) */}
            <View style={styles.sectionContainer}>
<<<<<<< HEAD
              <SectionHeader
                title="Airing This Season"
                showSeeAll
                onPressSeeAll={() =>
                  router.push({
                    pathname: "/catalog",
                    params: { filter: "airing" },
                  })
                }
=======
              <SectionHeader 
                title="Airing This Season" 
                showSeeAll 
                onPressSeeAll={() => router.push({ pathname: '/catalog', params: { filter: 'airing' } })} 
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
                      <View
                        key={`airing-${item?.mal_id || ""}-${index}`}
                        style={styles.airingItemContainer}
                      >
=======
                      <View key={`airing-${item?.mal_id || ""}-${index}`} style={styles.airingItemContainer}>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                        <AnimeGridItem anime={item} fullWidth />
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* Popular Hits (Vertical List) */}
            <View style={styles.sectionContainer}>
<<<<<<< HEAD
              <SectionHeader
                title="Popular Anime Hits"
                showSeeAll
                onPressSeeAll={() =>
                  router.push({
                    pathname: "/catalog",
                    params: { filter: "bypopularity" },
                  })
                }
=======
              <SectionHeader 
                title="Popular Anime Hits" 
                showSeeAll 
                onPressSeeAll={() => router.push({ pathname: '/catalog', params: { filter: 'bypopularity' } })}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
              />
              {loadingPopular ? (
                <SkeletonLoader variant="card" count={4} />
              ) : (
                <View style={styles.verticalList}>
                  {popularAnime.slice(0, 10).map((item, index) => {
                    if (!item) return null;
<<<<<<< HEAD
                    return (
                      <AnimeCard
                        key={`popular-${item?.mal_id || ""}-${index}`}
                        anime={item}
                      />
                    );
=======
                    return <AnimeCard key={`popular-${item?.mal_id || ""}-${index}`} anime={item} />;
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                  })}
                </View>
              )}
            </View>

            {/* Live User Comments Section */}
            {comments.length > 0 && (
<<<<<<< HEAD
              <View
                style={[
                  styles.sectionContainer,
                  { marginTop: 24, marginBottom: 12 },
                ]}
              >
                <SectionHeader title="Live User Comments 💬" />
=======
              <View style={[styles.sectionContainer, { marginTop: 24, marginBottom: 12 }]}>
                <SectionHeader title="Live User Buzz 💬" />
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                <View style={styles.marqueeSectionWrapper}>
                  {comments.length <= 5 ? (
                    <MarqueeRow
                      items={comments}
                      baseDirection="right"
<<<<<<< HEAD
=======
                      scrollDirection={scrollDirection}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                      colors={colors}
                    />
                  ) : (
                    <>
                      <MarqueeRow
<<<<<<< HEAD
                        items={comments.slice(
                          0,
                          Math.ceil(comments.length / 2),
                        )}
                        baseDirection="right"
=======
                        items={comments.slice(0, Math.ceil(comments.length / 2))}
                        baseDirection="right"
                        scrollDirection={scrollDirection}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
                        colors={colors}
                      />
                      <View style={{ height: 8 }} />
                      <MarqueeRow
                        items={comments.slice(Math.ceil(comments.length / 2))}
                        baseDirection="left"
<<<<<<< HEAD
=======
                        scrollDirection={scrollDirection}
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
      <ChatbotWidget />
=======
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
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
=======
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
    flexDirection: "row",
    alignItems: "center",
=======
    flexDirection: 'row',
    alignItems: 'center',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 13,
<<<<<<< HEAD
    fontWeight: "600",
=======
    fontWeight: '600',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    marginLeft: 8,
  },
  genreSection: {
    marginVertical: 4,
  },
  genreScroll: {
    paddingVertical: 6,
  },
  genrePill: {
<<<<<<< HEAD
    flexDirection: "row",
    alignItems: "center",
=======
    flexDirection: 'row',
    alignItems: 'center',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
    fontWeight: "700",
=======
    fontWeight: '700',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
  },
  sectionContainer: {
    marginTop: 10,
  },
  horizontalLoader: {
<<<<<<< HEAD
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
=======
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
=======
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
<<<<<<< HEAD
    fontWeight: "600",
    textAlign: "center",
=======
    fontWeight: '600',
    textAlign: 'center',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    marginTop: 12,
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  marqueeSectionWrapper: {
    marginTop: 8,
<<<<<<< HEAD
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
=======
    overflow: 'hidden',
    width: '100%',
  },
  marqueeRowContainer: {
    overflow: 'hidden',
    width: '100%',
  },
  marqueeAnimatedRow: {
    flexDirection: 'row',
  },
  commentBubble: {
    flexDirection: 'row',
    alignItems: 'center',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
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
<<<<<<< HEAD
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
=======
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleAvatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bubbleUser: {
    fontSize: 11,
    fontWeight: '700',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    maxWidth: 160,
  },
  bubbleContent: {
    fontSize: 11,
<<<<<<< HEAD
    fontWeight: "500",
=======
    fontWeight: '500',
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
    marginTop: 2,
    maxWidth: 160,
  },
});
