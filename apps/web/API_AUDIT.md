# External API and Third-Party Services Audit Report

**Date:** March 20, 2026  
**Project:** Trading Journal Application  

This document provides a comprehensive audit of all external APIs, third-party services, data flows, and credentials used within the Trading Journal codebase. It is intended to serve as a reference for privacy policy generation, security reviews, and compliance documentation (e.g., GDPR, CCPA).

---

## 1. External APIs

Based on a thorough review of the codebase, the application relies on a **single, unified backend API** provided by PocketBase. There are **no external third-party API calls** (e.g., no external financial data providers, no external weather APIs, etc.) made directly from the frontend client.

### PocketBase API (Primary Backend)
*   **Endpoint:** `/hcgi/platform` (Configured in `apps/web/src/lib/pocketbaseClient.js`)
*   **Purpose:** Handles all authentication, user management, database CRUD operations, and file storage.
*   **Files/Components Using It:**
    *   `src/contexts/AuthContext.jsx` (Authentication)
    *   `src/pages/AnalysisPage.jsx` (Data fetching)
    *   `src/pages/ChartsPage.jsx` (Data fetching)
    *   `src/pages/TradesPage.jsx` (Data fetching, deletion)
    *   `src/pages/SettingsPage.jsx` (Settings management)
    *   `src/components/TradeEntryForm.jsx` (Data creation)
    *   `src/components/EditTradeModal.jsx` (Data modification)

---

## 2. Third-Party Services

The application is entirely self-contained within its hosting environment and the PocketBase backend. 

*   **Payment Processors:** None integrated (e.g., no Stripe, PayPal).
*   **Analytics & Tracking:** None integrated (e.g., no Google Analytics, Mixpanel, or Meta Pixels).
*   **CDNs:** The application uses standard npm packages bundled at build time. No external CDNs are actively called at runtime for scripts or fonts, ensuring no IP leakage to third-party font/script hosts.
*   **Third-Party Libraries (Local Execution):**
    *   `sonner`: Used for local toast notifications. Does *not* phone home or send data externally.
    *   `recharts`: Used for rendering charts (`PieChart`, `EquityCurve`, `BalanceCurve`). Renders entirely client-side using SVG/Canvas. Does *not* send data externally.
    *   `date-fns`: Used for date manipulation. Executes entirely client-side.
    *   `lucide-react`: Used for iconography. Executes entirely client-side.

---

## 3. Data Flows

All application data flows strictly between the React frontend (client browser) and the PocketBase backend. 

### A. User Data
*   **Data Collected:** Email address, Name, Password (hashed securely by PocketBase).
*   **Flow:** Sent from `SignupPage.jsx` and `LoginPage.jsx` via `AuthContext.jsx` to the PocketBase `users` collection.
*   **Storage:** Stored in the PocketBase `users` collection.

### B. Trade Data
*   **Data Collected:** Financial instrument symbols (e.g., EUR/USD), entry dates/times, stop loss values, risk/reward ratios, commission percentages, profit/loss calculations, trade status (Win/Loss/Breakeven), and optional URLs (context, validation, entry screenshots) and text notes.
*   **Flow:** Sent from `TradeEntryForm.jsx` and `EditTradeModal.jsx` to the PocketBase `trades` collection.
*   **Storage:** Stored in the PocketBase `trades` collection.

### C. User Settings Data
*   **Data Collected:** Starting account balance, global commission percentage.
*   **Flow:** Sent from `SettingsPage.jsx` and `AnalysisPage.jsx` to the PocketBase `userSettings` collection.
*   **Storage:** Stored in the PocketBase `userSettings` collection.

---

## 4. Credentials and Keys

The codebase is highly secure regarding hardcoded secrets.

*   **Hardcoded API Keys:** **None.** There are no hardcoded API keys for external services (e.g., no AWS keys, no SendGrid keys) in the frontend codebase.
*   **Authentication Tokens:** The application uses PocketBase's built-in authentication. Upon successful login, PocketBase issues a JWT (JSON Web Token).
    *   **Storage:** This token is managed automatically by the PocketBase JavaScript SDK (`pb.authStore`) and is typically stored in the browser's `localStorage`.
    *   **Usage:** The token is automatically attached to subsequent API requests to `/hcgi/platform` to authenticate the user.

---

## 5. Compliance Notes (GDPR / CCPA)

Because the application does not integrate with third-party trackers, advertisers, or external data processors, it maintains a very strong baseline for privacy compliance.

1.  **Data Minimization:** The app only collects data strictly necessary for its core function (trading journaling).
2.  **Third-Party Sharing:** No user data or financial trade data is shared with, sold to, or processed by third-party analytics or advertising networks.
3.  **Data Sovereignty:** All data resides within the provided PocketBase instance. 
4.  **Cookies/Local Storage:** The application uses local storage strictly for functional purposes (storing the authentication token via PocketBase SDK). There are no non-essential tracking or marketing cookies, which simplifies cookie consent banner requirements.

**Recommendation for Privacy Policy:**
Your privacy policy can accurately state that data is never sold to third parties, that no third-party tracking cookies are used, and that all financial and personal data is encrypted in transit and stored securely within the primary application database.