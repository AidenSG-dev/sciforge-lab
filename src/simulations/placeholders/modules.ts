import { createPlaceholderModule } from "./createPlaceholderModule";
import type { SimulationModule } from "../types";

/**
 * TEMPORARY: placeholder declarations for the eight planned simulations.
 * Replace individual entries with real modules as they are implemented.
 */

export const physicsPendulum: SimulationModule = createPlaceholderModule({
  id: "physics-pendulum",
  subject: "physics",
  title: "Interactive Pendulum",
  description: "Explore how pendulum length, angle and gravity affect its motion.",
  concepts: ["Oscillation", "Periodic motion", "Energy"],
  grade: "8-10",
  controls: [
    {
      kind: "slider",
      id: "length",
      label: "Pendulum Length",
      min: 0.5,
      max: 20,
      step: 0.1,
      unit: "m",
      defaultValue: 10,
      group: "Setup",
    },
    {
      kind: "slider",
      id: "angle",
      label: "Maximum Angle",
      min: 1,
      max: 60,
      step: 0.1,
      unit: "°",
      defaultValue: 10.8,
      group: "Setup",
    },
    {
      kind: "slider",
      id: "gravity",
      label: "Gravitational Acceleration",
      min: 1,
      max: 25,
      step: 0.1,
      unit: "m/s²",
      defaultValue: 9.8,
      group: "Environment",
    },
    {
      kind: "slider",
      id: "speed",
      label: "Animation Speed",
      min: 0.25,
      max: 3,
      step: 0.25,
      unit: "×",
      defaultValue: 1,
      group: "Environment",
    },
    {
      kind: "toggle",
      id: "damping",
      label: "Air resistance",
      defaultValue: false,
      group: "Environment",
    },
    {
      kind: "checkbox",
      id: "showTrail",
      label: "Show motion trail",
      defaultValue: true,
      group: "Display",
    },
  ],
  graph: {
    title: "Energy vs time",
    xLabel: "Time (s)",
    yLabel: "Energy (J)",
    series: [
      { id: "kinetic", label: "Kinetic", colorToken: 1 },
      { id: "potential", label: "Potential", colorToken: 5 },
    ],
  },
  explanation: {
    whatsHappening:
      "A pendulum swings back and forth as gravity pulls the mass toward its lowest point while inertia carries it past that point.",
    keyConcept:
      "For small angles the period of a simple pendulum depends on its length and on gravity — not on the mass of the bob.",
    formula: "T = 2π √(L / g)",
  },
  aspectRatio: 4 / 3,
});

export const physicsBuoyancy: SimulationModule = createPlaceholderModule({
  id: "physics-buoyancy",
  subject: "physics",
  title: "Buoyancy Lab",
  description: "Change density, volume and fluid to discover why objects float or sink.",
  concepts: ["Density", "Upthrust", "Pressure"],
  grade: "8-10",
  controls: [
    {
      kind: "slider",
      id: "objectDensity",
      label: "Object Density",
      min: 100,
      max: 3000,
      step: 10,
      unit: "kg/m³",
      defaultValue: 700,
      group: "Object",
    },
    {
      kind: "slider",
      id: "volume",
      label: "Object Volume",
      min: 0.001,
      max: 0.05,
      step: 0.001,
      unit: "m³",
      defaultValue: 0.01,
      group: "Object",
    },
    {
      kind: "select",
      id: "fluid",
      label: "Fluid",
      options: [
        { value: "water", label: "Water" },
        { value: "seawater", label: "Sea water" },
        { value: "oil", label: "Oil" },
        { value: "glycerine", label: "Glycerine" },
      ],
      defaultValue: "water",
      group: "Environment",
    },
    {
      kind: "toggle",
      id: "showForces",
      label: "Show force vectors",
      defaultValue: true,
      group: "Display",
    },
    { kind: "button", id: "drop", label: "Release object", actionId: "drop", variant: "subject" },
  ],
  graph: {
    title: "Force vs submerged volume",
    xLabel: "Submerged volume (m³)",
    yLabel: "Force (N)",
    series: [
      { id: "buoyant", label: "Buoyant force", colorToken: 1 },
      { id: "weight", label: "Weight", colorToken: 4 },
    ],
  },
  explanation: {
    whatsHappening:
      "A submerged object pushes fluid aside, and the fluid pushes back with an upward force equal to the weight of the fluid displaced.",
    keyConcept:
      "An object floats when its average density is lower than the density of the fluid around it.",
    formula: "F_b = ρ_fluid · V_displaced · g",
  },
});

