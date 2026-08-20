import type {
  GraphSample,
  MountContext,
  ParamValue,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULTS = { atomA: "Cl", atomB: "Cl", separation: 2.4, showElectrons: true } as const;
const GRAPH_WINDOW = 180;

type AtomId = "H" | "C" | "O" | "Cl" | "N";
interface AtomData {
  symbol: AtomId;
  name: string;
  atomicNumber: number;
  shells: number[];
  valence: number;
  color: string;
}
interface Connection {
  a: number;
  b: number;
  order: 1 | 2 | 3;
}
interface MoleculeSpec {
  formula: string;
  name: string;
  bondLabel: string;
  sharedPairs: number;
  atoms: AtomId[];
  connections: Connection[];
  explanation: string;
}

const ATOMS: Record<AtomId, AtomData> = {
  H: { symbol: "H", name: "Hydrogen", atomicNumber: 1, shells: [1], valence: 1, color: "#f2fbff" },
  C: { symbol: "C", name: "Carbon", atomicNumber: 6, shells: [2, 4], valence: 4, color: "#b8c9d4" },
  N: {
    symbol: "N",
    name: "Nitrogen",
    atomicNumber: 7,
    shells: [2, 5],
    valence: 5,
    color: "#82d7ff",
  },
  O: { symbol: "O", name: "Oxygen", atomicNumber: 8, shells: [2, 6], valence: 6, color: "#ff8c76" },
  Cl: {
    symbol: "Cl",
    name: "Chlorine",
    atomicNumber: 17,
    shells: [2, 8, 7],
    valence: 7,
    color: "#adffbf",
  },
};

function readString(params: SimulationParams, id: string, fallback: string): string {
  return typeof params[id] === "string" ? params[id] : fallback;
}
function readNumber(params: SimulationParams, id: string, fallback: number): number {
  return typeof params[id] === "number" && Number.isFinite(params[id]) ? params[id] : fallback;
}
function readBoolean(params: SimulationParams, id: string, fallback: boolean): boolean {
  return typeof params[id] === "boolean" ? params[id] : fallback;
}
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function formulaFor(atoms: AtomId[]): string {
  const counts = new Map<AtomId, number>();
  atoms.forEach((atom) => counts.set(atom, (counts.get(atom) ?? 0) + 1));
  return ["C", "H", "N", "O", "Cl"]
    .filter((atom) => counts.has(atom as AtomId))
    .map((atom) => {
      const count = counts.get(atom as AtomId) ?? 0;
      return `${atom}${count > 1 ? count : ""}`;
    })
    .join("");
}

function getMolecule(a: AtomId, b: AtomId): MoleculeSpec | null {
  if (a === "H" && b === "H")
    return {
      formula: "H₂",
      name: "Dihydrogen",
      bondLabel: "SINGLE COVALENT",
      sharedPairs: 1,
      atoms: ["H", "H"],
      connections: [{ a: 0, b: 1, order: 1 }],
      explanation: "Each hydrogen atom contributes one electron, forming one shared electron pair.",
    };
  if (a === "O" && b === "O")
    return {
      formula: "O₂",
      name: "Dioxygen",
      bondLabel: "DOUBLE COVALENT",
      sharedPairs: 2,
      atoms: ["O", "O"],
      connections: [{ a: 0, b: 1, order: 2 }],
      explanation:
        "Each oxygen atom shares two electrons, forming two shared electron pairs and a double covalent bond.",
    };
  if (a === "N" && b === "N")
    return {
      formula: "N₂",
      name: "Dinitrogen",
      bondLabel: "TRIPLE COVALENT",
      sharedPairs: 3,
      atoms: ["N", "N"],
      connections: [{ a: 0, b: 1, order: 3 }],
      explanation:
        "Each nitrogen atom shares three electrons, forming three shared electron pairs and a triple covalent bond.",
    };
  if (a === "Cl" && b === "Cl")
    return {
      formula: "Cl₂",
      name: "Dichlorine",
      bondLabel: "SINGLE COVALENT",
      sharedPairs: 1,
      atoms: ["Cl", "Cl"],
      connections: [{ a: 0, b: 1, order: 1 }],
      explanation:
        "Each chlorine atom contributes one unpaired electron, forming one shared electron pair.",
    };
  if ((a === "H" && b === "Cl") || (a === "Cl" && b === "H"))
    return {
      formula: "HCl",
      name: "Hydrogen chloride",
      bondLabel: "SINGLE COVALENT",
      sharedPairs: 1,
      atoms: ["H", "Cl"],
      connections: [{ a: 0, b: 1, order: 1 }],
      explanation:
        "Hydrogen and chlorine each contribute one unpaired valence electron to form one shared electron pair.",
    };
  if ((a === "H" && b === "O") || (a === "O" && b === "H"))
    return {
      formula: "H₂O",
      name: "Water",
      bondLabel: "SINGLE COVALENT BONDS",
      sharedPairs: 2,
      atoms: ["O", "H", "H"],
      connections: [
        { a: 0, b: 1, order: 1 },
        { a: 0, b: 2, order: 1 },
      ],
      explanation:
        "Oxygen shares one electron pair with each hydrogen, creating two O–H single covalent bonds.",
    };
  if ((a === "C" && b === "O") || (a === "O" && b === "C"))
    return {
      formula: "CO₂",
      name: "Carbon dioxide",
      bondLabel: "DOUBLE COVALENT BONDS",
      sharedPairs: 4,
      atoms: ["C", "O", "O"],
      connections: [
        { a: 0, b: 1, order: 2 },
        { a: 0, b: 2, order: 2 },
      ],
      explanation:
        "Carbon shares two electron pairs with each oxygen, forming two C=O double bonds.",
    };
  if ((a === "C" && b === "H") || (a === "H" && b === "C"))
    return {
      formula: "CH₄",
      name: "Methane",
      bondLabel: "SINGLE COVALENT BONDS",
      sharedPairs: 4,
      atoms: ["C", "H", "H", "H", "H"],
      connections: [
        { a: 0, b: 1, order: 1 },
        { a: 0, b: 2, order: 1 },
        { a: 0, b: 3, order: 1 },
        { a: 0, b: 4, order: 1 },
      ],
      explanation:
        "Carbon shares one electron pair with each of four hydrogen atoms, forming methane.",
    };
  if ((a === "N" && b === "H") || (a === "H" && b === "N"))
    return {
      formula: "NH₃",
      name: "Ammonia",
      bondLabel: "SINGLE COVALENT BONDS",
      sharedPairs: 3,
      atoms: ["N", "H", "H", "H"],
      connections: [
        { a: 0, b: 1, order: 1 },
        { a: 0, b: 2, order: 1 },
        { a: 0, b: 3, order: 1 },
      ],
      explanation:
        "Nitrogen shares one electron pair with each of three hydrogen atoms, forming ammonia.",
    };
  return null;
}

function createBondingModule(): SimulationModule {
  return {
    id: "chemistry-bonding",
    subject: "chemistry",
    title: "Covalent Bond Explorer",
    description: "Watch atoms approach, share valence electrons and form a living covalent bond.",
    concepts: ["Valence electrons", "Electron sharing", "Covalent bonds"],
    grade: "9-12",
    status: "ready",
    controls: [
      {
        kind: "select",
        id: "atomA",
        label: "Atom A",
        options: [
          { value: "H", label: "Hydrogen" },
          { value: "C", label: "Carbon" },
          { value: "O", label: "Oxygen" },
          { value: "Cl", label: "Chlorine" },
          { value: "N", label: "Nitrogen" },
        ],
        defaultValue: DEFAULTS.atomA,
        group: "Atoms",
      },
      {
        kind: "select",
        id: "atomB",
        label: "Atom B",
        options: [
          { value: "H", label: "Hydrogen" },
          { value: "C", label: "Carbon" },
          { value: "Cl", label: "Chlorine" },
          { value: "N", label: "Nitrogen" },
          { value: "O", label: "Oxygen" },
        ],
        defaultValue: DEFAULTS.atomB,
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
        defaultValue: DEFAULTS.separation,
        group: "Geometry",
      },
      {
        kind: "checkbox",
        id: "showElectrons",
        label: "Show valence electrons",
        defaultValue: DEFAULTS.showElectrons,
        group: "Display",
      },
      {
        kind: "button",
        id: "bond",
        label: "Form covalent bond",
        actionId: "bond",
        variant: "subject",
        group: "Experiment",
      },
    ],
    graph: {
      title: "Bond formation energy",
      xLabel: "Time (s)",
      yLabel: "Relative energy",
      series: [{ id: "energy", label: "Bond energy", colorToken: 3 }],
      window: GRAPH_WINDOW,
    },
    explanation: {
      whatsHappening:
        "Select two atoms and press Play to watch their valence electrons move into a shared bonding region.",
      keyConcept:
        "A covalent bond forms when atoms share electron pairs to reach a more stable outer arrangement.",
      deeperDive:
        "The renderer is an educational Lewis-style model: it shows valence electrons, shared pairs, bond order and the resulting molecular arrangement.",
    },
    aspectRatio: 4 / 3,
    mount(context: MountContext): SimulationInstance {
      const { container, host } = context;
      let params = { ...context.params };
      let atomA = readString(params, "atomA", DEFAULTS.atomA) as AtomId;
      let atomB = readString(params, "atomB", DEFAULTS.atomB) as AtomId;
      let separation = readNumber(params, "separation", DEFAULTS.separation);
      let showElectrons = readBoolean(params, "showElectrons", DEFAULTS.showElectrons);
      let spec = getMolecule(atomA, atomB);
      let running = false;
      let formed = false;
      let progress = 0;
      let elapsed = 0;
      let lastTime = performance.now();
      let raf = 0;
      let graphAccumulator = 0;
      let width = 800;
      let height = 600;

      const root = document.createElement("div");
      root.className = "absolute inset-0 overflow-hidden";
      container.replaceChildren(root);
      const scene = svg("svg", {
        viewBox: "0 0 800 600",
        class: "h-full w-full",
        role: "img",
        "aria-label": "Interactive covalent bond explorer",
        preserveAspectRatio: "xMidYMid meet",
      });
      const defs = svg("defs", {});
      const bg = svg("linearGradient", { id: "bond-bg", x1: "0", y1: "0", x2: "0", y2: "1" });
      bg.append(
        svg("stop", { offset: "0%", "stop-color": "#111a35" }),
        svg("stop", { offset: "100%", "stop-color": "#070c18" }),
      );
      const grid = svg("pattern", {
        id: "bond-grid",
        width: "32",
        height: "32",
        patternUnits: "userSpaceOnUse",
      });
      grid.append(
        svg("path", {
          d: "M 32 0 L 0 0 0 32",
          fill: "none",
          stroke: "#7cb5e8",
          "stroke-opacity": "0.08",
        }),
      );
      const glow = svg("filter", {
        id: "bond-glow",
        x: "-100%",
        y: "-100%",
        width: "300%",
        height: "300%",
      });
      glow.append(svg("feGaussianBlur", { stdDeviation: "5" }));
      defs.append(bg, grid, glow);
      scene.append(
        defs,
        svg("rect", { width: "800", height: "600", fill: "url(#bond-bg)" }),
        svg("rect", { width: "800", height: "600", fill: "url(#bond-grid)" }),
      );
      const title = svg("text", {
        x: "32",
        y: "48",
        fill: "#7ce7ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "13",
        "letter-spacing": "2.5",
      });
      title.textContent = "COVALENT BOND / LIVE MODEL";
      const subtitle = svg("text", {
        x: "32",
        y: "76",
        fill: "#a9d4e5",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
      });
      const bondLayer = svg("g", {});
      const electronLayer = svg("g", {});
      const atomLayer = svg("g", {});
      const infoPanel = svg("rect", {
        x: "32",
        y: "438",
        width: "226",
        height: "138",
        rx: "14",
        fill: "#080f1a",
        "fill-opacity": "0.88",
        stroke: "#8bbbe4",
        "stroke-opacity": "0.3",
      });
      const infoText = svg("text", {
        x: "52",
        y: "468",
        fill: "#dff8ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
      });
      const infoRows = ["MOLECULE", "BOND TYPE", "SHARED PAIRS", "VALENCE A / B"];
      infoRows.forEach((label, index) => {
        const t = svg("tspan", { x: "52", dy: index === 0 ? "0" : "23" });
        t.textContent = label;
        infoText.append(t);
      });
      const phaseBadge = svg("rect", {
        x: "618",
        y: "104",
        width: "140",
        height: "28",
        rx: "14",
        fill: "#07111d",
        stroke: "#76eaff",
        "stroke-opacity": "0.4",
      });
      const phaseText = svg("text", {
        x: "688",
        y: "122",
        fill: "#86efff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "text-anchor": "middle",
        "letter-spacing": "1.4",
      });
      scene.append(
        title,
        subtitle,
        bondLayer,
        electronLayer,
        atomLayer,
        infoPanel,
        infoText,
        phaseBadge,
        phaseText,
      );
      root.append(scene);

      function positions(
        count: number,
        distance: number,
        formedProgress: number,
      ): Array<{ x: number; y: number }> {
        const separated =
          count <= 2
            ? [
                { x: 266, y: 308 },
                { x: 534, y: 308 },
              ]
            : count === 3
              ? [
                  { x: 250, y: 230 },
                  { x: 550, y: 230 },
                  { x: 400, y: 460 },
                ]
              : count === 4
                ? [
                    { x: 220, y: 210 },
                    { x: 580, y: 210 },
                    { x: 220, y: 430 },
                    { x: 580, y: 430 },
                  ]
                : [
                    { x: 180, y: 190 },
                    { x: 620, y: 190 },
                    { x: 180, y: 430 },
                    { x: 620, y: 430 },
                    { x: 400, y: 500 },
                  ];
        const moleculeFormula = spec?.formula;
        const outerRadiusFor = (symbol: AtomId | undefined) =>
          (ATOMS[symbol ?? "H"]?.shells.length ?? 1) > 1 ? 80 : 60;
        const bondedOuterRadius = Math.max(
          60,
          ...(spec?.atoms ?? []).map((symbol) => outerRadiusFor(symbol)),
        );
        const diatomicOuterSum =
          count === 2
            ? outerRadiusFor(spec?.atoms[0]) + outerRadiusFor(spec?.atoms[1])
            : bondedOuterRadius * 2;
        const finalCenterDistance = diatomicOuterSum - 10;
        const final: Array<{ x: number; y: number }> =
          count === 2
            ? [
                { x: 400 - finalCenterDistance / 2, y: 308 },
                { x: 400 + finalCenterDistance / 2, y: 308 },
              ]
            : moleculeFormula === "H₂O"
              ? [
                  { x: 400, y: 300 },
                  { x: 330, y: 395 },
                  { x: 470, y: 395 },
                ]
              : moleculeFormula === "CO₂"
                ? [
                    { x: 400, y: 300 },
                    { x: 275, y: 300 },
                    { x: 525, y: 300 },
                  ]
                : moleculeFormula === "NH₃"
                  ? [
                      { x: 400, y: 300 },
                      { x: 400, y: 165 },
                      { x: 270, y: 320 },
                      { x: 530, y: 320 },
                    ]
                  : moleculeFormula === "CH₄"
                    ? [
                        { x: 400, y: 300 },
                        { x: 400, y: 165 },
                        { x: 265, y: 300 },
                        { x: 535, y: 300 },
                        { x: 400, y: 435 },
                      ]
                    : [{ x: 400, y: 300 }];
        return final.map((point, index) => {
          const start = separated[index] ?? separated[0] ?? { x: 400, y: 300 };
          return {
            x: start.x + (point.x - start.x) * formedProgress,
            y: start.y + (point.y - start.y) * formedProgress,
          };
        });
      }

      function updateMeasurements() {
        if (!spec) {
          host.publishMeasurements([
            { id: "status", label: "Bonding status", value: "Unsupported combination" },
            {
              id: "valence",
              label: "Valence A / B",
              value: `${ATOMS[atomA]?.valence ?? "?"} / ${ATOMS[atomB]?.valence ?? "?"}`,
            },
          ]);
          host.publishExplanation({
            whatsHappening:
              "This pair is not represented by a basic covalent configuration in this explorer. Choose a supported educational example instead.",
          });
          return;
        }
        host.publishMeasurements([
          { id: "molecule", label: "Molecule", value: spec.formula, emphasis: true },
          { id: "bond-type", label: "Bond type", value: spec.bondLabel },
          {
            id: "shared-pairs",
            label: "Shared electron pairs",
            value: spec.sharedPairs,
            precision: 0,
          },
          {
            id: "valence",
            label: "Valence A / B",
            value: `${ATOMS[atomA]?.valence ?? "?"} / ${ATOMS[atomB]?.valence ?? "?"}`,
          },
          {
            id: "status",
            label: "Formation",
            value: formed ? "Bond established" : running ? "Forming bond" : "Separated atoms",
          },
        ]);
        host.publishExplanation({ whatsHappening: spec.explanation });
      }

      function render(now: number) {
        const dt = Math.min(0.05, Math.max(0, (now - lastTime) / 1000));
        lastTime = now;
        if (running && spec) {
          elapsed += dt;
          progress = clamp(progress + dt * 0.42, 0, 1);
          if (progress >= 1) formed = true;
          graphAccumulator += dt;
          if (graphAccumulator > 1 / 12) {
            host.publishGraphSample({ x: elapsed, energy: formed ? -1 : 1 - progress });
            graphAccumulator = 0;
            updateMeasurements();
          }
        }
        const phase = spec ? progress : 0;
        const atomPositions = positions(spec?.atoms.length ?? 2, separation, phase);
        atomLayer.replaceChildren();
        electronLayer.replaceChildren();
        bondLayer.replaceChildren();
        const currentSpec = spec;
        if (currentSpec) {
          const amplitude = formed ? 1.2 : 0;
          const shareProgress = clamp((phase - 0.55) / 0.45, 0, 1);
          currentSpec.atoms.forEach((symbol, index) => {
            const data = ATOMS[symbol];
            const point = atomPositions[index] ?? { x: 400, y: 300 };
            const driftTime = running ? now : 0;
            const x = point.x + Math.sin(driftTime * 0.002 + index) * amplitude;
            const y = point.y + Math.cos(driftTime * 0.0018 + index) * amplitude;
            const connectionsForAtom = currentSpec.connections.filter(
              (connection) => connection.a === index || connection.b === index,
            );
            const bondingPairs = connectionsForAtom.reduce(
              (total, connection) => total + connection.order,
              0,
            );
            data.shells.forEach((shellElectrons, shellIndex) => {
              const isInnerShell = shellIndex === 0;
              const isValenceShell = shellIndex === data.shells.length - 1;
              // Shell gaps: nucleus → K = 20px, each inner gap = 20px, preceding shell → valence = 30px.
              // Only the outer green valence shell is allowed to intersect its partner.
              const radius =
                data.shells.length === 1 ? 60 : isValenceShell ? 80 : 30 + shellIndex * 20;
              const shellRotation = running && (isInnerShell ? data.shells.length > 1 : !formed);
              const shellTime = shellRotation ? now : 0;
              atomLayer.append(
                svg("circle", {
                  cx: String(x),
                  cy: String(y),
                  r: String(radius),
                  fill: "none",
                  stroke: isValenceShell ? data.color : "#c9e8ff",
                  "stroke-opacity": isValenceShell ? "0.88" : "0.72",
                  "stroke-width": isValenceShell ? "2.4" : "2",
                  "stroke-dasharray": isValenceShell ? "8 6" : "none",
                }),
              );
              if (!showElectrons) return;
              const unpairedCount = isValenceShell
                ? shellElectrons <= 4
                  ? shellElectrons
                  : 8 - shellElectrons
                : 0;
              const orbitalGroupCount =
                unpairedCount + Math.ceil((shellElectrons - unpairedCount) / 2);
              for (let electron = 0; electron < shellElectrons; electron += 1) {
                const inUnpairedGroup = electron < unpairedCount;
                const orbitalGroup = inUnpairedGroup
                  ? electron
                  : unpairedCount + Math.floor((electron - unpairedCount) / 2);
                const inPair = inUnpairedGroup ? 0 : (electron - unpairedCount) % 2;
                let angle =
                  (orbitalGroup / Math.max(1, orbitalGroupCount)) * Math.PI * 2 + inPair * 0.14;
                if (isInnerShell && shellElectrons === 2) {
                  // K-shell electrons are an opposite pair, never stacked together.
                  angle = (electron === 0 ? 0 : Math.PI) + shellTime * 0.0003;
                } else if (isValenceShell && connectionsForAtom.length === 1) {
                  const connection = connectionsForAtom[0]!;
                  const otherIndex = connection.a === index ? connection.b : connection.a;
                  const otherPoint = atomPositions[otherIndex] ?? point;
                  const bondAngle = Math.atan2(otherPoint.y - point.y, otherPoint.x - point.x);
                  const directionalSlots = [0, -Math.PI / 2, Math.PI, Math.PI / 2];
                  const isNonBondingPair = !inUnpairedGroup && connection.order > 1;
                  const nonBondingAngle =
                    orbitalGroup - unpairedCount === 0 ? -Math.PI / 2 : Math.PI / 2;
                  angle =
                    bondAngle +
                    (isNonBondingPair ? nonBondingAngle : (directionalSlots[orbitalGroup] ?? 0)) +
                    inPair * 0.14;
                } else {
                  angle +=
                    shellTime * (isInnerShell ? 0.0003 : 0.0002) * (index % 2 === 0 ? 1 : -1);
                }
                const orbitX = x + Math.cos(angle) * radius;
                const orbitY = y + Math.sin(angle) * radius;
                const highlighted =
                  isValenceShell && electron < Math.min(bondingPairs, unpairedCount);
                const highlightedIndex = highlighted ? electron : -1;
                let targetX = orbitX;
                let targetY = orbitY;
                if (highlighted && connectionsForAtom.length > 0) {
                  let remaining = highlightedIndex;
                  let selectedConnection = connectionsForAtom[0]!;
                  let pairInConnection = 0;
                  for (const connection of connectionsForAtom) {
                    if (remaining < connection.order) {
                      selectedConnection = connection;
                      pairInConnection = remaining;
                      break;
                    }
                    remaining -= connection.order;
                  }
                  const otherIndex =
                    selectedConnection.a === index ? selectedConnection.b : selectedConnection.a;
                  const otherPoint = atomPositions[otherIndex] ?? point;
                  const bondStart = atomPositions[selectedConnection.a] ?? point;
                  const bondEnd = atomPositions[selectedConnection.b] ?? otherPoint;
                  const dx = bondEnd.x - bondStart.x;
                  const dy = bondEnd.y - bondStart.y;
                  const length = Math.max(1, Math.hypot(dx, dy));
                  // Use one canonical normal for both atoms so the pair is always opposite: top/bottom for a horizontal bond.
                  const normalX = -dy / length;
                  const normalY = dx / length;
                  const overlapCenterX = (x + otherPoint.x) / 2;
                  const overlapCenterY = (y + otherPoint.y) / 2;
                  const memberSign = selectedConnection.a === index ? -1 : 1;
                  const overlapOffset =
                    selectedConnection.order === 1
                      ? memberSign * 20
                      : (pairInConnection - (selectedConnection.order - 1) / 2) * 14;
                  const bondUnitX = dx / length;
                  const bondUnitY = dy / length;
                  const sharedAxisOffset =
                    selectedConnection.order > 1
                      ? (selectedConnection.a === index ? -1 : 1) * 7
                      : 0;
                  const target = {
                    x: overlapCenterX + normalX * overlapOffset + bondUnitX * sharedAxisOffset,
                    y: overlapCenterY + normalY * overlapOffset + bondUnitY * sharedAxisOffset,
                  };
                  targetX = orbitX + (target.x - orbitX) * shareProgress;
                  targetY = orbitY + (target.y - orbitY) * shareProgress;
                }
                electronLayer.append(
                  svg("circle", {
                    cx: String(targetX),
                    cy: String(targetY),
                    r: highlighted ? "5" : "3.5",
                    fill: highlighted ? "#ffd83d" : "#f3fbff",
                    "fill-opacity": highlighted ? "1" : "0.86",
                  }),
                );
              }
            });
            atomLayer.append(
              svg("circle", {
                cx: String(x),
                cy: String(y),
                r: "20",
                fill: "#0b1626",
                stroke: data.color,
                "stroke-width": "2",
                "stroke-opacity": "0.9",
              }),
            );
            const label = svg("text", {
              x: String(x),
              y: String(y + 7),
              fill: data.color,
              "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
              "font-size": symbol.length > 1 ? "21" : "25",
              "font-weight": "700",
              "text-anchor": "middle",
            });
            label.textContent = symbol;
            atomLayer.append(label);
            const meta = svg("text", {
              x: String(x),
              y: String(y + 58),
              fill: "#a9c9d9",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
              "font-size": "9",
              "text-anchor": "middle",
            });
            meta.textContent = `Z ${data.atomicNumber} · ${data.shells.join(",")} · V ${data.valence}`;
            atomLayer.append(meta);
          });
          // The overlapping shell circumferences are the bond paths. Shared electrons
          // are rendered above them as the only bond marker, keeping the chemistry legible.
          bondLayer.replaceChildren();
          subtitle.textContent = `${currentSpec.formula}  ·  ${currentSpec.bondLabel}  ·  ${currentSpec.sharedPairs} SHARED PAIR${currentSpec.sharedPairs === 1 ? "" : "S"}`;
          phaseText.textContent = formed
            ? "STABLE MOLECULE"
            : !running
              ? "SEPARATED ATOMS"
              : phase < 0.28
                ? "ATOMS APPROACH"
                : phase < 0.55
                  ? "VALENCE ELECTRONS"
                  : phase < 0.8
                    ? "SHELLS OVERLAP"
                    : "SHARED ELECTRON PAIRS";
        } else {
          subtitle.textContent = `${atomA} + ${atomB}  ·  NO BASIC COVALENT CONFIGURATION`;
          phaseText.textContent = "UNSUPPORTED PAIR";
        }
        const a = ATOMS[atomA];
        const b = ATOMS[atomB];
        infoText.replaceChildren();
        const rows = spec
          ? [
              `MOLECULE       ${spec.formula}`,
              `BOND TYPE      ${spec.bondLabel}`,
              `SHARED PAIRS   ${spec.sharedPairs}`,
              `VALENCE A / B   ${a?.valence ?? "?"} / ${b?.valence ?? "?"}`,
            ]
          : [
              "MOLECULE       —",
              "BOND TYPE      UNSUPPORTED",
              "SHARED PAIRS   —",
              `VALENCE A / B   ${a?.valence ?? "?"} / ${b?.valence ?? "?"}`,
            ];
        rows.forEach((row, index) => {
          const t = svg("tspan", { x: "52", dy: index === 0 ? "0" : "23" });
          t.textContent = row;
          infoText.append(t);
        });
        raf = requestAnimationFrame(render);
      }
      updateMeasurements();
      raf = requestAnimationFrame(render);

      function reset() {
        running = false;
        formed = false;
        progress = 0;
        elapsed = 0;
        graphAccumulator = 0;
        host.replaceGraphData([]);
        host.setRunning(false);
        updateMeasurements();
      }
      function applyParams() {
        spec = getMolecule(atomA, atomB);
        reset();
      }
      return {
        start() {
          if (spec) {
            running = true;
            lastTime = performance.now();
            host.setRunning(true);
          }
        },
        pause() {
          running = false;
          host.setRunning(false);
        },
        reset,
        resize(nextWidth, nextHeight) {
          width = nextWidth;
          height = nextHeight;
          root.style.width = `${width}px`;
          root.style.height = `${height}px`;
        },
        setParam(id: string, value: ParamValue) {
          params = { ...params, [id]: value };
          if (id === "atomA" && typeof value === "string") atomA = value as AtomId;
          if (id === "atomB" && typeof value === "string") atomB = value as AtomId;
          if (id === "separation" && typeof value === "number") separation = value;
          if (id === "showElectrons" && typeof value === "boolean") showElectrons = value;
          applyParams();
        },
        setParams(nextParams: SimulationParams) {
          params = { ...nextParams };
          atomA = readString(params, "atomA", DEFAULTS.atomA) as AtomId;
          atomB = readString(params, "atomB", DEFAULTS.atomB) as AtomId;
          separation = readNumber(params, "separation", DEFAULTS.separation);
          showElectrons = readBoolean(params, "showElectrons", DEFAULTS.showElectrons);
          applyParams();
        },
        onAction(actionId: string) {
          if (actionId === "bond") reset();
        },
        destroy() {
          cancelAnimationFrame(raf);
          container.replaceChildren();
        },
      };
    },
  };
}

export const chemistryBonding = createBondingModule();
