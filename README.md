# SciForge Lab

You are building the frontend of a science simulation platform called SciForge.

IMPORTANT:

This phase is ONLY about building the complete UI, frontend architecture, navigation, reusable components, and simulation integration framework.

DO NOT implement the actual scientific simulations yet.

DO NOT invent fake simulation behavior.

The simulation areas must be real, properly sized integration slots that can later receive independently developed simulation modules.

==================================================

PROJECT

==================================================

Name: SciForge

Tagline:

"Experiment with Science."

Purpose:

SciForge is an interactive science simulation platform for school-level science. Students should be able to manipulate scientific variables, observe how a system responds, and understand the concept through experimentation.

Subjects:

1. Physics

2. Chemistry

3. Biology

4. Robotics

The eventual simulations will include:

BIOLOGY

- Heart Circulation

- 3D Cell Explorer

CHEMISTRY

- States of Matter / Interconversion

- Chemical Bonding Explorer

PHYSICS

- Buoyancy / Floating Simulation

- Interactive Pendulum Simulation

ROBOTICS

- Virtual Circuit Builder

- Obstacle-Avoiding Robot

Do not implement these simulations yet. Build the UI so they can be plugged in later.

==================================================

TECH STACK

==================================================

Use:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui

- Lucide React

- Motion for animations

- React Router

- Zustand for application/UI state

- Recharts for graphs

Use clean, modular TypeScript.

Do NOT introduce unnecessary backend infrastructure, authentication, databases, Redux, GraphQL, etc.

The application should primarily be client-side.

==================================================

DESIGN DIRECTION

==================================================

SciForge should look like a premium interactive scientific laboratory, NOT a school website.

Visual character:

- sophisticated

- modern

- technical

- clean

- immersive

- spacious

- highly polished

- scientific without looking childish

- impressive enough for a technology/science competition

Avoid:

- childish cartoon styling

- generic education-dashboard aesthetics

- excessive gradients

- excessive glassmorphism

- huge decorative text

- clutter

- generic AI-generated landing-page appearance

- unnecessary rounded cards everywhere

Use subtle scientific visual language:

particles, grids, diagrams, molecular patterns, circuit traces, orbital/atomic motifs, etc., but keep them restrained.

Typography should be highly readable.

Animations should be smooth and purposeful.

The interface should feel like software students would actually use, not a presentation mockup.

==================================================

SUBJECT VISUAL IDENTITY

==================================================

Give each subject a distinct accent:

Physics:

Blue

Chemistry:

Purple

Biology:

Green

Robotics:

Orange

Use these accents selectively for:

- icons

- active states

- buttons

- simulation indicators

- graphs

- subtle highlights

Do not color entire pages aggressively.

==================================================

GLOBAL NAVIGATION

==================================================

Desktop navigation:

SciForge logo/name

Home

Explore

Physics

Chemistry

Biology

Robotics

Search

Keep navigation simple.

Include a responsive mobile/tablet navigation.

==================================================

HOME PAGE

==================================================

Create a strong hero section.

Content:

SCIFORGE

Experiment with Science.

"Interactive simulations that let you change variables, observe results, and understand why they happen."

Primary CTA:

Explore Simulations

Secondary CTA:

Explore Subjects

The hero should have an ORIGINAL subtle animated scientific visual rather than a stock image.

For example:

particles, molecular structures, circuit paths, or interconnected scientific systems.

Below the hero:

"Science shouldn't just be observed."

Then:

"Experiment with it."

Create three feature blocks:

CHANGE

Control scientific variables.

OBSERVE

Watch the system respond in real time.

UNDERSTAND

Discover the concept behind the result.

Then create:

"Explore Science"

Four large subject cards:

Physics

Motion • Forces • Electricity • Light

Chemistry

Matter • Reactions • Bonding

Biology

Cells • Systems • Life

Robotics

Circuits • Sensors • Automation

Each card should have a subtle animated visual representing its subject.

==================================================

EXPLORE PAGE

==================================================

Create a simulation discovery page.

Include:

Search simulations...

Filters:

Subject

Grade