export const chemistryStates: SimulationModule = createPlaceholderModule({
  id: "chemistry-states-of-matter",
  subject: "chemistry",
  title: "States of Matter",
  description: "Heat, cool and compress a substance to watch it change state.",
  concepts: ["Particle motion", "Phase change", "Latent heat"],
  grade: "6-8",
  controls: [
    {
      kind: "slider",
      id: "temperature",
      label: "Temperature",
      min: -100,
      max: 400,
      step: 1,
      unit: "°C",
      defaultValue: 25,
      group: "Conditions",
    },
    {
      kind: "slider",
      id: "pressure",
      label: "Pressure",
      min: 0.1,
      max: 5,
      step: 0.1,
      unit: "atm",
      defaultValue: 1,
      group: "Conditions",
    },
    {
      kind: "select",
      id: "substance",
      label: "Substance",
      options: [
        { value: "water", label: "Water" },
        { value: "ethanol", label: "Ethanol" },
        { value: "iron", label: "Iron" },
      ],
      defaultValue: "water",
      group: "Sample",
    },
    {
      kind: "select",
      id: "state",
      label: "Force state",
      options: [
        { value: "auto", label: "Follow conditions" },
        { value: "solid", label: "Solid" },
        { value: "liquid", label: "Liquid" },
        { value: "gas", label: "Gas" },
      ],
      defaultValue: "auto",
      group: "Sample",
    },
    {
      kind: "checkbox",
      id: "showParticleSpeed",
      label: "Show particle speed",
      defaultValue: true,
      group: "Display",
    },
  ],
  graph: {
    title: "Temperature vs time",
    xLabel: "Time (s)",
    yLabel: "Temperature (°C)",
    series: [{ id: "temperature", label: "Temperature", colorToken: 3 }],
  },
  explanation: {
    whatsHappening:
      "Adding energy makes particles move faster and weakens the attractions holding them in place, changing how the substance behaves.",
    keyConcept:
      "State depends on the balance between particle kinetic energy and the forces of attraction between particles.",
  },
});

export const chemistryBonding: SimulationModule = createPlaceholderModule({
  id: "chemistry-bonding",
  subject: "chemistry",
  title: "Chemical Bonding Explorer",
  description: "Combine atoms and see how electrons are shared or transferred.",
  concepts: ["Ionic bonds", "Covalent bonds", "Valence electrons"],
  grade: "9-12",
  controls: [
    {
      kind: "select",
      id: "atomA",
      label: "Atom A",
      options: [
        { value: "H", label: "Hydrogen" },
        { value: "Cl", label: "Chlorine" },
        { value: "C", label: "Carbon" },
        { value: "O", label: "Oxygen" },
      ],
      defaultValue: "Cl",
      group: "Atoms",
    },
    {
      kind: "select",
      id: "atomB",
      label: "Atom B",
      options: [
        { value: "Cl", label: "Chlorine" },
        { value: "O", label: "Oxygen" },
        { value: "H", label: "Hydrogen" },
        { value: "N", label: "Nitrogen" },
      ],
      defaultValue: "Cl",
      group: "Atoms",
    },
    {
      kind: "slider",
      id: "separation",
      label: "Atomic Separation",
      min: 0.5,
      max: 6,
      step: 0.1,
      unit: "Å",
      defaultValue: 2.4,
      group: "Geometry",
    },
    {
      kind: "checkbox",
      id: "showElectrons",
      label: "Show electron clouds",
      defaultValue: true,
      group: "Display",
    },
    { kind: "button", id: "bond", label: "Attempt bond", actionId: "bond", variant: "subject" },
  ],
  graph: {
    title: "Potential energy vs separation",
    xLabel: "Separation (Å)",
    yLabel: "Energy (kJ/mol)",
    series: [{ id: "energy", label: "Potential energy", colorToken: 3 }],
  },
  explanation: {
    whatsHappening:
      "Atoms rearrange their outer electrons to reach a more stable arrangement, either by transferring or by sharing them.",
    keyConcept:
      "Bond type follows electronegativity difference: large differences give ionic bonds, small differences give covalent bonds.",
  },
});

