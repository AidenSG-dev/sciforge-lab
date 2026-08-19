# Plant Cell verification

The existing Biology → 3D Cell Explorer route was verified with the default `Animal cell` selection, which continued to show the existing Animal Cell Sketchfab embed and attribution.

Selecting the existing `Plant cell` option swaps only the designated viewport iframe to `https://sketchfab.com/models/f258c65762e5435c9d58c1aa136b557a/embed?autospin=1`. The viewport remains responsive, and the embedded Sketchfab attribution plus explicit link to the official Eukaryotic Plant Cell model by `jlf_illustration` are visible. Other cell types do not receive the Plant Cell embed.

Validation passed: `pnpm exec tsc --noEmit`, `pnpm build`, and `pnpm lint` with only the repository’s existing Fast Refresh warnings.