Concept

Simulation cards should include:

- visual preview

- title

- short description

- subject

- grade range

- "Open Simulation"

Initially display the eight planned simulations as cards, but clicking them should open their simulation workspace with a placeholder because the simulation itself is not implemented yet.

==================================================

SUBJECT PAGES

==================================================

Each subject gets its own page.

Example:

PHYSICS

"Explore the laws that govern the physical world."

Then simulation cards.

Physics:

- Buoyancy Lab

- Interactive Pendulum

Chemistry:

- States of Matter

- Chemical Bonding Explorer

Biology:

- Heart Circulation

- 3D Cell Explorer

Robotics:

- Virtual Circuit Builder

- Obstacle-Avoiding Robot

Make these pages visually distinct but consistent.

==================================================

SIMULATION WORKSPACE

==================================================

THIS IS THE MOST IMPORTANT PART OF THE UI.

Create one reusable SimulationWorkspace component.

Every simulation must use the same general structure.

Desktop layout:

------------------------------------------------

← Physics

INTERACTIVE PENDULUM

Explore how pendulum length, angle and gravity

affect its motion.

------------------------------------------------

|                    |                         |

| EXPERIMENT         |                         |

|                    |                         |

| Controls           |     SIMULATION          |

|                    |     VIEWPORT            |

| sliders            |                         |

| toggles            |   [SIMULATION SLOT]     |

| buttons            |                         |

|                    |                         |

------------------------------------------------

| Measurements / Data                          |

------------------------------------------------

| Graph                                        |

------------------------------------------------

| What's happening?                            |

------------------------------------------------

The simulation viewport must be a dedicated component.

Create:

<SimulationWorkspace>

    <SimulationHeader />

    <SimulationControls />

    <SimulationViewport />

    <MeasurementsPanel />

    <GraphPanel />

    <ExplanationPanel />

</SimulationWorkspace>

The viewport must NOT contain simulation-specific assumptions.

It must be capable of hosting:

- Canvas

- SVG

- WebGL

- Three.js

- Matter.js

- custom simulation renderers

later.

==================================================

SIMULATION INTEGRATION ARCHITECTURE

==================================================

Create a clean simulation architecture BEFORE implementing simulations.

Create a SimulationModule TypeScript interface/type.

It should support concepts such as:

- id

- subject

- title

- description

- controls

- start

- pause

- reset

- resize

- cleanup

- parameter updates

- measurements

- graph data

- explanation content

The exact implementation is up to you, but make the interface strongly typed and documented.

The UI must NOT know how an individual simulation works internally.

For example, the UI should not care whether a pendulum is rendered with Canvas or whether a cell is rendered with Three.js.

The simulation module owns its scientific logic and rendering.

The UI owns:

- layout

- navigation

- controls framework

- measurements presentation

- graphs

- explanations

- loading/error states

==================================================

SIMULATION REGISTRY

==================================================

Create a central simulation registry.

It should allow future developers/agents to register simulations such as:

physics-pendulum

physics-buoyancy

chemistry-states-of-matter

chemistry-bonding

biology-heart

biology-cell

robotics-circuit

robotics-obstacle-robot

Initially the registry can contain placeholder modules.

Do not create fake scientific behavior.

The architecture should allow a future developer to replace a placeholder module without rewriting the SimulationWorkspace.

==================================================

CONTROLS

==================================================

Create reusable simulation control components:

- Slider

- Toggle

- Checkbox

- Select

- Number input

- Button

- Play/Pause controls

- Reset control

Controls should be visually polished.

Controls must be capable of being generated/configured by an individual simulation module rather than being hardcoded globally.

Example:

Pendulum may eventually provide:

Pendulum Length

Maximum Angle

Gravitational Acceleration

Animation Speed

States of Matter may eventually provide:

Temperature

Pressure

State controls

The UI framework must support both.

==================================================

MEASUREMENTS

==================================================

Create a reusable MeasurementsPanel.

Example:

CURRENT MEASUREMENTS

Length             10 m

Maximum Angle      10.8°

Gravity             9.8 m/s²

