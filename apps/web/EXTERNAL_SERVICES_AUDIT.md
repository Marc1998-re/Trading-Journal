# External Services Inventory Report

**Date:** March 20, 2026  
**Project:** Trading Journal Application  
**Scope:** Comprehensive audit of all codebase files (HTML, CSS, JS/JSX, Configurations, package.json)

---

## 1. SUMMARY

Based on a thorough static analysis of the codebase, the application has a very minimal footprint regarding external third-party services. There are **zero** tracking, analytics, or advertising scripts installed.

**Total Count by Category:**
*   **Fonts / Typography:** 1
*   **Content Delivery Networks (Images):** 1
*   **Backend / API Services:** 1 (First-party / Platform provided)
*   **Analytics / Tracking:** 0
*   **Payment Processors:** 0
*   **Authentication Providers:** 0 (Handled internally via PocketBase)

---

## 2. DETAILED INVENTORY

### A. Fonts & Typography
**Google Fonts**
*   **Domain/URL:** `https://fonts.googleapis.com/css2?family=DM+Sans...`
*   **Purpose:** Provides the primary "DM Sans" typeface for the application's UI.
*   **Data Sent:** User's IP address, browser user-agent, and referring page (standard HTTP headers).
*   **Referenced In:** `apps/web/src/index.css` (`@import` statement).
*   **Essential/Optional:** Essential for current design, but technically optional (can fallback to system fonts or be hosted locally).
*   **Classification:** Font CDN.

### B. Content Delivery Networks (CDNs)
**Unsplash**
*   **Domain/URL:** `https://images.unsplash.com/photo-1640340435016-1964cf4e723b`
*   **Purpose:** Serves the background hero image on the landing page.
*   **Data Sent:** User's IP address, browser user-agent, and referring page (standard HTTP headers).
*   **Referenced In:** `apps/web/src/pages/HomePage.jsx` (`<img src="..." />`).
*   **Essential/Optional:** Optional (decorative).
*   **Classification:** Image CDN.

### C. Backend & API Services
**PocketBase (Platform Backend)**
*   **Domain/URL:** `/hcgi/platform` (Relative path routed to the platform's PocketBase instance).
*   **Purpose:** Handles all core application logic including user authentication, database CRUD operations (trades, settings), and session management.
*   **Data Sent:** 
    *   User Credentials (Email, Password, Name).
    *   Financial/Trade Data (Symbols, P&L, Stop Losses, Dates, Notes).
    *   Application Settings (Starting balances, commission rates).
*   **Referenced In:** `apps/web/src/lib/pocketbaseClient.js`, `package.json` (via `pocketbase` SDK), and utilized across all authenticated React components.
*   **Essential/Optional:** Essential (Core Infrastructure).
*   **Classification:** Primary Backend / Database / Auth.

---

## 3. DATA FLOW ANALYSIS

The application's data flow is highly centralized and secure, with almost all sensitive data remaining within the first-party ecosystem.

1.  **Authentication Flow:** User credentials (email/password) are sent directly from the React frontend to the PocketBase backend (`/hcgi/platform`). No third-party identity providers (like Auth0, Google OAuth, or Firebase) are used.
2.  **Financial Data Flow:** All trade entries, modifications, and deletions are transmitted directly to the PocketBase backend. No financial data is shared with external analytics platforms or third-party APIs.
3.  **Passive Metadata Flow:** When a user loads the application, their browser automatically makes GET requests to `fonts.googleapis.com` and `images.unsplash.com`. During these requests, the user's IP address and User-Agent string are exposed to Google and Unsplash, respectively.

---

## 4. COMPLIANCE NOTES (GDPR / CCPA / DSGVO)

Because the application does not use tracking cookies, analytics, or advertising pixels, it is inherently privacy-friendly. However, there are specific compliance implications regarding the passive external services:

*   **Google Fonts (GDPR/DSGVO Risk):** The dynamic loading of Google Fonts from Google's servers exposes the end-user's IP address to Google. Under the GDPR (and specifically highlighted by rulings in Germany/Austria), transmitting a user's IP address to Google without prior explicit consent is considered a violation of personal data protection. 
*   **Unsplash (GDPR/DSGVO Risk):** Similar to Google Fonts, loading images directly from Unsplash exposes the user's IP address to a third party.
*   **Cookie Consent:** Because there are no third-party tracking cookies, and local storage is only used for essential authentication tokens (via PocketBase), a complex cookie consent banner is likely **not required** under standard ePrivacy directives, provided the privacy policy clearly states this.

---

## 5. RECOMMENDATIONS

To achieve strict GDPR/DSGVO compliance and eliminate all third-party data leakage, the following technical changes are recommended:

1.  **Localize Fonts (High Priority):** Remove the `@import` statement for Google Fonts in `index.css`. Download the "DM Sans" font files (WOFF2 format) and serve them directly from the application's local public directory.
2.  **Localize Images (Medium Priority):** Download the hero image from Unsplash, place it in the application's `public` or `src/assets` folder, and reference it locally in `HomePage.jsx` instead of hotlinking to `images.unsplash.com`.
3.  **Privacy Policy Updates:** Ensure the privacy policy explicitly states that all user and financial data is stored securely on the primary server and is never sold, shared, or processed by third-party analytics or advertising networks.