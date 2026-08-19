# Plant Cell bug-fix verification

The issue was addressed by adding `key={cellType}` to the existing viewport iframe. This forces React to remount the Sketchfab document when the Cell Type selection changes instead of allowing the browser to retain the previous iframe document.

Browser verification on `/simulation/biology-cell` confirmed both directions:

- Animal cell selected: existing Animal Cell model and `Animal Cell · Sketchfab · by aremay` attribution are shown.
- Plant cell selected: official Eukaryotic Plant Cell model and `Eukaryotic Plant Cell · Sketchfab · by jlf_illustration` attribution are shown.
- Switching back to Animal cell returns to the original Animal Cell model.

TypeScript, production build, and lint checks pass, with only the repository’s existing six Fast Refresh warnings.