Period               6.3 s

The simulation will eventually provide these values.

The UI should simply render them.

==================================================

GRAPH PANEL

==================================================

Create a reusable GraphPanel using Recharts.

It must support live-updating data from simulations.

Examples eventually include:

- Energy vs time

- Temperature vs time

- Velocity vs time

- Force vs volume

Do not implement scientific calculations yet.

Use clearly marked mock data only for UI development and make it easy to remove.

==================================================

EXPLANATION PANEL

==================================================

Every simulation should eventually have:

WHAT'S HAPPENING?

A concise explanation of the current phenomenon.

KEY CONCEPT

A short educational explanation.

OPTIONAL:

Show formula / deeper explanation.

Build the reusable UI components now.

==================================================

EXPERIMENT MODE

==================================================

Create an optional "Experiment" panel.

It should support:

YOUR HYPOTHESIS

"What do you think will happen?"

[ input ]

OBSERVATION

"What changed?"

[ input ]

CONCLUSION

"Why did it happen?"

[ input ]

This is part of the educational identity of SciForge.

==================================================

ROBOTICS WORKSPACE

==================================================

Robotics simulations may require a different layout from ordinary science simulations.

Create a reusable RoboticsWorkspace layout capable of:

COMPONENTS

│

├ Arduino

├ LED

├ Resistor

├ Motor

├ Sensor

├ Battery

└ Button

BUILD AREA

PROGRAM / LOGIC AREA

The actual circuit/robot simulation is NOT implemented yet.

The UI must simply provide the architecture for it.

==================================================

LOADING / ERROR STATES

==================================================

Build proper states for:

- Simulation loading

- Simulation unavailable

- Simulation error

- Resetting

- Empty simulation

Do NOT show ugly browser alerts.

Use polished in-app states.

For an unimplemented simulation, show something like:

"Simulation module not connected yet."

This is temporary development UI and should be easy to replace.

==================================================

RESPONSIVE DESIGN

==================================================

Desktop is the primary target because this will be demonstrated to competition judges.

Also support:

- tablet

- smaller laptop screens

- mobile

The simulation viewport must resize dynamically.

Never allow the simulation area to overflow or break the surrounding UI.

==================================================

CODE ARCHITECTURE

==================================================

Use a clean structure similar to:

src/

  components/

    ui/

    navigation/

    simulation/

    charts/

    robotics/

  pages/

    Home/

    Explore/

    Subject/

    Simulation/

  simulations/

    registry/

    types/

    placeholders/

  stores/

  lib/

  types/

Keep simulation modules isolated from the general UI.

Document the simulation contract clearly in the codebase.

==================================================

IMPORTANT DEVELOPMENT RULES

==================================================

1. Build the UI completely before implementing actual scientific simulations.

2. Do not invent scientific calculations.

3. Do not hardcode simulation logic into generic UI components.

4. Do not make the UI dependent on a particular simulation engine.

5. Keep Canvas, SVG, WebGL and Three.js integration possible.

6. Every simulation must be replaceable independently.

7. Use TypeScript interfaces to define boundaries.

8. Keep components reusable.

9. Avoid unnecessary dependencies.

10. Make the UI polished enough to be competition-ready before simulations are added.

11. Use realistic placeholder content where necessary, but clearly separate it from actual simulation logic.

12. Ensure future coding agents can work on individual simulations without modifying the core application unnecessarily.

==================================================

FINAL OBJECTIVE

==================================================

When this phase is complete, I should be able to run SciForge and navigate:

Home

→ Explore

→ Physics

→ Pendulum

→ Simulation Workspace

and see a beautiful, fully functional simulation environment with an empty/placeholder viewport.

Later, a separate coding agent should be able to implement the actual pendulum simulation and plug it into the existing workspace without redesigning the page.

The same must work for every future simulation.

The priority order is:

1. Architecture

2. Usability

3. Visual quality

4. Responsive behavior

5. Simulation integration readiness

Build SciForge as a serious interactive scientific product, not as a school-project mockup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1b80b561-3872-4c5e-b7f9-e0f9085561f9).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
