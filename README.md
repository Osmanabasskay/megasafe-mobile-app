# MegaSafe Mobile App

MegaSafe is an Expo and React Native mobile application prototype for managing Osusu group contributions, savings, wallet records, and related member activities. The project includes Android, iOS, and web-compatible UI code.

> **Project status:** Prototype / demonstration. The current repository implementation stores most account and financial records locally with AsyncStorage. It is not a production financial service and must not be used to hold real money or sensitive customer information.

## Implemented application areas

- **Onboarding and account screens:** introductory slides, phone-and-password registration and login screens, and a demo OTP verification flow.
- **Biometric UI:** device biometric capability checks and local authentication prompts.
- **Osusu groups:** group creation and joining interfaces, contribution schedules, member/payment records, and group administration screens.
- **Savings and wallet:** screens for viewing and managing locally stored savings and wallet information.
- **Loans:** a loan-related interface and locally managed loan records.
- **Payments:** forms for recording group or individual payments using Mobile Money, bank, or physical-payment options.
- **Chats:** conversation list and chat screens.
- **Reports and analytics:** summary screens for group and financial activity.
- **Profile and preferences:** profile details, payment-method settings, and offline-sync controls.

Feature availability in the UI should not be interpreted as a completed live payment, banking, or backend integration.

## Technology stack

- Expo SDK 53
- React Native 0.79
- Expo Router 5
- JavaScript and TypeScript
- React Query and tRPC client packages
- Hono/tRPC backend scaffold
- AsyncStorage for local prototype data
- Zustand
- lucide-react-native
- NativeWind

## Repository layout

The Expo application is located in the `expo/` directory.

```text
expo/
├── app/
│   ├── (tabs)/       # Home, groups, savings, chats, loans, profile
│   ├── index.js      # Onboarding and authentication screens
│   └── verify-otp.js # Demo OTP verification
├── assets/
├── backend/          # Hono and tRPC scaffold
├── components/
├── constants/
├── lib/
├── app.json
└── package.json
```

## Run locally

### Prerequisites

- Node.js compatible with Expo SDK 53
- npm or Bun
- Expo Go or an Android/iOS simulator

### Install and start

```bash
cd expo
npm install
npx expo start
```

Use the Expo CLI instructions to open the app on a device, simulator, or web browser.

## Screenshots

Add genuine screenshots captured from the running app to `docs/screenshots/`:

- `docs/screenshots/home.png`
- `docs/screenshots/groups.png`
- `docs/screenshots/savings.png`

Do not use mockups or screenshots from a different build. The screenshots should match the current repository version.

## Important implementation limitations

The current code is a prototype and requires substantial engineering before production use:

- Authentication and user data are stored locally; the demo signup OTP is hard-coded in the client.
- Password handling in the prototype is not suitable for real accounts.
- Financial entries and payment records are saved locally; the payment form does not itself prove that a bank or Mobile Money transaction settled.
- The Hono/tRPC backend is a scaffold, not evidence of a deployed production API.
- Offline sync, reminders, biometric checks, and payment integrations must be tested and connected to trusted backend services before being described as production capabilities.

Never enter real passwords, identity documents, bank details, or live financial information into this prototype.

## License

See the repository for licensing information.
