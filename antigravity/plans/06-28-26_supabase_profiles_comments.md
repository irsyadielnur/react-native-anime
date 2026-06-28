# Upgrade Implementation Plan: Profile Updates, Avatar Storage & Real-time Comments

This plan outlines the implementation of:
1. Implicit flow configurations in Supabase client initialization (resolving PKCE helpers crash).
2. Dynamic always-visible horizontal scrollbars for on-page genre catalog filtering.
3. High-contrast, absolute-positioned user dropdown menus on the Explore header.
4. Functional profile upload flows (utilizing `expo-image-picker` and the `avatar` Supabase storage bucket), metadata username updates, and password reset form fields.
5. Global and per-anime real-time discussion boards using Supabase PostgreSQL subscriptions, styled at the bottom of the Explore tab with smooth infinite loop scrolling marquees.

---

## Proposed Changes

```
react-native-anime/
├── app/
│   ├── _layout.tsx           <- [MODIFY] Registered /profile and /auth transitions
│   ├── auth.tsx              <- [MODIFY] Removed Google Sign-in elements
│   ├── profile.tsx           <- [MODIFY] Created fully functional avatar upload, edit metadata, and password reset controls
│   ├── anime/
│   │   └── [id].tsx          <- [MODIFY] Integrated per-anime discussions and comment post forms
│   └── (tabs)/
│       ├── index.tsx         <- [MODIFY] Added user dropdown popover, global comments sync, and infinite marquee animation rows
│       └── catalog.tsx       <- [MODIFY] Created horizontal checkbox filter row for all genres
├── lib/
│   └── supabase.ts           <- [MODIFY] Converted flowType to implicit to prevent PKCE helpers error
```

---

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` to verify type safety.

### Manual Verification
- Register/Login with any dummy email on `/auth`: verify that it auto-confirms instantly and logs the user in.
- Tap avatar on Explore: verify dropdown menu toggles with Profile, My List, and Logout.
- Go to Profile: select and upload an avatar (using ImagePicker), then save. Verify initials fallback displays if no avatar.
- Change password on Profile: verify update completes.
- Open Anime Detail Screen: post comments (both logged-in user and guest). Verify comments synchronize in real-time.
- Go to Explore: verify comments buzz section renders at the bottom with smooth, infinite moving marquee rows.
