# Pendulum focused improvements verification

The existing Pendulum simulation was verified at `/simulation/physics-pendulum` after the focused changes.

The Graph section now starts with no fabricated points and displays `waiting for run`. After Play, it switches to `live data` and receives actual Angle (°) samples from the numerical simulation. The graph is driven by the same `theta` state used by the visible bob. The live graph and Current Angle stop changing when paused and are cleared by Reset.

Measurements now include Length, Gravity, Initial Angle, Period (T), Frequency (f), Current Angle, Current Time, and Oscillation count. The default period is 2.01 s and frequency is 0.50 Hz. After several cycles, the measured period replaces the theoretical estimate; a verified run produced 2.04 s and 0.49 Hz for the finite-angle simulation. Changing Length to 0.50 m updates the calculated period to 1.42 s and frequency to 0.70 Hz. Changing Length to 3.00 m updates the calculated period to 3.47 s and frequency to 0.29 Hz.

The visual geometry now uses a fixed 120 SVG pixels per physical metre. At the same angle and view scale, 0.50 m produces a 60 px rod while 3.00 m produces a 360 px rod, preserving the 6× length ratio and keeping the pivot fixed. Browser screenshots confirmed that 3.00 m renders visibly longer than 0.50 m while remaining within the fixed viewBox.

TypeScript, production build, and lint pass. Lint reports only the repository’s existing six Fast Refresh warnings in shared UI primitives.
