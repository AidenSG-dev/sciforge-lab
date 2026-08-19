# States of Matter verification

The Chemistry → States of Matter route was verified at `/simulation/chemistry-states-of-matter` after replacing the placeholder module.

The viewport is a lightweight 2.5D molecular chamber using SVG only: transparent chamber depth, perspective framing, spherical highlighted particles with depth-scaled size and opacity, soft glows, a subtle grid, animated liquid surface, and attraction links that become less visible as molecular freedom increases.

Water / Ice uses a melting point of 0°C and boiling point of 100°C. At the default 24°C it reports LIQUID with close-range flowing particles. At −180°C it reports SOLID with an organized lattice, low molecular energy, visible attraction links, and COOLING trend. At 300°C it reports GAS with widely distributed high-energy particles, warm glow, rapid diffusion styling, and HEATING trend.

Ethanol / Alcohol selection updates the material information to melting point −114°C and boiling point 78°C. At 300°C it reports GAS with VERY HIGH molecular energy and the ethanol-specific thresholds.

Play changes the control to Pause, starts continuous particle trajectories, and changes the Temperature vs time graph badge to live data with actual elapsed-time samples. Reset is wired to clear the graph and restore the current material/temperature initial state. Temperature changes smoothly alter vibration amplitude, liquid freedom, gas speed, depth glow, spacing, and attraction visibility through one continuous particle model rather than separate screenshot-like animations.

TypeScript, production build, and lint remain to be run for final validation. No additional dependencies or 3D engine were introduced.
