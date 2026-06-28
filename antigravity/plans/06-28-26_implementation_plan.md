# React Native Anime Catalog App (Jikan API Integration)

A modern, flat, minimalist anime catalog application built with React Native and Expo. The project utilizes the Jikan API (v4) to fetch up-to-date anime details, current season entries, recommendations, and characters. The initial phase focuses exclusively on a premium, clean lightmode interface.

---

## Design System (Modern Flat Minimalist Anime)

We will implement a gorgeous modern-flat design system with Sakura Pink as the primary brand color, combined with slate grays, clean borders, and custom badges.

- **Primary/Accent Color:** `#FF385C` (Sakura Pink / Vibrant Crimson)
- **Secondary Color:** `#FF8A65` (Warm Sunset Coral)
- **Background Color:** `#F8F9FA` (Soft off-white / Pearl Grey)
- **Card Background:** `#FFFFFF` (Pure white)
- **Primary Text:** `#1A1D20` (Dark Charcoal / Slate Black)
- **Secondary/Muted Text:** `#6C7A89` (Cool Grey)
- **Success/Airing Badge:** `#10B981` (Bright Emerald)
- **Rating/Star Color:** `#FFB000` (Amber Gold)
- **Border Color:** `#EEEEEE` (Super light grey for flat minimalist frames)
- **Border Radius:** `16px` for cards, `12px` for badges/buttons.
- **Typography:** Systems fonts (San Francisco/Roboto) optimized with bold weights (`800` for titles, `600` for headers) and generous letter spacing.

---

## Proposed Changes

We will create and organize the application structure into reusable services, contexts, custom components, and navigation routes.

```
react-native-anime/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx       <- Updated tab bar navigation with correct labels & icons
│   │   ├── index.tsx         <- Home/Explore Screen (Search, Current Season, Categories)
│   │   ├── catalog.tsx       <- Catalog / Genre Filters / Advanced Search Screen
│   │   └── favorites.tsx     <- Saved watchlist / Bookmarked anime
│   ├── anime/
│   │   └── [id].tsx          <- Dynamic detail screen (Hero, Synopsis, Specs, Characters, Recs)
│   ├── _layout.tsx           <- Main stack routing config
│   └── modal.tsx             <- (Kept standard modal for info or filters)
├── services/
│   └── jikanApi.ts           <- Jikan API v4 fetcher, caching layer, and error handling
├── context/
│   └── FavoritesContext.tsx  <- React Context to manage and persist favorite anime
├── components/
│   ├── AnimeCard.tsx         <- Flat list anime item (Cover art, score badge, title, episodes)
│   ├── AnimeGridItem.tsx     <- Grid card layout for catalog
│   ├── SectionHeader.tsx     <- Elegant section title with "See All" action
│   ├── SearchBar.tsx         <- Minimalist flat search input
│   └── SkeletonLoader.tsx    <- Premium skeleton loading indicator for lists
└── constants/
    └── Colors.ts             <- Updated light/dark mode color tokens
```

---

### 1. Design System Configuration

#### [MODIFY] [Colors.ts](file:///d:/Personal%20Files/react-native-anime/constants/Colors.ts)
Update colors to reflect the custom lightmode palette.

---

### 2. Jikan API Service

#### [NEW] [jikanApi.ts](file:///d:/Personal%20Files/react-native-anime/services/jikanApi.ts)
Implement helper functions to communicate with `https://api.jikan.moe/v4`:
- `fetchTopAnime(filter?, page?)`: Fetch top charts (airing, popular, upcoming)
- `fetchCurrentSeason(page?)`: Fetch currently airing season
- `searchAnime(query, page?, genres?)`: Find anime by query and genres
- `fetchAnimeDetails(id)`: Full data for a specific anime
- `fetchAnimeCharacters(id)`: Top characters for the anime
- `fetchAnimeRecommendations(id)`: Recommended anime list
- **Caching Layer:** Simple in-memory cache to prevent redundant fetches and respect rate-limiting (3 requests/second).

---

### 3. Favorites / Bookmarking Storage Context

#### [NEW] [FavoritesContext.tsx](file:///d:/Personal%20Files/react-native-anime/context/FavoritesContext.tsx)
Context wrapper enabling users to save/remove anime from their favorites list. We will install `@react-native-async-storage/async-storage` using Expo's CLI to persist this state across app restarts.

---

### 4. Custom UI Components

#### [NEW] [SkeletonLoader.tsx](file:///d:/Personal%20Files/react-native-anime/components/SkeletonLoader.tsx)
Visual placeholder layout for loading lists or details.
#### [NEW] [AnimeCard.tsx](file:///d:/Personal%20Files/react-native-anime/components/AnimeCard.tsx) & [AnimeGridItem.tsx](file:///d:/Personal%20Files/react-native-anime/components/AnimeGridItem.tsx)
Stunning card layouts featuring high-res images, overlay ratings, thin flat borders, and flat pill indicators.
#### [NEW] [SearchBar.tsx](file:///d:/Personal%20Files/react-native-anime/components/SearchBar.tsx) & [SectionHeader.tsx](file:///d:/Personal%20Files/react-native-anime/components/SectionHeader.tsx)
Clean search text boxes and section headers with simple arrow keys.

---

### 5. App Screens Implementation

#### [MODIFY] [_layout.tsx](file:///d:/Personal%20Files/react-native-anime/app/_layout.tsx)
Wrap application with `FavoritesProvider` and configure screen presentation.

#### [MODIFY] [(tabs)/_layout.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/_layout.tsx)
Configure the tabs navigation:
- Tab 1: **Explore** (`index.tsx`)
- Tab 2: **Catalog** (`catalog.tsx` - replaced `two.tsx`)
- Tab 3: **My List** (`favorites.tsx` - new tab file)
Use modern icons (Feather/Ionicons style) for navigation.

#### [MODIFY] [(tabs)/index.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/index.tsx)
Explore screen containing:
- Welcoming greeting banner ("Konnichiwa! 👋")
- Small horizontal category filters (Action, Adventure, Fantasy, Comedy, Sci-Fi)
- Horizontal carousel: "Airing Now"
- Vertical scroll: "Popular Hits"

#### [NEW] [(tabs)/catalog.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/catalog.tsx)
Catalog screen featuring:
- Search text box with interactive typing filter.
- Horizontal sub-tabs: All, Airing, Upcoming, Popular.
- Dynamic grid representation of matched anime.
- Empty states and loading skeletons.

#### [NEW] [(tabs)/favorites.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/favorites.tsx)
Favorites screen showing a clean grid list of bookmarked titles. Users can quickly remove or click to view details.

#### [NEW] [anime/[id].tsx](file:///d:/Personal%20Files/react-native-anime/app/anime/%5Bid%5D.tsx)
Full Detail screen showing:
- Parallax/Top Hero Banner with poster and anime backdrop.
- Meta statistics panel (Score, Rank, Popularity, Rating).
- Summary/Synopsis text with expandable toggle ("Show More").
- Key specifications grid (Type, Episodes, Studio, Premiered).
- Horizontal list of Main Characters with avatars.
- Horizontal list of Recommended Anime.
- Dynamic floating "Add to favorites" action button.

---

## Verification Plan

### Automated Tests
- Run `npm run tsc` (or typescript compiler check) to ensure zero compilation or layout type errors.
- Ensure no React Native packager warnings.

### Manual Verification
- Verify search functionality works under slow-network conditions.
- Test favorite persistence by adding anime, quitting the application, and reloading.
- Test navigation back-and-forth between detail view and tabs.
- Verify lightmode colors are rendering properly.
