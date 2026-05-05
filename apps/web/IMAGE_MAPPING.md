# Image Localization Mapping

This document tracks the migration of external CDN images to local assets. 
**Note:** You must manually download the original files and place them in the new local paths.

| Original External URL | New Local Path | Purpose |
| :--- | :--- | :--- |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/5b029b7a75ff1f233599a7935c0983c3.jpg` | `/assets/images/hero-bg.jpg` | Hero section background image |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/2ef0dac0656b3610e9e86c7f565d88fe.png` | `/assets/images/feature-logging.png` | Feature section screenshot (Detailed trade logging) |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/2abed67dc85685970e22ca81df37a90e.png` | `/assets/images/feature-analytics.png` | Feature section screenshot (Advanced analytics) |
| `https://horizons-cdn.hostinger.com/beca7509-df6d-4f5b-8e63-e6689e9bba49/27a38431605c335700a00c08b8d9c994.png` | `/assets/images/feature-insights.png` | Feature section screenshot (Visual insights) |

## Action Required
1. Download the images from the original URLs.
2. Optimize them (convert to WebP if possible).
3. Save them to `apps/web/public/assets/images/` using the exact filenames listed in the "New Local Path" column.