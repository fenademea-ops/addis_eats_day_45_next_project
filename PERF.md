# Performance notes

## Measurements

No before-change Lighthouse baseline was captured, so a before/after
comparison cannot be calculated. One Lighthouse run was performed against
the production `/menu?page=1` page with simulated throttling:

| Metric | Before | After |
|---|---:|---:|
| LCP | Not measured | 3.9 s |
| CLS | Not measured | 0.00 |
| INP | Not measured | Not reported |
| Lighthouse performance score | Not measured | 87 / 100 |

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
