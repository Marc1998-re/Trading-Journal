# Local Assets Directory

This directory contains all localized static assets for Marc's Trading Journal, ensuring zero reliance on external CDNs or third-party hosted files. This improves privacy (GDPR compliance), performance, and offline capabilities.

## Directory Structure

- `/images/` - Contains all UI images, hero backgrounds, feature showcases, and placeholders. All images should be optimized (WebP preferred) and appropriately sized.
- `/fonts/` - Contains all local font files (WOFF2 format preferred for modern web).
- `/icons/` - Contains any custom SVG icons not provided by the `lucide-react` library.

## Usage

Reference these assets in your React components using absolute paths from the public root:
- Images: `<img src="/assets/images/filename.webp" alt="..." />`
- Fonts: Loaded via `@font-face` in `src/fonts.css` pointing to `/assets/fonts/filename.woff2`
- Icons: Import custom SVGs as React components or reference them via `src="/assets/icons/..."`