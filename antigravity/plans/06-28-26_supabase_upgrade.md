# Upgrade Implementation Plan: Supabase Integration & UI Refinements

This plan outlines the major database integration and UI improvements for the React Native Anime Catalog App.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Configuration:** The Anon Key (`sb_publishable_oq5CD_Dove5B2FOboTRRng_KHX6wqqT`) is required for client initialization. We will initialize the Supabase client under `lib/supabase.ts` with AsyncStorage persistence.
> 
> **RLS Policies:** The `favorite_animes` table RLS policies have been successfully created on your Supabase instance via MCP. Users will only see their own favorite anime.

---

## Proposed Changes

We will install `@supabase/supabase-js` and configure the following files:

```
react-native-anime/
├── lib/
│   └── supabase.ts           <- [NEW] Supabase client initialization
├── components/
│   ├── AnimeCard.tsx         <- [MODIFY] Update formatting guards
│   └── AnimeGridItem.tsx     <- [MODIFY] Add fullWidth prop to resolve horizontal spacing
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx         <- [MODIFY] Replace FlatList with horizontal ScrollView, implement debounced real-time search
│   │   ├── catalog.tsx       <- [MODIFY] Refactor selectedGenre state to selectedGenres array (multi-genre support), implement real-time search
│   │   └── favorites.tsx     <- [MODIFY] Transition local AsyncStorage favorites list to fetch from/sync with Supabase
│   └── anime/
│       └── [id].tsx          <- [MODIFY] Make header navbar icons transparent and white; update favorites storage to use Supabase client
```

---

### 1. Supabase Initialization

#### [NEW] [supabase.ts](file:///d:/Personal%20Files/react-native-anime/lib/supabase.ts)
Initialize the Supabase client using `@supabase/supabase-js` and React Native's `AsyncStorage` for auth session persistence.

---

### 2. Spacing Refinements (Explore Airing Section)

#### [MODIFY] [AnimeGridItem.tsx](file:///d:/Personal%20Files/react-native-anime/components/AnimeGridItem.tsx)
Add a `fullWidth` boolean property. When `fullWidth` is true, set the card `width` to `'100%'` (instead of `'47%'`). 

#### [MODIFY] [(tabs)/index.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/index.tsx)
Render `<AnimeGridItem anime={item} fullWidth />` inside the horizontal `ScrollView` carousel. This removes the large blank spacing gap and aligns the seasonal cards closer together.

---

### 3. Transparent Detail Header Navbar

#### [MODIFY] [anime/[id].tsx](file:///d:/Personal%20Files/react-native-anime/app/anime/%5Bid%5D.tsx)
Remove the white background circle on the floating header buttons. Set their `backgroundColor` to `'transparent'` and change icon colors to white (`#FFFFFF`) to float on top of the hero banner.

---

### 4. Real-time Search

#### [MODIFY] [(tabs)/index.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/index.tsx) & [(tabs)/catalog.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/catalog.tsx)
Implement `useEffect` hooks with a `500ms` debounce timer that watches the search query input. When typing stops, automatically fetch matching search results without pressing enter.

---

### 5. Multi-genre Selection

#### [MODIFY] [(tabs)/catalog.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/catalog.tsx)
- Refactor the `selectedGenre` state into a `selectedGenres` array.
- Update quick genre pills to toggle selection.
- Update the search parameter mapper to supply all chosen genre IDs to the API service.
- Render multiple closeable badges in the catalog header.

---

## Verification Plan

### Automated Tests
- Run `npm run tsc` to verify zero typecheck errors.

### Manual Verification
- Test real-time search debounce: type a search term and verify results appear after 500ms.
- Toggle multiple genres in catalog and verify results update.
- Verify detail page navbar overlays cleanly with white icons.
- Add an anime to favorites and verify it syncs with the Supabase database.
