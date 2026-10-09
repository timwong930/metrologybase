# MetrologyBase

MetrologyBase is an independent resource for calibration professionals: practical metrology education, calculators, reference guides, and vendor-neutral equipment buying guidance.

## Current direction

The site is a custom static website rather than a documentation theme. The first revival release includes:

- Metrology fundamentals learning tracks
- Pressure, temperature, and electrical topic areas
- Interactive pressure-unit conversion
- Interactive TUR calculation
- Plain-language glossary content
- Responsive custom design inspired by the Made Visibly visual system

## Development

The site is framework-free HTML, CSS, and JavaScript.

```bash
npm run build
```

The build outputs the deployable site to `dist/`. Vercel is configured through `vercel.json`.

## Central site settings

Edit **`config/site.config.json`** to change branding and shared website settings:

- `site.name`, `site.mark`, `site.logoPath`, `site.faviconPath` and `site.tagline` control site identity.
- `theme.colors` overrides the existing CSS color variables on every generated page.
- `navigation.links` and `footer.links` control the shared menus; set `enabled: false` on a link to hide it.
- `footer.notice` controls the global footer disclaimer.
- `seo.homepageTitle` accepts `{siteName}`; `seo.homepageDescription` controls homepage SEO. Other pages retain their specific titles/descriptions while updating site branding.
- `site.url` optionally enables absolute canonical URLs. Leave blank until the production domain is set.
- `features.globalSearch` enables/disables injection of universal search; product-page filters remain independent.

Run `npm run test:settings` to test the settings renderer, then `npm run build`. The build applies the config to **all generated HTML pages**, including generated Additel pump pages, before building the search index. The source HTML files remain unchanged; do not edit `dist/` directly because it is regenerated at build time.

The shared header and footer now use build-time templates in `scripts/site-settings.mjs`. Individual pages retain their contextual header action buttons. Existing page-specific SEO descriptions, product specifications, and configurator logic stay in their source pages.

This is a **configuration-file workflow**, not an authenticated admin dashboard. Changes deploy through Git/Vercel after a build; do not put secrets in the public config file.

## Disclaimer

MetrologyBase is educational. Always verify acceptance criteria, specifications, uncertainty requirements, and procedures against authoritative standards, accredited procedures, and official manufacturer documentation.
