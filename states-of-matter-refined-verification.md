# Refined States of Matter verification

The Chemistry → States of Matter route was rechecked after the renderer refinement.

At the default 24°C Water state, the chamber shows a visible half-height water volume with the molecules contained inside the liquid region, a clear animated surface, and a `WATER / LIQUID LEVEL` label. The particles are close together and flow within the water rather than appearing throughout the empty chamber.

At −180°C, the module reports SOLID and renders a compact ice block in the lower middle of the chamber. The particles are densely packed inside that block with a subtle translucent ice shell, visible crack texture, lattice links, and blue cold treatment. The previous full-width line arrangement is gone.

At 300°C, the module reports GAS and renders particles throughout the bounded chamber with continuous trajectories, warm particle glows, orange-red side heat rails, `VAPOUR / DIFFUSION` labeling, and small upward gas-direction cues. Particles remain inside the chamber walls instead of escaping the viewport.

The route was paused during the temperature-state checks, so the phase-specific visuals remained still. After Play was pressed, the control changed to Pause, gas particles visibly moved along continuous paths, and the graph changed to live data with elapsed-time samples. This confirms animation remains Play-gated.

The changes are limited to the Chemistry States of Matter module renderer. No surrounding UI, other simulation, or additional dependency was modified.
