# Final Plant Cell selection verification

The current repository now normalizes the selected Cell Type value (`plant`, `Plant cell`, `animal`, or `Animal cell`) before choosing a model. The viewport uses an explicit `selectedCellModel` discriminator and a keyed iframe remount.

Browser verification on `/simulation/biology-cell` confirmed:

- Default Animal cell renders the Animal Cell embed and attribution.
- Selecting Plant cell changes the selector value to Plant cell and renders the Eukaryotic Plant Cell Sketchfab embed, with attribution to `jlf_illustration`.

TypeScript, production build, and lint checks pass; lint only reports the existing six Fast Refresh warnings.
