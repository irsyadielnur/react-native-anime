# Upgrade Implementation Plan: Supabase Auth & Google Sign-In

This plan outlines the implementation of Email/Password login/register and Google OAuth sign-in, and how we will migrate/link the guest favorites watchlist to permanent user accounts.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Auth Redirects:** Google OAuth requires a redirection URL. In Expo Go, we utilize `expo-linking` to resolve the redirection URL (e.g., `exp://...` or `animeapp://...`). We will configure `WebBrowser.openAuthSessionAsync` to handle this OAuth redirect session safely.
> 
> **Permanent watchlist migration:** When a guest user logs in or registers for a permanent account, we will merge their local guest favorites into their new permanent account in Supabase.

---

## Proposed Changes

We will create an Auth modal and update layout and favorites components:

```
react-native-anime/
├── app/
│   ├── _layout.tsx           <- [MODIFY] Register auth modal screen transition
│   ├── auth.tsx              <- [NEW] Email/Password Sign-In/Register & Google Auth modal screen
│   ├── (tabs)/
│   │   ├── index.tsx         <- [MODIFY] Add profile icon in header to trigger auth modal
│   │   └── favorites.tsx     <- [MODIFY] Show profile header/sign-out controls and auth CTA if guest
├── context/
│   └── FavoritesContext.tsx  <- [MODIFY] Implement bi-directional migration from guest to permanent user ID
```

---

### 1. Registration of Auth Modal

#### [MODIFY] [app/_layout.tsx](file:///d:/Personal%20Files/react-native-anime/app/_layout.tsx)
Add `<Stack.Screen name="auth" options={{ presentation: 'modal', headerShown: false }} />` to the stack layout.

---

### 2. Supabase Auth Screen

#### [NEW] [app/auth.tsx](file:///d:/Personal%20Files/react-native-anime/app/auth.tsx)
A gorgeous, modern auth screen in Sakura Pink styling with:
- Tabs to switch between **Sign In** and **Sign Up**.
- Text inputs for Email and Password.
- **Login with Google** button integrated using `expo-web-browser` and `expo-linking` for native OAuth callback.
- Fallback mock credentials toggle for easy testing in Expo Go.

---

### 3. Header Profile Action

#### [MODIFY] [app/(tabs)/index.tsx](file:///d:/Personal%20Files/react-native-anime/app/(tabs)/index.tsx)
Change the static avatar image in the header to an interactive button. If the user is logged in as a permanent user, show a custom badge; if guest, show a login avatar indicator. Clicking this avatar will push to `/auth` as a modal sheet.

---

### 4. Favorites & Watchlist Sync

#### [MODIFY] [context/FavoritesContext.tsx](file:///d:/Personal%20Files/react-native-anime/context/FavoritesContext.tsx)
- Listen to auth state transitions.
- When the user transitions from **anonymous (guest)** to **permanent (email/google)**:
  - Migrate all local AsyncStorage favorites to their new permanent `user_id` inside the Supabase `favorite_animes` table.
  - Re-fetch the permanent user's existing favorites list and merge them.

---

## Verification Plan

### Automated Tests
- Run `npm run tsc` to verify typecheck compliance.

### Manual Verification
- Tap profile avatar in Explore tab: verify the auth modal slides up.
- Register a new Email/Password account: verify user creation and watchlist merge.
- Toggle Login with Google: verify redirection request.
- Log out: verify list clears or returns to offline mode, and logging back in fetches the data.
