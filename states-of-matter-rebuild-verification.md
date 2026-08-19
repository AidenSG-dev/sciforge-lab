# States of Matter rebuild verification

The Chemistry → States of Matter visualization was rebuilt around one smoothed visual phase value rather than independent particle overlays.

At the default Water temperature of 24°C while paused, the chamber shows only a lower-half water region with an animated-looking surface held still until Play, and all molecules remain below that surface. The upper chamber remains empty.

After changing to −180°C while paused, the renderer correctly held the liquid state and reported a pending FREEZING transition. Pressing Play allowed the transition to proceed; the final state became SOLID with a compact, bottom-middle ice crystal, tightly packed lattice particles, blue crystalline shell, subtle crack texture, and no liquid surface or water layer.

After changing to 300°C while paused, the renderer correctly held the existing phase until Play. Pressing Play allowed the heating/boiling transition to proceed; the final state became GAS with widely distributed bounded particles, warm chamber-frame rails, vapour/diffusion cues, continuous wall-bouncing trajectories, and no visible liquid surface, liquid fill, or horizontal water boundary.

The final liquid, ice, and gas states are mutually exclusive. The transitions use smoothed particle targets and interpolated phase progress so molecules reorganize, move, and spread through the same simulation rather than switching between unrelated animations. Play starts movement and graph time; Pause freezes the phase transition and motion. The changes are limited to the Chemistry States of Matter module.
