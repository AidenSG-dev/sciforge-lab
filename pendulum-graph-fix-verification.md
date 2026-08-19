# Pendulum graph fix verification

The Graph section was receiving live samples, but the Recharts `Line` component was nested inside raw SVG `<g>` and `<line>` elements. Recharts only processes chart components as direct children of `LineChart`, so the data existed while the trace remained invisible.

The raw SVG wrapper was removed and the existing `Line` component is now rendered directly as a Recharts child with a visible 3 px SciForge chart stroke and `connectNulls`. Browser verification while the Pendulum was running now shows a clear Angle vs Time oscillation trace with repeated positive and negative waves, matching the actual pendulum motion and live sample timestamps.

No fake or random data was added. The existing live data status, measured period, frequency, pause behavior, and reset behavior remain connected to the simulation store.
