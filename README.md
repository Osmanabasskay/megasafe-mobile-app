# MegaSafe Mobile App (Expo + React Native)

A modern Osusu finance app with Groups, Savings, Loans, Chats, and a beautiful, consistent UI across Android, iOS, and Web.

## Tech
- Expo (Expo Router)
- React Native Web compatible
- lucide-react-native icons
- Fonts: Inter (body), Montserrat (titles)
- State: AsyncStorage (local), React Query (infra), tRPC backend scaffold

## Design System
- Colors
  - Primary: Orange #FFA500
  - Secondary: Dark Imperial Blue #00157f
- Fonts
  - Titles: Montserrat
  - Body: Inter

## Key Features
- Osusu Groups: create/join, approvals, payout schedule, voting order, payments ledger, admin reminders
- Chats: tab available, per requirement
- Savings, Wallet, Loans, Profile
- Offline Sync: queue and manual sync (Profile → Offline Sync)
- Contribution Reminders: two days ahead at 7am/2pm/7pm if not paid
- Payment Methods: Mobile Money + Banks
- Intro Slides before login/register
- Consistent 6-tab bottom nav: Home, Groups, Savings, Chats, Loans, Profile

## Getting Started
1. bun install or npm install
2. bun expo start or npx expo start
3. Scan QR with Expo Go

## Project Structure
- app/_layout.js: providers and fonts
- app/index.js: onboarding + auth
- app/(tabs)/*: tab routes
- app/(tabs)/groups.js: redesigned Groups
- app/(tabs)/profile.js: profile, payments, offline sync, logout
- backend/*: Hono + tRPC scaffold

## Fonts
Fonts are loaded in app/_layout.js via expo-font. If loading fails, the app gracefully falls back to system fonts.

## Logout
Profile → Log out. Clears session flags and returns to the Intro slides, per requirement.

## Testing Hints
- TestIDs are included (e.g. createGroupBtn, joinSearchInput, logoutBtn).
- Console logs prefixed with [Profile], [Home], [Offline] for quick filtering.

## Web Compatibility Notes
- Image picking and some native features show polite fallbacks on web.

## License
MIT
