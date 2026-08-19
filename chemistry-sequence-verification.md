# Chemistry sequence verification

The Chemistry States of Matter module now exposes existing-architecture Phase animations controls for `Melting` and `Boiling` in the left panel.

The default paused 24°C state shows a lower-half contained water volume, visible surface, and all molecules inside the liquid.

Pressing `Melting` starts the module in RUNNING mode and shows a shared `MELTING / Ice → Water` state. The same particles deform from a compact lattice target into a liquid-flow target rather than switching to an unrelated effect.

Pressing `Boiling` drives the shared sequence to `BOILING / Water → Vapour`. Escaped particles are marked once they leave the liquid surface and do not return to the liquid target. The final gas state has no water surface or liquid fill and shows distributed vapour particles with escape trails.

Manual Temperature cooling to −180°C while paused reports `FREEZING / Water → Ice`; pressing Play allows the transition to proceed. The final solid state is a bottom-middle, non-square ice formation with 90 tightly packed vibrating molecules, subtle crystalline shell, and no liquid surface.

Play/Pause behavior remains explicit: the module opens paused, actions start the transition, Pause stops the motion, and Reset restores the current material/temperature state to its corresponding phase arrangement and clears the graph.