export const biologyHeart: SimulationModule = createPlaceholderModule({
  id: "biology-heart",
  subject: "biology",
  title: "Heart Circulation",
  description: "Follow blood through the heart, lungs and body as the heart rate changes.",
  concepts: ["Double circulation", "Gas exchange", "Heart rate"],
  grade: "8-10",
  controls: [
    {
      kind: "slider",
      id: "heartRate",
      label: "Heart Rate",
      min: 40,
      max: 200,
      step: 1,
      unit: "bpm",
      defaultValue: 72,
      group: "Body state",
    },
    {
      kind: "select",
      id: "activity",
      label: "Activity",
      options: [
        { value: "rest", label: "Resting" },
        { value: "walking", label: "Walking" },
        { value: "running", label: "Running" },
      ],
      defaultValue: "rest",
      group: "Body state",
    },
    {
      kind: "toggle",
      id: "highlightOxygen",
      label: "Highlight oxygenation",
      defaultValue: true,
      group: "Display",
    },
    {
      kind: "checkbox",
      id: "labels",
      label: "Show chamber labels",
      defaultValue: true,
      group: "Display",
    },
    {
      kind: "slider",
      id: "speed",
      label: "Playback Speed",
      min: 0.25,
      max: 2,
      step: 0.25,
      unit: "×",
      defaultValue: 1,
      group: "Display",
    },
  ],
  graph: {
    title: "Blood flow vs time",
    xLabel: "Time (s)",
    yLabel: "Flow (L/min)",
    series: [
      { id: "systemic", label: "Systemic", colorToken: 2 },
      { id: "pulmonary", label: "Pulmonary", colorToken: 1 },
    ],
  },
  explanation: {
    whatsHappening:
      "Blood moves through two linked loops: one to the lungs to collect oxygen, and one to the rest of the body to deliver it.",
    keyConcept:
      "Humans have a double circulatory system, which keeps oxygen-rich and oxygen-poor blood separate.",
  },
});

export const biologyCell: SimulationModule = createPlaceholderModule({
  id: "biology-cell",
  subject: "biology",
  title: "3D Cell Explorer",
  description: "Inspect organelles in an interactive three-dimensional cell.",
  concepts: ["Organelles", "Cell types", "Function"],
  grade: "6-8",
  controls: [
    {
      kind: "select",
      id: "cellType",
      label: "Cell Type",
      options: [
        { value: "animal", label: "Animal cell" },
        { value: "plant", label: "Plant cell" },
        { value: "bacterial", label: "Bacterial cell" },
      ],
      defaultValue: "animal",
      group: "Sample",
    },
    {
      kind: "select",
      id: "focus",
      label: "Focus Organelle",
      options: [
        { value: "none", label: "Whole cell" },
        { value: "nucleus", label: "Nucleus" },
        { value: "mitochondria", label: "Mitochondria" },
        { value: "membrane", label: "Cell membrane" },
      ],
      defaultValue: "none",
      group: "Sample",
    },
    {
      kind: "toggle",
      id: "crossSection",
      label: "Cross-section view",
      defaultValue: false,
      group: "Display",
    },
    {
      kind: "checkbox",
      id: "autoRotate",
      label: "Auto-rotate",
      defaultValue: true,
      group: "Display",
    },
  ],
  explanation: {
    whatsHappening:
      "Each organelle occupies a distinct region of the cell and carries out a specific job for the whole system.",
    keyConcept:
      "Cells are organised structures — structure and function are tightly linked at every scale of life.",
  },
  aspectRatio: 1,
});

