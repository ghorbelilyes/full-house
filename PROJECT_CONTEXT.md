# Project Context — Protek (EverShop)

## Executive Summary

Protek is a Tunisian e-commerce store specializing in **electricity and security products** (electrical supplies, security cameras, alarm systems, etc.). Built on the EverShop v2.1.0 open-source platform, it operates entirely in **French** with **TND (Tunisian Dinar)** currency. The project is the EverShop source monorepo customized for a specific business, not a generated store app.

## Business / User Problem Solved

Provides an online storefront for Tunisian customers to browse, search, and purchase electricity and security products with:
- French-language shopping experience
- TND pricing with tax-inclusive display
- Multiple shipping carriers (Navex, Aramex)
- Cash-on-delivery and online payment options
- Order tracking and return management
- Wishlist and "Buy Now" functionality

## Main Users / Personas

| Persona          | Description                                              |
|------------------|----------------------------------------------------------|
| **Shopper**      | Tunisian consumer browsing/buying products online        |
| **Store Admin**  | Staff managing products, orders, customers, promotions   |
| **Developer**    | Maintains/extends the platform codebase                  |

## Main Features

- **Catalog**: Products, categories, collections, attributes, variant groups, product search
- **Cart & Checkout**: Add to cart, buy now, shipping, payment, order confirmation
- **Customer Accounts**: Registration, login, order history, address management
- **Order Management (OMS)**: Order status workflow, shipment tracking, payment status
- **Promotions**: Coupon codes, product-level promotions, promotional pricing
- **Wishlist**: Save products for later
- **Admin Panel**: Full CRUD for products/categories/orders/customers, dashboard analytics
- **Email Notifications**: Order confirmation, customer welcome, password reset (SendGrid/SMTP)
- **AI Descriptions**: AI-generated product descriptions
- **Inventory History**: Stock change tracking
- **Order Documents**: Invoice/receipt generation
- **Order Returns**: Return request management
- **Header Bar**: Promotional announcement bar
- **Product Extra**: Additional product attributes/fields

## Key Domain Concepts

| Concept             | Meaning                                                    |
|---------------------|------------------------------------------------------------|
| Module              | Core platform feature area (auth, catalog, checkout, etc.) |
| Extension           | Plugin-style add-on (lives in `extensions/`)               |
| Theme               | Storefront appearance customization (lives in `themes/`)   |
| Route ID            | Unique folder name identifying a route                     |
| Area                | UI slot where React components are placed via `layout.areaId` |
| Variant Group       | Groups product variants (size, color, etc.)                |
| Collection          | Curated group of products                                  |
| PSO Mapping         | Payment Status + Shipment Status → Order Status mapping    |

## Glossary

| Term       | Translation (FR)      | Meaning                    |
|------------|----------------------|----------------------------|
| Nouvelle   | New                  | New order status           |
| Expédiée   | Shipped              | Shipped status             |
| Terminée   | Completed            | Completed order            |
| Annulée    | Canceled             | Canceled order             |
| En attente | Pending              | Pending status             |
| Livrée     | Delivered            | Delivered shipment         |
| Payée      | Paid                 | Payment received           |
| Remboursée | Refunded             | Payment refunded           |

## Main Flows

### Purchase Flow
1. Shopper browses catalog / searches products
2. Adds product to cart (or "Buy Now" for instant checkout)
3. Enters shipping address
4. Selects shipping method (Navex / Aramex)
5. Selects payment method (COD / PayPal / Stripe)
6. Places order → order status: `new` (Nouvelle)
7. Email notification sent to customer + admin
8. Admin ships order → `shipped` (Expédiée)
9. Delivery confirmed → `completed` (Terminée)

### Order Status Workflow
```
new → shipped → completed → return_requested → returned
  ↘ canceled    ↘ canceled
```

### Admin Product Management
1. Create product with attributes, images, pricing
2. Assign to categories and/or collections
3. Optionally create variant group with variants
4. Set inventory / stock
5. Publish (visible on storefront)

## External Services / Integrations

| Service     | Purpose                        | Config Location          |
|-------------|--------------------------------|--------------------------|
| PostgreSQL  | Primary database               | `.env` / `config/*.json` |
| SendGrid    | Transactional emails           | `.env`                   |
| SMTP        | Alternative email transport    | `.env`                   |
| PayPal      | Online payment                 | Module config            |
| Stripe      | Online payment                 | Module config            |
| Navex       | Shipping carrier (Tunisia)     | `config/default.json`    |
| Aramex      | Shipping carrier               | `config/default.json`    |
| OpenAI (AI) | AI product descriptions        | Extension config         |

## Important Environment Variables

| Variable              | Purpose                    | Secret? |
|-----------------------|----------------------------|---------|
| `DB_HOST`             | Database host              | No      |
| `DB_PORT`             | Database port              | No      |
| `DB_NAME`             | Database name              | No      |
| `DB_USER`             | Database user              | No      |
| `DB_PASSWORD`         | Database password          | **Yes** |
| `DB_SSLMODE`          | SSL mode                   | No      |
| `SENDGRID_API_KEY`    | Email API key              | **Yes** |
| `SMTP_HOST`           | SMTP server                | No      |
| `SMTP_PORT`           | SMTP port                  | No      |
| `SMTP_USER`           | SMTP username              | **Yes** |
| `SMTP_PASSWORD`       | SMTP password              | **Yes** |
| `ADMIN_EMAIL`         | Admin notification email   | No      |
| `STORE_URL`           | Public store URL           | No      |

## Current Project Status

- ✅ Core platform functional
- ✅ 11 custom extensions enabled
- ✅ French translations active (`fr-TN`)
- ✅ Order workflow with returns configured
- ✅ Multiple shipping carriers configured
- ⚠️ No active theme folder (using default)
- ⚠️ Dark mode extension disabled
- ⚠️ Language switcher disabled (French-only by design)
- ⚠️ Dockerfile references Node 18 (runtime uses Node 20)

## Open Questions / Unknowns

- Production deployment target not documented (VPS? Cloud?)
- Payment gateway (PayPal/Stripe) configuration status unknown
- AI description extension API key configuration unknown
- No CI/CD pipeline detected
- E2E (Cypress) test coverage unknown
- Theme customization status: no `themes/` directory in repo
- Exact PostgreSQL schema undocumented (auto-migrated)

## Needs Review / May Change

- Extension list may grow as business features are added
- Order status workflow may be extended
- Shipping carriers may change
- Payment methods may be updated
- Translation coverage may have gaps
