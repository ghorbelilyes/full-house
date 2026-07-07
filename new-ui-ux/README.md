# New UI/UX Refactor Kit

This folder is a standalone planning and prompt kit for redesigning the Protek ecommerce storefront. It does not change the live app, theme, configuration, products, cart logic, checkout logic, database, or extensions.

## Purpose

Use these files before starting the actual UI refactor. They define the design direction, component map, prompts, acceptance criteria, and QA checks for changing:

- Ecommerce storefront shell: header, search, navigation, footer
- Category, boutique, search, product listing, filters, sorting
- Product detail page, media gallery, variants, badges, reviews, CTA area
- Product cards, wishlist, buy-now interactions
- Cart, mini cart, floating cart, order summary
- Checkout UX polish and confidence messaging

## Project Context

- Store: Protek
- Market: Tunisia
- Language: French (`fr-TN`)
- Currency: TND
- Platform: EverShop 2.1.0 source monorepo
- Current theme status: no dedicated `themes/` folder detected; storefront uses customized core/default components
- Important brand assets: `public/logo.png`, `public/logo-white.png`, `public/icons/`, `public/og-image.png`

## Recommended Use

1. Read `01-design-brief.md` for the product and visual direction.
2. Use `03-component-inventory.md` to understand the real files and Area IDs.
3. Use `04-implementation-plan.md` when starting the code refactor.
4. Give `05-master-refactor-prompt.md` to an AI coding agent before implementation.
5. Use `06-page-prompts.md` for focused prompts by page or component.
6. Use `07-design-tokens.css` as the starting visual system.
7. Use `09-qa-checklist.md` before shipping.

## Non-Goals

- Do not rewrite backend logic.
- Do not change payment, shipping, inventory, auth, or order state behavior.
- Do not remove French localization.
- Do not break custom extensions such as wishlist, buyNow, productPromotion, productExtra, headerBar, spinToWin, or orderReturns.
- Do not hardcode production URLs, currency formatting, or product data.

## Best Implementation Path

Prefer an EverShop theme override when possible:

```bash
npm run theme:create -- --name protek-new-ui
npm run theme:active
```

If a component cannot be safely overridden by theme, document the reason before editing core files. The safer pattern is to match the original component path and filename in the theme, then enable the theme through config only after testing.

