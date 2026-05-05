# External Resources Audit Report
**Date:** March 23, 2026
**Project:** Marc's Trading Journal

This document provides a comprehensive audit of all external URLs, links, and resources currently utilized within the codebase.

---

## 1. External Images

| Exact URL | File / Component | Purpose | Should be stored locally? |
| :--- | :--- | :--- | :--- |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/5b029b7a75ff1f233599a7935c0983c3.jpg` | `apps/web/src/pages/HomePage.jsx` | Hero section background image | **Yes.** Storing locally in `public/images/` ensures the image is always available, reduces reliance on external CDNs, and prevents broken images if the CDN link expires. |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/2ef0dac0656b3610e9e86c7f565d88fe.png` | `apps/web/src/pages/HomePage.jsx` | Feature section screenshot (Detailed trade logging) | **Yes.** Same as above. |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/2abed67dc85685970e22ca81df37a90e.png` | `apps/web/src/pages/HomePage.jsx` | Feature section screenshot (Advanced analytics) | **Yes.** Same as above. |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/27a38431605c335700a00c08b8d9c994.png` | `apps/web/src/pages/HomePage.jsx` | Feature section screenshot (Visual insights) | **Yes.** Same as above. |

---

## 2. CDN Links & Fonts

| Exact URL | File / Component | Purpose | Should be stored locally? |
| :--- | :--- | :--- | :--- |
| `https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap` | `apps/web/src/index.css` | Google Fonts import for the primary application font (DM Sans) | **Optional, but Recommended.** For strict GDPR compliance (especially relevant for German users as noted in the Privacy Policy), it is highly recommended to download the font files and serve them locally from the `public/fonts/` directory to prevent IP address transmission to Google servers. |

---

## 3. Website Links & External Protocols

| Exact URL | File / Component | Purpose | Should be stored locally? |
| :--- | :--- | :--- | :--- |
| `mailto:marc.re1998@gmail.com` | `apps/web/src/pages/PrivacyPolicyPage.jsx` | Contact email link for the Responsible Party and User Rights sections | **N/A.** This is a protocol link, not a hostable resource. |

---

## 4. APIs & External Services

*No hardcoded external API endpoints were found in the codebase.* 

**Note:** The application uses PocketBase for backend services (Authentication, Database). The connection to PocketBase is managed internally via the `apps/web/src/lib/pocketbaseClient.js` SDK, which dynamically resolves the backend URL based on the environment. No raw external API strings are hardcoded in the frontend components.

---

## 5. Other Resources

*No other external resources (such as external JS libraries via `<script>` tags, external CSS frameworks via `<link>`, or third-party tracking scripts) were found in the codebase.* 

**Note:** The `index.html` file correctly uses local relative paths for its assets (e.g., `<link rel="icon" type="image/svg+xml" href="/vite.svg" />`). All dependencies (React, Tailwind, Lucide Icons, Recharts, Framer Motion, etc.) are properly managed via `package.json` and bundled locally during the build process.