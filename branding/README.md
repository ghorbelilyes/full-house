# Branding Handoff Guide

Use this guide when preparing a new client deployment or updating an existing client's branding.

The goal is simple:
- ask the client for the right branding inputs
- update only `branding/` and, if needed, `.env`
- avoid touching shared app logic

Important note:
- the app now reads runtime branding from `branding/`
- do not update `public/` for normal client rebrands
- copy or rename client files into `branding/assets/` using the canonical filenames below

## Agent Workflow

When a user asks to rebrand the app for a client, follow this order:

1. Collect the branding information listed below.
2. Confirm missing details before editing files.
3. Update:
   - `branding/config.json`
   - `branding/theme.css`
   - `branding/assets/*`
   - `branding/assets/site.webmanifest`
   - `branding/assets/browserconfig.xml`
4. Run `npm run build`.
5. Report which files were changed.

## What To Ask The Client

Ask for these items:

- Brand name
- Store display name
- Store short description
- Copyright text
- Primary color
- Primary strong/darker color
- Primary soft/light color
- Primary muted color
- Dark navy/main dark background color
- Dark navy soft/secondary dark color
- Browser theme color
- Storefront logo file
- Admin logo file
- Email logo file
- OG/social share image file
- Twitter card image file
- Favicon file
- Apple touch icon file
- Android app icon 192x192
- Android app icon 512x512
- Microsoft tile image

Also ask these if they matter:

- Preferred logo width/height if they already know it
- Whether the store description/tagline should appear in emails and social previews
- Whether the browser/app theme color should match the main orange or use a darker brand color

If the client does not provide all color variants, ask for at least:
- primary color
- dark color
- theme color

Then derive the rest conservatively from the existing palette or ask one follow-up question.

## Recommended Question Template

Use this exact structure with the client:

```md
Please send me the following branding items for your store:

1. Brand name:
2. Store display name:
3. Short store description:
4. Copyright text:
5. Primary color (hex):
6. Dark/navy color (hex):
7. Browser theme color (hex):
8. Storefront logo file:
9. Admin logo file:
10. Email logo file:
11. OG/social share image:
12. Twitter card image:
13. Favicon:
14. Apple touch icon:
15. Android icon 192x192:
16. Android icon 512x512:
17. Microsoft tile image:
18. Preferred storefront logo size, if known:
19. Preferred admin icon size, if known:
20. Preferred email logo size, if known:

If you want, I can reuse the storefront logo for admin/email/icons when separate files are not available.
```

## File Mapping

### Config file

Update [config.json](./config.json):

- `name`
- `content.storeName`
- `content.storeDescription`
- `content.copyRight`
- `logos.store.*`
- `logos.admin.*`
- `logos.email.*`
- `icons.*`
- `images.og`
- `images.twitter`
- `theme.themeColor`

Important:

- `logos.store.width` and `logos.store.height` should match the actual storefront logo file
- `logos.admin.width` and `logos.admin.height` should match the actual admin logo file
- `logos.email.width` and `logos.email.height` should match the actual email logo file
- keep asset paths under `/branding/...`

### Theme file

Update [theme.css](./theme.css):

- `--brand-primary`
- `--brand-primary-strong`
- `--brand-primary-soft`
- `--brand-primary-muted`
- `--brand-navy`
- `--brand-navy-soft`
- `--brand-shadow`
- `--primary`
- `--ring`
- `--background`
- `--foreground`
- `--secondary`
- `--muted`
- `--accent`
- `--sidebar-primary`
- any matching dark theme tokens if needed

Minimum recommended color set:

- primary brand color
- darker primary color
- soft/light brand color
- muted brand color
- dark main color
- dark secondary color
- browser theme color

### Asset folder

Place client files in [assets](./assets):

- `store-logo.png`
- `admin-logo.png`
- `email-logo.png`
- `favicon.ico`
- `apple-touch-icon.png`
- `android-chrome-192x192.png`
- `android-chrome-512x512.png`
- `mstile-150x150.png`
- `og-image.png`
- `twitter-card.png`
- `site.webmanifest`
- `browserconfig.xml`

Current canonical usage in the app:

- `store-logo.png`: storefront header logo
- `admin-logo.png`: admin header and admin login logo
- `email-logo.png`: email branding
- `favicon.ico`: default favicon
- `apple-touch-icon.png`: Apple devices
- `android-chrome-192x192.png` and `android-chrome-512x512.png`: PWA/app icons
- `mstile-150x150.png`: Microsoft tile icon
- `og-image.png`: default Open Graph image
- `twitter-card.png`: default Twitter/X share image

If the client sends a `public/` folder or mixed filenames, copy the right files into these canonical names.

## Manifest And Browser Config

Always review these two files after a rebrand:

- [assets/site.webmanifest](./assets/site.webmanifest)
- [assets/browserconfig.xml](./assets/browserconfig.xml)

Update:

- brand name / short name
- theme color
- background color
- tile color
- icon paths if filenames changed

## Defaults If Client Is Missing Files

Use these fallbacks:

- admin logo: reuse storefront logo
- email logo: reuse storefront logo
- twitter image: reuse OG image
- apple touch icon: reuse favicon source only if it is large enough
- browserconfig/site.webmanifest: regenerate paths and colors from the chosen assets
- logo sizes: use the real image dimensions when known, otherwise inspect the file and set matching width/height in `branding/config.json`

Do not invent a brand name or colors if the user has not approved them.

## Acceptance Checklist

Before closing the task, verify:

- storefront logo is correct
- admin login/header logo is correct
- email branding points to the correct logo
- logo dimensions in `branding/config.json` match the actual files
- favicon and manifest paths are correct
- browserconfig tile color and manifest theme/background color are correct
- primary buttons and highlights use the new brand color
- dark sections use the new dark brand color
- social preview images point to the correct OG/Twitter assets
- `npm run build` passes

Useful smoke surfaces:

- storefront header
- admin login page
- admin header
- email/logo fallback paths
- Open Graph / Twitter image defaults
- order documents if company/store branding is displayed

## Scope Rule

For normal client branding work, only change:

- `branding/config.json`
- `branding/theme.css`
- `branding/assets/*`
- `.env` if the domain or operational settings changed

Do not edit shared application logic unless the user explicitly asks for product changes.

## Quick Rebrand Recipe

For a normal new client, the shortest safe flow is:

1. Copy client assets into `branding/assets/` using the canonical filenames.
2. Update `branding/config.json` with:
   - brand name
   - store name
   - description
   - copyright
   - logo alt text
   - actual logo widths/heights
   - theme color
3. Update `branding/theme.css` with the client palette.
4. Update `branding/assets/site.webmanifest`.
5. Update `branding/assets/browserconfig.xml`.
6. Run `npm run build`.
