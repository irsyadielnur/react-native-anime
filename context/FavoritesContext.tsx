import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Anime } from '../services/jikanApi';
import { supabase } from '../lib/supabase';

interface FavoritesContextType {
  favorites: Anime[];
  addFavorite: (anime: Anime) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  isFavorite: (id: number) => boolean;
  isLoading: boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = '@anime_catalog_favorites';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load local favorites on mount and authenticate/sync with Supabase
  useEffect(() => {
    const initFavorites = async () => {
      // 1. Load local favorites first (offline-first)
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setFavorites(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Failed to load local favorites:', error);
      }

      // 2. Setup auth session and trigger reconciliation sync
      try {
        let { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          // Attempt anonymous sign-in so user has a valid UID for RLS policies
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn('Anonymous login failed. Local fallback only:', error.message);
          } else {
            const { data: { session: newSession } } = await supabase.auth.getSession();
            session = newSession;
          }
        }

        if (session?.user) {
          await reconcileFavorites(session.user.id);
        }
      } catch (authError) {
        console.warn('Supabase auth/sync setup encountered an issue:', authError);
      } finally {
        setIsLoading(false);
      }
    };

    initFavorites();

    // Listen for auth state changes to re-sync
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await reconcileFavorites(session.user.id);
      } else {
        // Sign out event: sign in anonymously again as a guest
        setIsLoading(true);
        try {
          const { error } = await supabase.auth.signInAnonymously();
          if (error) {
            console.warn("Failed to sign in anonymously on sign out:", error.message);
          } else {
            const { data: { session: guestSession } } = await supabase.auth.getSession();
            if (guestSession?.user) {
              await reconcileFavorites(guestSession.user.id);
            }
          }
        } catch (e) {
          console.warn("Sign out handler failed:", e);
        } finally {
          setIsLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sync / reconcile local AsyncStorage with Supabase db table
  const reconcileFavorites = async (userId: string) => {
    try {
      // Fetch list from Supabase
      const { data: dbFavs, error } = await supabase
        .from('favorite_animes')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;

      // Load current local list
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const localFavs: Anime[] = stored ? JSON.parse(stored) : [];

      const dbAnimeIds = new Set(dbFavs.map((f) => f.anime_id));
      const localAnimeIds = new Set(localFavs.map((l) => l.mal_id));

      // 1. Upload local favorites that aren't in Supabase
      const toUpload = localFavs.filter((l) => !dbAnimeIds.has(l.mal_id));
      for (const item of toUpload) {
        await supabase.from('favorite_animes').insert({
          user_id: userId,
          anime_id: item.mal_id,
          title: item.title,
          image_url: item.images?.webp?.image_url || item.images?.jpg?.image_url || ''
        });
      }

      // 2. Combine and reconcile: download database favorites not stored locally
      const toDownload = dbFavs.filter((f) => !localAnimeIds.has(f.anime_id));
      const reconciledList = [...localFavs];

      for (const dbItem of toDownload) {
        const newFav: Anime = {
          mal_id: dbItem.anime_id,
          title: dbItem.title,
          images: {
            webp: { image_url: dbItem.image_url || '', small_image_url: '', large_image_url: '' },
            jpg: { image_url: dbItem.image_url || '', small_image_url: '', large_image_url: '' }
          },
          score: null,
          scored_by: null,
          type: 'TV',
          episodes: null,
          url: '',
          title_english: null,
          title_japanese: null,
          source: null,
          status: null,
          airing: false,
          duration: null,
          rating: null,
          rank: null,
          popularity: null,
          synopsis: null,
          background: null,
          season: null,
          year: null,
          studios: [],
          genres: []
        };
        reconciledList.push(newFav);
      }

      // If we uploaded new items, refetch or simply update state
      setFavorites(reconciledList);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reconciledList));
    } catch (error) {
      console.warn('Favorites reconciliation failed:', error);
    }
  };

  const addFavorite = async (anime: Anime) => {
    if (favorites.some((item) => item.mal_id === anime.mal_id)) return;
    const updated = [anime, ...favorites];
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Upload to Supabase asynchronously
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('favorite_animes').insert({
          user_id: session.user.id,
          anime_id: anime.mal_id,
          title: anime.title,
          image_url: anime.images?.webp?.image_url || anime.images?.jpg?.image_url || ''
        });
      }
    } catch (err) {
      console.warn('Failed to upload added favorite to Supabase:', err);
    }
  };

  const removeFavorite = async (id: number) => {
    const updated = favorites.filter((item) => item.mal_id !== id);
    setFavorites(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Delete from Supabase asynchronously
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('favorite_animes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('anime_id', id);
      }
    } catch (err) {
      console.warn('Failed to delete favorite from Supabase:', err);
    }
  };

  const isFavorite = (id: number) => {
    return favorites.some((item) => item.mal_id === id);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, isLoading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
