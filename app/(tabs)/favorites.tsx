import ChatbotWidget from "@/components/ChatbotWidget";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";

import AnimeGridItem from "@/components/AnimeGridItem";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Text } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useFavorites } from "@/context/FavoritesContext";

import { User } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";

export default function FavoritesScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const { favorites, isLoading } = useFavorites();

  // Auth State
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isPermanentUser = !!(user && !user.is_anonymous && user.email);

  const handleExplorePress = () => {
    router.push("/");
  };

  const renderEmpty = () => {
    return (
      <View style={styles.emptyContainer}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.primary + "10" },
          ]}
        >
          <Ionicons
            name="heart-dislike-outline"
            size={48}
            color={colors.primary}
          />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Your List is Empty
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>
          Explore the catalog and tap the heart icon on any anime to save it
          here for offline reference.
        </Text>

        <Pressable
          onPress={handleExplorePress}
          style={({ pressed }) => [
            styles.exploreButton,
            { backgroundColor: colors.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Text style={styles.exploreButtonText}>Find Anime</Text>
          <Ionicons
            name="arrow-forward"
            size={16}
            color="#FFFFFF"
            style={styles.arrowIcon}
          />
        </Pressable>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Cloud Sync Banner for Guest Mode */}
      {!isLoading && !isPermanentUser && (
        <Pressable
          onPress={() => router.push("/auth")}
          style={({ pressed }) => [
            styles.syncBanner,
            {
              backgroundColor: colors.primary + "10",
              borderColor: colors.primary + "30",
              opacity: pressed ? 0.9 : 1,
            },
          ]}
        >
          <Ionicons
            name="cloud-upload-outline"
            size={16}
            color={colors.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.syncBannerText, { color: colors.text }]}>
            Guest Mode.{" "}
            <Text style={{ color: colors.primary, fontWeight: "800" }}>
              Sign In
            </Text>{" "}
            to sync lists!
          </Text>
          <Ionicons
            name="chevron-forward"
            size={14}
            color={colors.primary}
            style={{ marginLeft: "auto" }}
          />
        </Pressable>
      )}

      {/* Cloud Synced Bar for Permanently Authenticated User */}
      {!isLoading && isPermanentUser && (
        <View
          style={[
            styles.userHeader,
            { borderColor: colors.border, backgroundColor: colors.card },
          ]}
        >
          <View style={styles.userInfo}>
            <Ionicons
              name="cloud-done-outline"
              size={16}
              color="#10B981"
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.userEmail, { color: colors.text }]}
              numberOfLines={1}
            >
              Synced: {user?.email}
            </Text>
          </View>
          <Pressable
            onPress={() => supabase.auth.signOut()}
            style={({ pressed }) => [
              styles.signOutButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.signOutText, { color: colors.primary }]}>
              Sign Out
            </Text>
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader variant="grid" count={4} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item, index) =>
            item?.mal_id?.toString() || index.toString()
          }
          numColumns={2}
          contentContainerStyle={[
            styles.listContainer,
            favorites.length === 0 && styles.listContainerEmpty,
          ]}
          columnWrapperStyle={
            favorites.length > 0 ? styles.columnWrapper : undefined
          }
          renderItem={({ item }) => {
            if (!item) return null;
            return <AnimeGridItem anime={item} />;
          }}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
      <ChatbotWidget />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  listContainerEmpty: {
    flex: 1,
    justifyContent: "center",
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exploreButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  arrowIcon: {
    marginLeft: 6,
  },
  syncBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  syncBannerText: {
    fontSize: 12,
    fontWeight: "600",
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  userEmail: {
    fontSize: 12,
    fontWeight: "700",
    flex: 1,
  },
  signOutButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
