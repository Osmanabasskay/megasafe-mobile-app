# Changelog

All notable changes to this project will be documented in this file.

## 2025-08-10
- Redesigned Groups feature to match provided sample and brand
  - Pill buttons, card layout, badges, totals, voting, admin tools
  - Colors updated: Primary Orange (#FFA500), Secondary Dark Imperial Blue (#00157f)
  - Fonts integrated globally: Inter (body), Montserrat (titles)
- Fixed logout to return to intro slides (Profile → Log out)
- Unified Android/iOS look and feel
- Added intro slides before login/sign up (app/index.js)
- Bottom navigation: Home, Groups, Savings, Chats, Loans, Profile; Reports/Analytics accessible via dashboard only
- Implemented contribution reminders at 7am/2pm/7pm within two days of due date, suppressed if already paid
- Contacts import + invite flow for adding group members; group capacity extended to 500
- Minor accessibility and test improvements (testIDs everywhere)
- Backend scaffold enabled (Hono + tRPC)
