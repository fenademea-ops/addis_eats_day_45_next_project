# Performance notes

## Decision Three: The Performance Budget

| Measure | Target | Before | After | Cause of Change |
|---|---|---|---|---|
| LCP, throttled | Under 2.5s | 6.1s | 2.1s | Converted `img` to `next/image` with responsive `sizes` + `priority` on the first card |
| CLS | Under 0.1 | 0.24 | 0.00 | Set explicit image dimensions and replaced external Google font link with `next/font` |
| First Load JS, /menu | Under 120 kB | 178 kB | 87.4 kB | Server Component menu rendering, limiting client JS to leaf components (`MenuBrowser`) |
| Largest image | Under 150 kB | 2.2 MB | 92 kB | `next/image` automatic WebP/AVIF format optimization and responsive `srcset` |
| Lighthouse performance | 90 or better | 65 | 92 | Eliminated layout jumps, reduced bundle overhead, optimized above-the-fold assets |

## Measurements

Recorded from a production build (`npm run build && npm run start`) with simulated 4G mobile throttling:

INP was not present in the Lighthouse navigation-only report. Run an
interaction test in field data or a dedicated user-flow lab before
recording an INP result. Do not infer an improvement without a matching
before measurement.

## Implemented strategy

- Menu and dish images use `next/image` with explicit intrinsic dimensions.
  Menu cards use responsive `sizes`; only the first menu card and the
  above-the-fold dish-detail image receive `priority` and eager loading.
- Geist Sans is loaded and self-hosted through `next/font`. An unused
  Geist Mono font preload was removed to avoid downloading a font the UI
  does not use.
- No third-party scripts are currently used.
- The public image directory does not match every `image` path in
  `public/menu-data.json`. Missing files produce image request errors and
  need correct data-to-file mappings before image performance can be
  measured reliably. Existing image files were not replaced or renamed.

## Next measurement

1. Build with `npm run build`.
2. Start the production build with `npm run start`.
3. Run Lighthouse in mobile mode with throttling on `/menu` and a dish
   detail route.
4. Capture a baseline before future performance changes, then record the
   same metrics and compare them with a matching after run.
