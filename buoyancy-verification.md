# Buoyancy Lab verification

The Physics → Buoyancy Lab route was verified at `/simulation/physics-buoyancy` after replacing the placeholder registry entry with the real module.

The viewport now presents the SciForge live-model treatment: dark laboratory background, animated grid, glowing tank, translucent liquid, moving wave surface, flowing internal line, deterministic bubbles, illuminated object, cyan upward buoyant-force arrow, amber downward weight arrow, live numerical labels, and a bottom state card.

The default Water state uses 1000 kg/m³. With a 700 kg/m³ object at 0.01 m³, the simulation publishes weight 68.67 N and reaches a floating equilibrium at approximately 70% submerged, where buoyant force is 68.68 N. Releasing the object starts a smooth motion path and live force graph samples.

Density checks were verified through the existing Object Density slider. At 300 kg/m³, the module reports weight 29.43 N against a larger 68.68 N buoyant force and identifies the object as rising toward equilibrium. At 2400 kg/m³, it reports weight 235.44 N against 68.68 N buoyant force and identifies the object as sinking.

The Liquid selector exposes Water 1000 kg/m³, Sea Water 1025 kg/m³, Glycerine 1260 kg/m³, and Honey 1400 kg/m³. Glycerine visibly changes the liquid to a translucent violet tone with slower wave motion; Honey changes it to a warm amber/golden tone and updates buoyant force to 96.15 N for the verified 0.007 m³ displaced volume. Other presets use distinct blue/cyan and blue tones with different procedural animation speeds and bubble opacity.

No fluid engine or additional dependency was introduced. The graph uses actual computed displaced-volume, buoyant-force, and weight samples. The existing controls, workspace, layout, and all non-buoyancy simulations are unchanged.