export const roboticsCircuit: SimulationModule = createPlaceholderModule({
  id: "robotics-circuit",
  subject: "robotics",
  title: "Virtual Circuit Builder",
  description: "Place components, wire them up and test a working circuit.",
  concepts: ["Current", "Voltage", "Components"],
  grade: "8-10",
  layout: "robotics",
  controls: [
    {
      kind: "slider",
      id: "supplyVoltage",
      label: "Supply Voltage",
      min: 1.5,
      max: 12,
      step: 0.5,
      unit: "V",
      defaultValue: 5,
      group: "Power",
    },
    {
      kind: "slider",
      id: "resistance",
      label: "Series Resistance",
      min: 10,
      max: 1000,
      step: 10,
      unit: "Ω",
      defaultValue: 220,
      group: "Power",
    },
    { kind: "toggle", id: "powerOn", label: "Power", defaultValue: false, group: "Power" },
    {
      kind: "checkbox",
      id: "showCurrent",
      label: "Animate current flow",
      defaultValue: true,
      group: "Display",
    },
  ],
  graph: {
    title: "Current vs time",
    xLabel: "Time (s)",
    yLabel: "Current (mA)",
    series: [{ id: "current", label: "Current", colorToken: 4 }],
  },
  explanation: {
    whatsHappening:
      "Current flows only when the circuit forms a complete loop from one terminal of the supply to the other.",
    keyConcept: "Ohm's law links voltage, current and resistance in any simple resistive circuit.",
    formula: "V = I · R",
  },
});

export const roboticsObstacleRobot: SimulationModule = createPlaceholderModule({
  id: "robotics-obstacle-robot",
  subject: "robotics",
  title: "Obstacle-Avoiding Robot",
  description: "Tune sensors and logic, then watch the robot navigate a course.",
  concepts: ["Sensors", "Feedback", "Control logic"],
  grade: "9-12",
  layout: "robotics",
  controls: [
    {
      kind: "slider",
      id: "sensorRange",
      label: "Sensor Range",
      min: 5,
      max: 120,
      step: 1,
      unit: "cm",
      defaultValue: 30,
      group: "Sensing",
    },
    {
      kind: "slider",
      id: "turnAngle",
      label: "Turn Angle",
      min: 10,
      max: 180,
      step: 5,
      unit: "°",
      defaultValue: 45,
      group: "Logic",
    },
    {
      kind: "slider",
      id: "motorSpeed",
      label: "Motor Speed",
      min: 10,
      max: 100,
      step: 5,
      unit: "%",
      defaultValue: 60,
      group: "Logic",
    },
    {
      kind: "select",
      id: "strategy",
      label: "Avoidance Strategy",
      options: [
        { value: "turn-right", label: "Always turn right" },
        { value: "turn-away", label: "Turn away from obstacle" },
        { value: "reverse", label: "Reverse and rotate" },
      ],
      defaultValue: "turn-away",
      group: "Logic",
    },
    {
      kind: "toggle",
      id: "showSensorCone",
      label: "Show sensor cone",
      defaultValue: true,
      group: "Display",
    },
  ],
  graph: {
    title: "Distance to obstacle vs time",
    xLabel: "Time (s)",
    yLabel: "Distance (cm)",
    series: [{ id: "distance", label: "Distance", colorToken: 4 }],
  },
  explanation: {
    whatsHappening:
      "The robot repeatedly measures the distance ahead and chooses an action based on that reading.",
    keyConcept:
      "Autonomous behaviour comes from a sense–decide–act loop running many times per second.",
  },
});
