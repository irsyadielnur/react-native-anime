const BASE_URL = 'https://api.jikan.moe/v4';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithCache<T>(url: string): Promise<T> {
  const now = Date.now();
  if (cache[url] && now - cache[url].timestamp < CACHE_DURATION) {
    return cache[url].data as T;
  }

  try {
    let response = await fetch(url);

    // Handle Jikan rate limits (429 Too Many Requests)
    if (response.status === 429) {
      console.warn(`Jikan API Rate Limit (429). Retrying after 1.5s for url: ${url}`);
      await delay(1500);
      response = await fetch(url);
    }

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const json = await response.json();
    cache[url] = {
      data: json,
      timestamp: now,
    };
    return json as T;
  } catch (error) {
    console.error(`Error fetching from Jikan API: ${error}`);
    // If there is an expired cache entry, return it as fallback during network failure
    if (cache[url]) {
      console.log(`Returning expired cache fallback for: ${url}`);
      return cache[url].data as T;
    }
    throw error;
  }
}

export interface AnimeImage {
  image_url: string;
  small_image_url: string;
  large_image_url: string;
}

export interface AnimeGenre {
  mal_id: number;
  type: string;
  name: string;
}

export interface AnimeStudio {
  mal_id: number;
  type: string;
  name: string;
}

export interface Anime {
  mal_id: number;
  url: string;
  images: {
    jpg: AnimeImage;
    webp: AnimeImage;
  };
  title: string;
  title_english: string | null;
  title_japanese: string | null;
  type: string | null;
  source: string | null;
  episodes: number | null;
  status: string | null;
  airing: boolean;
  duration: string | null;
  rating: string | null;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  synopsis: string | null;
  background: string | null;
  season: string | null;
  year: number | null;
  studios: AnimeStudio[];
  genres: AnimeGenre[];
}

export interface JikanResponse<T> {
  data: T;
  pagination?: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

export interface CharacterInfo {
  character: {
    mal_id: number;
    url: string;
    images: {
      jpg: { image_url: string };
      webp: { image_url: string };
    };
    name: string;
  };
  role: string;
  voice_actors: Array<{
    person: {
      mal_id: number;
      url: string;
      images: { jpg: { image_url: string } };
      name: string;
    };
    language: string;
  }>;
}

export interface RecommendationInfo {
  entry: {
    mal_id: number;
    url: string;
    images: {
      jpg: AnimeImage;
      webp: AnimeImage;
    };
    title: string;
  };
  votes: number;
}

export const jikanApi = {
  /**
   * Fetch top anime list
   */
  async getTopAnime(filter?: 'airing' | 'upcoming' | 'bypopularity' | 'favorite', page = 1): Promise<JikanResponse<Anime[]>> {
    const filterQuery = filter ? `&filter=${filter}` : '';
    const url = `${BASE_URL}/top/anime?page=${page}${filterQuery}`;
    return fetchWithCache<JikanResponse<Anime[]>>(url);
  },

  /**
   * Fetch currently airing anime
   */
  async getCurrentSeason(page = 1): Promise<JikanResponse<Anime[]>> {
    const url = `${BASE_URL}/seasons/now?page=${page}&sfw=true`;
    return fetchWithCache<JikanResponse<Anime[]>>(url);
  },

  /**
   * Search for anime with query and optional filters
   */
  async searchAnime(query: string, page = 1, genres?: number[]): Promise<JikanResponse<Anime[]>> {
    const encodedQuery = encodeURIComponent(query);
    const genreQuery = genres && genres.length > 0 ? `&genres=${genres.join(',')}` : '';
    const url = `${BASE_URL}/anime?q=${encodedQuery}&page=${page}${genreQuery}&sfw=true&order_by=popularity&sort=asc`;
    return fetchWithCache<JikanResponse<Anime[]>>(url);
  },

  /**
   * Get full details for a single anime
   */
  async getAnimeDetails(id: number): Promise<JikanResponse<Anime>> {
    const url = `${BASE_URL}/anime/${id}/full`;
    return fetchWithCache<JikanResponse<Anime>>(url);
  },

  /**
   * Get characters for an anime
   */
  async getAnimeCharacters(id: number): Promise<JikanResponse<CharacterInfo[]>> {
    const url = `${BASE_URL}/anime/${id}/characters`;
    return fetchWithCache<JikanResponse<CharacterInfo[]>>(url);
  },

  /**
   * Get recommendations for an anime
   */
  async getAnimeRecommendations(id: number): Promise<JikanResponse<RecommendationInfo[]>> {
    const url = `${BASE_URL}/anime/${id}/recommendations`;
    return fetchWithCache<JikanResponse<RecommendationInfo[]>>(url);
  },

  /**
   * Search for anime optimized for chatbot relevance matching
   */
  async searchAnimeForChat(query: string): Promise<JikanResponse<Anime[]>> {
    const encodedQuery = encodeURIComponent(query);
    const url = `${BASE_URL}/anime?q=${encodedQuery}&sfw=true&limit=10`;
    return fetchWithCache<JikanResponse<Anime[]>>(url);
  },

  /**
   * Get all anime genres
   */
  async getGenres(): Promise<JikanResponse<AnimeGenre[]>> {
    const url = `${BASE_URL}/genres/anime`;
    return fetchWithCache<JikanResponse<AnimeGenre[]>>(url);
  }
};
