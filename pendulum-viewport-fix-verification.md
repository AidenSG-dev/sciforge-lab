# Pendulum viewport fix verification

The Pendulum module was mounting correctly, but the shared `SimulationViewport` kept its placeholder/status content rendered over the same mount element. The Pendulum SVG existed at the correct viewport dimensions, yet that shared overlay could obscure the renderer in the designated area.

The viewport now provides a dedicated absolute mount surface for all non-Biology modules and renders the loading/unavailable/error placeholder only while `status !== "ready"`. This preserves the existing workspace, controls, and placeholder behavior while ensuring a ready module owns the full simulation viewport.

Browser verification at `/simulation/physics-pendulum` confirms the status is `READY`, the SVG renderer is visible in the designated viewport, and the Pendulum annotations, rod, bob, reference line, and live readout appear correctly.
