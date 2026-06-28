import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
<<<<<<< HEAD
  ScrollView,
  View as RNView,
} from 'react-native';
import ChatbotWidget from '@/components/ChatbotWidget';
=======
  SafeAreaView,
  ScrollView,
} from 'react-native';
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { View, Text } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { jikanApi, Anime, AnimeGenre } from '@/services/jikanApi';
import SearchBar from '@/components/SearchBar';
import AnimeGridItem from '@/components/AnimeGridItem';
import SkeletonLoader from '@/components/SkeletonLoader';

interface FilterTab {
  key: 'all' | 'airing' | 'upcoming' | 'bypopularity' | 'favorite';
  label: string;
}

const FILTER_TABS: FilterTab[] = [
  { key: 'all', label: 'Top Rated' },
  { key: 'airing', label: 'Airing' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'bypopularity', label: 'Popular' },
];

export default function CatalogScreen() {
  const params = useLocalSearchParams<{ genreId?: string; genreName?: string; filter?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab['key']>('all');
  const [selectedGenres, setSelectedGenres] = useState<Array<{ id: number; name: string }>>([]);
  
  const [allGenres, setAllGenres] = useState<AnimeGenre[]>([]);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const [showGenreSelector, setShowGenreSelector] = useState(false);

  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFirstMount = useRef(true);

  // Fetch all genres on mount
  useEffect(() => {
    const fetchGenres = async () => {
      setLoadingGenres(true);
      try {
        const res = await jikanApi.getGenres();
        setAllGenres(res.data || []);
      } catch (err) {
        console.error("Failed to fetch genres:", err);
      } finally {
        setLoadingGenres(false);
      }
    };
    fetchGenres();
  }, []);

  const handleGenreToggle = (genreId: number, genreName: string) => {
    setSelectedGenres((prev) => {
      if (prev.some((g) => g.id === genreId)) {
        return prev.filter((g) => g.id !== genreId);
      } else {
        return [...prev, { id: genreId, name: genreName }];
      }
    });
  };

  // Handle incoming route params (e.g., from Home tab)
  useEffect(() => {
    if (params.genreId && params.genreName) {
      const newGenre = {
        id: parseInt(params.genreId, 10),
        name: params.genreName,
      };
      setSelectedGenres((prev) => {
        if (prev.some((g) => g.id === newGenre.id)) return prev;
        return [...prev, newGenre];
      });
      // Clear search
      setSearchQuery('');
    }

    if (params.filter) {
      setActiveTab(params.filter as FilterTab['key']);
    }
  }, [params.genreId, params.genreName, params.filter]);

  // Main fetch function
  const fetchAnime = async (pageNum: number, resetList = false) => {
    if (pageNum === 1) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setErrorMsg(null);

    try {
      let res;
      const genreIds = selectedGenres.map((g) => g.id);

      // If there is an active search query
      if (searchQuery.trim().length > 0) {
        res = await jikanApi.searchAnime(
          searchQuery,
          pageNum,
          genreIds.length > 0 ? genreIds : undefined
        );
      } 
      // If we are filtering by genre (but no search query)
      else if (genreIds.length > 0) {
        res = await jikanApi.searchAnime('', pageNum, genreIds);
      } 
      // Otherwise, fetch chart data based on active tab
      else {
        if (activeTab === 'all') {
          res = await jikanApi.getTopAnime(undefined, pageNum);
        } else {
          res = await jikanApi.getTopAnime(activeTab, pageNum);
        }
      }

      const newData = res.data || [];
      const hasNext = res.pagination?.has_next_page ?? false;

      setAnimeList((prev) => (resetList ? newData : [...prev, ...newData]));
      setHasNextPage(hasNext);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch anime in catalog:', error);
      setErrorMsg('Failed to load anime. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Trigger fetch when tab or genres change
  useEffect(() => {
    fetchAnime(1, true);
  }, [activeTab, selectedGenres]);

  // Debounced search trigger
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const delayDebounce = setTimeout(() => {
      fetchAnime(1, true);
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Search submit
  const handleSearchSubmit = () => {
    fetchAnime(1, true);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Load more pagination
  const handleLoadMore = () => {
    if (!loadingMore && hasNextPage && !loading) {
      fetchAnime(page + 1, false);
    }
  };

  // Remove individual genre filter
  const handleRemoveGenre = (genreId: number) => {
    setSelectedGenres((prev) => prev.filter((g) => g.id !== genreId));
  };

  // Tab change handler
  const handleTabPress = (tabKey: FilterTab['key']) => {
    if (tabKey === activeTab && selectedGenres.length === 0 && !searchQuery) return;
    setActiveTab(tabKey);
    // Clearing genre filters and search query when switching tabs to make it clean
    setSelectedGenres([]);
    setSearchQuery('');
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={styles.footerSpacing} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={48} color={colors.mutedText} />
        <Text style={[styles.emptyText, { color: colors.mutedText }]}>
          No anime found. Try checking your filters or connection.
        </Text>
      </View>
    );
  };

  return (
<<<<<<< HEAD
    <RNView style={[styles.container, { backgroundColor: colors.background }]}>
=======
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
      {/* Filters/Search Header */}
      <View style={styles.header}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          onClear={handleClearSearch}
          placeholder="Search catalog..."
        />
        
        {/* Horizontal scrollbar of genres */}
        <View style={styles.genreScrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.genreScrollContent}
          >
            {selectedGenres.length > 0 && (
              <Pressable
                onPress={() => setSelectedGenres([])}
                style={[styles.genrePillButton, { borderColor: colors.primary, backgroundColor: colors.primary + "15" }]}
              >
                <Ionicons name="close-circle" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.genrePillText, { color: colors.primary, fontWeight: "800" }]}>
                  Clear All ({selectedGenres.length})
                </Text>
              </Pressable>
            )}

            {loadingGenres ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginHorizontal: 12 }} />
            ) : (
              allGenres.map((genre) => {
                const isSelected = selectedGenres.some((g) => g.id === genre.mal_id);
                return (
                  <Pressable
                    key={genre.mal_id}
                    onPress={() => handleGenreToggle(genre.mal_id, genre.name)}
                    style={[
                      styles.genrePillButton,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary + "10" : colors.card,
                      }
                    ]}
                  >
                    <Ionicons 
                      name={isSelected ? "checkbox" : "square-outline"} 
                      size={12} 
                      color={isSelected ? colors.primary : colors.mutedText} 
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.genrePillText,
                        { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? "700" : "500" }
                      ]}
                    >
                      {genre.name}
                    </Text>
                  </Pressable>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* Categories Tab Bar */}
        <View style={styles.tabContainer}>
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key && selectedGenres.length === 0;
            return (
              <Pressable
                key={tab.key}
                onPress={() => handleTabPress(tab.key)}
                style={[
                  styles.tabButton,
                  isActive && [styles.activeTabButton, { borderBottomColor: colors.primary }],
                ]}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.mutedText },
                    isActive && styles.activeTabLabel,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {errorMsg && (
        <Pressable 
          onPress={() => fetchAnime(1, true)} 
          style={[styles.errorContainer, { backgroundColor: colors.card, borderColor: colors.primary }]}
        >
          <Ionicons name="alert-circle" size={20} color={colors.primary} />
          <Text style={[styles.errorText, { color: colors.text }]}>{errorMsg}</Text>
        </Pressable>
      )}

      {/* Grid List */}
      {loading ? (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader variant="grid" count={6} />
        </View>
      ) : (
        <FlatList
          data={animeList}
          keyExtractor={(item, index) => item?.mal_id ? `${item.mal_id}-${index}` : index.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={({ item }) => {
            if (!item) return null;
            return <AnimeGridItem anime={item} />;
          }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      )}
<<<<<<< HEAD
      <ChatbotWidget />
    </RNView>
=======
    </SafeAreaView>
>>>>>>> 4df04350b6c1eb4a036ab6ca001613d6c7b05f0b
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  genreFilterScroll: {
    paddingVertical: 2,
  },
  genreIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  genreIndicatorText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
    marginRight: 6,
  },
  closeGenreButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    marginTop: 4,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomWidth: 2.5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  skeletonContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerSpacing: {
    height: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    margin: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  genreScrollContainer: {
    marginTop: 8,
    marginBottom: 4,
  },
  genreScrollContent: {
    paddingVertical: 4,
  },
  genrePillButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  genrePillText: {
    fontSize: 12,
  },
});
