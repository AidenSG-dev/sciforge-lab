import type {
  GraphSample,
  MountContext,
  ParamValue,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULTS = { temperature: 24, substance: "water" } as const;
const FIXED_STEP = 1 / 90;
const MAX_FRAME_STEP = 1 / 20;
const GRAPH_WINDOW = 240;
const PARTICLE_COUNT = 90;
const CHAMBER = { left: 270, right: 770, top: 92, bottom: 526 } as const;

type Trend = "HEATING" | "COOLING" | "STABLE";
type ActionMode = "melting" | "boiling" | null;

interface MaterialConfig {
  label: string;
  melting: number;
  boiling: number;
  tint: string;
  accent: string;
}

const MATERIALS: Record<string, MaterialConfig> = {
  water: { label: "Water / Ice", melting: 0, boiling: 100, tint: "#58c8ef", accent: "#82e8ff" },
  ethanol: {
    label: "Ethanol / Alcohol",
    melting: -114,
    boiling: 78,
    tint: "#b18cff",
    accent: "#d8c4ff",
  },
};

function numberParam(params: SimulationParams, id: string, fallback: number): number {
  const value = params[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function stringParam(params: SimulationParams, id: string, fallback: string): string {
  const value = params[id];
  return typeof value === "string" ? value : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function format(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}

function createStatesModule(): SimulationModule {
  return {
    id: "chemistry-states-of-matter",
    subject: "chemistry",
    title: "States of Matter",
    description: "Heat and cool molecules to see solids, liquids and gases emerge from motion.",
    concepts: ["Particle motion", "Phase change", "Intermolecular attraction"],
    grade: "6-8",
    status: "ready",
    controls: [
      {
        kind: "slider",
        id: "temperature",
        label: "Temperature",
        min: -180,
        max: 300,
        step: 1,
        unit: "°C",
        defaultValue: DEFAULTS.temperature,
        group: "Conditions",
      },
      {
        kind: "select",
        id: "substance",
        label: "Material",
        options: [
          { value: "water", label: "Water / Ice" },
          { value: "ethanol", label: "Ethanol / Alcohol" },
        ],
        defaultValue: DEFAULTS.substance,
        group: "Sample",
      },
      {
        kind: "button",
        id: "melting",
        label: "Melting",
        actionId: "melting",
        variant: "subject",
        group: "Phase animations",
      },
      {
        kind: "button",
        id: "boiling",
        label: "Boiling",
        actionId: "boiling",
        variant: "subject",
        group: "Phase animations",
      },
    ],
    graph: {
      title: "Temperature vs time",
      xLabel: "Time (s)",
      yLabel: "Temperature (°C)",
      series: [{ id: "temperature", label: "Temperature", colorToken: 3 }],
      window: GRAPH_WINDOW,
    },
    explanation: {
      whatsHappening:
        "The same molecules reorganize as their energy changes: crystals vibrate, liquid molecules flow, and vapour molecules diffuse.",
      keyConcept:
        "A phase change is a continuous change in spacing, organization and molecular motion.",
      deeperDive:
        "During melting and freezing, the molecules themselves move between an ordered crystal arrangement and a flowing liquid arrangement.",
    },
    aspectRatio: 4 / 3,
    mount(context: MountContext): SimulationInstance {
      const { container, host } = context;
      let params = { ...context.params };
      let temperature = numberParam(params, "temperature", DEFAULTS.temperature);
      let previousTemperature = temperature;
      let substanceId = stringParam(params, "substance", DEFAULTS.substance);
      let material: MaterialConfig = MATERIALS[substanceId] ?? MATERIALS["water"]!;
      let running = false;
      let elapsed = 0;
      let accumulator = 0;
      let uiAccumulator = 0;
      let lastTimestamp = performance.now();
      let animationFrame = 0;
      let trend: Trend = "STABLE";
      let actionMode: ActionMode = null;
      let visualPhase = phaseFromTemperature();

      const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
        seed: index + 1,
        z: ((index * 37) % 100) / 100,
        gasX: 304 + ((index * 61) % 432),
        gasY: 122 + ((index * 47) % 370),
        gasVX: 18 + ((index * 13) % 30),
        gasVY: -32 - ((index * 19) % 24),
        escaped: false,
      }));

      const root = document.createElement("div");
      root.className = "absolute inset-0 overflow-hidden";
      container.replaceChildren(root);
      const scene = svg("svg", {
        viewBox: "0 0 800 600",
        class: "h-full w-full",
        role: "img",
        "aria-label": "Interactive states of matter molecular simulation",
        preserveAspectRatio: "xMidYMid meet",
      });
      const defs = svg("defs", {});
      const bg = svg("linearGradient", { id: "states-bg", x1: "0", y1: "0", x2: "0", y2: "1" });
      bg.append(
        svg("stop", { offset: "0%", "stop-color": "#10152d" }),
        svg("stop", { offset: "100%", "stop-color": "#070b16" }),
      );
      const chamberGradient = svg("linearGradient", {
        id: "states-chamber",
        x1: "0",
        y1: "0",
        x2: "1",
        y2: "1",
      });
      chamberGradient.append(
        svg("stop", { offset: "0%", "stop-color": "#173c58", "stop-opacity": "0.42" }),
        svg("stop", { offset: "100%", "stop-color": "#080d1c", "stop-opacity": "0.82" }),
      );
      const particleGradient = svg("radialGradient", {
        id: "states-particle",
        cx: "30%",
        cy: "24%",
        r: "72%",
      });
      particleGradient.append(
        svg("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.98" }),
        svg("stop", { offset: "32%", "stop-color": "#a4efff", "stop-opacity": "0.95" }),
        svg("stop", { offset: "100%", "stop-color": "#2675ba", "stop-opacity": "0.72" }),
      );
      const pattern = svg("pattern", {
        id: "states-grid",
        width: "32",
        height: "32",
        patternUnits: "userSpaceOnUse",
      });
      pattern.append(
        svg("path", {
          d: "M 32 0 L 0 0 0 32",
          fill: "none",
          stroke: "#89b5ef",
          "stroke-opacity": "0.08",
          "stroke-width": "1",
        }),
      );
      const glow = svg("filter", {
        id: "states-glow",
        x: "-100%",
        y: "-100%",
        width: "300%",
        height: "300%",
      });
      glow.append(svg("feGaussianBlur", { stdDeviation: "5" }));
      defs.append(bg, chamberGradient, particleGradient, pattern, glow);
      scene.append(defs);

      const background = svg("rect", { width: "800", height: "600", fill: "url(#states-bg)" });
      const grid = svg("rect", { width: "800", height: "600", fill: "url(#states-grid)" });
      const frameGlow = svg("rect", {
        x: "246",
        y: "68",
        width: "548",
        height: "490",
        rx: "24",
        fill: "#ff6c4c",
        "fill-opacity": "0.08",
        filter: "url(#states-glow)",
      });
      const chamber = svg("rect", {
        x: "260",
        y: "82",
        width: "520",
        height: "456",
        rx: "18",
        fill: "url(#states-chamber)",
        stroke: "#9ccfee",
        "stroke-opacity": "0.55",
        "stroke-width": "2",
      });
      const chamberTop = svg("path", {
        d: "M 278 82 L 762 82 L 780 104 L 260 104 Z",
        fill: "#c6e9ff",
        "fill-opacity": "0.06",
        stroke: "#b6e4ff",
        "stroke-opacity": "0.24",
      });
      const chamberBase = svg("path", {
        d: "M 260 538 L 780 538 L 762 554 L 278 554 Z",
        fill: "#08111d",
        stroke: "#a9d5eb",
        "stroke-opacity": "0.28",
      });
      const innerFrame = svg("rect", {
        x: "284",
        y: "112",
        width: "472",
        height: "394",
        rx: "10",
        fill: "none",
        stroke: "#91c9e4",
        "stroke-opacity": "0.16",
        "stroke-dasharray": "4 9",
      });
      const liquidShade = svg("path", { fill: material.tint, "fill-opacity": "0" });
      const liquidSurface = svg("path", {
        fill: "none",
        stroke: material.accent,
        "stroke-width": "2.2",
        "stroke-opacity": "0",
      });
      const iceFrame = svg("path", {
        d: "M 386 426 Q 520 407 654 426 L 654 498 Q 520 512 386 498 Z",
        fill: "none",
        stroke: "#a9f1ff",
        "stroke-opacity": "0",
        "stroke-width": "2",
      });
      const iceCracks = svg("g", {
        fill: "none",
        stroke: "#c1f6ff",
        "stroke-opacity": "0",
        "stroke-width": "1.4",
      });
      iceCracks.append(
        svg("path", { d: "M 430 432 l 28 17 l -12 22 l 32 20" }),
        svg("path", { d: "M 564 421 l -18 28 l 22 20 l -10 22" }),
        svg("path", { d: "M 622 435 l -20 20 l 10 24" }),
      );
      const attractionLayer = svg("g", {});
      const trailLayer = svg("g", {});
      const particleLayer = svg("g", {});
      const particleGlows = particles.map(() =>
        svg("circle", {
          r: "12",
          fill: "#65dcff",
          "fill-opacity": "0.14",
          filter: "url(#states-glow)",
        }),
      );
      const particleNodes = particles.map(() =>
        svg("circle", { r: "6", fill: "url(#states-particle)" }),
      );
      const particleTrails = particles.map(() =>
        svg("line", { stroke: "#f4bd6c", "stroke-width": "1.2", "stroke-opacity": "0" }),
      );
      particleTrails.forEach((node) => trailLayer.append(node));
      particleGlows.forEach((node) => particleLayer.append(node));
      particleNodes.forEach((node) => particleLayer.append(node));
      const gasHint = svg("text", {
        x: "304",
        y: "144",
        fill: "#f4c573",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.5",
      });
      const liquidLabel = svg("text", {
        x: "304",
        y: "344",
        fill: "#b8f4ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.5",
      });
      const info = svg("g", {
        fill: "#dbf7ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
      });
      const infoTitle = svg("text", {
        x: "32",
        y: "48",
        fill: "#7ce7ff",
        "font-size": "13",
        "letter-spacing": "2.8",
      });
      infoTitle.textContent = "MOLECULAR CHAMBER / LIVE MODEL";
      const infoMaterial = svg("text", { x: "32", y: "76", "font-size": "12" });
      const infoTemp = svg("text", { x: "32", y: "99", "font-size": "12" });
      const infoMelting = svg("text", { x: "32", y: "122", "font-size": "12" });
      const infoBoiling = svg("text", { x: "32", y: "145", "font-size": "12" });
      const infoEnergy = svg("text", { x: "32", y: "168", "font-size": "12", fill: "#f5c16c" });
      const infoMotion = svg("text", { x: "32", y: "191", "font-size": "11", fill: "#9fc9df" });
      info.append(
        infoTitle,
        infoMaterial,
        infoTemp,
        infoMelting,
        infoBoiling,
        infoEnergy,
        infoMotion,
      );
      const legend = svg("text", {
        x: "304",
        y: "118",
        fill: "#9ccfe5",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.4",
      });
      const phaseBadge = svg("rect", {
        x: "620",
        y: "104",
        width: "138",
        height: "28",
        rx: "14",
        fill: "#07111d",
        stroke: "#86eaff",
        "stroke-opacity": "0.35",
      });
      const phaseBadgeText = svg("text", {
        x: "689",
        y: "122",
        fill: "#8eeeff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "text-anchor": "middle",
        "letter-spacing": "1.4",
      });
      const statusPanel = svg("rect", {
        x: "32",
        y: "398",
        width: "204",
        height: "138",
        rx: "14",
        fill: "#080f1a",
        "fill-opacity": "0.86",
        stroke: "#8bbbe4",
        "stroke-opacity": "0.3",
      });
      const statusLabel = svg("text", {
        x: "52",
        y: "428",
        fill: "#78e6ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
        "letter-spacing": "2",
      });
      const statusValue = svg("text", {
        x: "52",
        y: "459",
        fill: "#eefaff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "24",
        "font-weight": "700",
      });
      const statusDetail = svg("text", {
        x: "52",
        y: "486",
        fill: "#a8cadc",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
      });
      const statusDirection = svg("text", {
        x: "52",
        y: "514",
        fill: "#89bbd5",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.2",
      });
      scene.append(
        background,
        grid,
        frameGlow,
        chamber,
        chamberTop,
        chamberBase,
        innerFrame,
        liquidShade,
        liquidSurface,
        iceFrame,
        iceCracks,
        gasHint,
        liquidLabel,
        trailLayer,
        attractionLayer,
        particleLayer,
        info,
        legend,
        phaseBadge,
        phaseBadgeText,
        statusPanel,
        statusLabel,
        statusValue,
        statusDetail,
        statusDirection,
      );
      root.append(scene);

      function phaseFromTemperature(): number {
        if (temperature <= material.melting - 8) return 0;
        if (temperature < material.melting + 8)
          return clamp((temperature - (material.melting - 8)) / 16, 0, 1);
        if (temperature < material.boiling - 10) return 1;
        if (temperature < material.boiling + 10)
          return 1 + clamp((temperature - (material.boiling - 10)) / 20, 0, 1);
        return 2;
      }

      function targetPhase(): number {
        if (actionMode === "melting") return 1;
        if (actionMode === "boiling") return 2;
        return phaseFromTemperature();
      }

      function solidPosition(index: number): { x: number; y: number } {
        return { x: 405 + (index % 10) * 23, y: 428 + Math.floor(index / 10) * 9.5 };
      }

      function liquidPosition(
        index: number,
        liquidTop: number,
        time: number,
      ): { x: number; y: number } {
        const depth = Math.max(28, CHAMBER.bottom - liquidTop - 20);
        return {
          x: 318 + ((index * 43) % 410) + Math.sin(time * 1.4 + index) * 6,
          y: liquidTop + 16 + ((index * 29) % depth) + Math.cos(time * 1.1 + index * 0.7) * 5,
        };
      }

      function resetEscapes() {
        particles.forEach((particle) => {
          particle.escaped = false;
          particle.gasX = 304 + ((particle.seed * 61) % 432);
          particle.gasY = 122 + ((particle.seed * 47) % 370);
          particle.gasVX = 18 + ((particle.seed * 13) % 30);
          particle.gasVY = -32 - ((particle.seed * 19) % 24);
        });
      }

      function phaseStatus(): { label: string; detail: string; value: number; color: string } {
        const target = targetPhase();
        const delta = target - visualPhase;
        if (actionMode === "melting" || (delta > 0.08 && target < 1.5))
          return { label: "MELTING", detail: "Ice → Water", value: visualPhase, color: "#f2bd67" };
        if (actionMode === "boiling" || (delta > 0.08 && target > 1.5))
          return {
            label: "BOILING",
            detail: "Water → Vapour",
            value: visualPhase,
            color: "#ff9a62",
          };
        if (delta < -0.08 && target > 1.5)
          return {
            label: "CONDENSATION",
            detail: "Vapour → Water",
            value: visualPhase,
            color: "#8fdcff",
          };
        if (delta < -0.08 && target < 0.5)
          return { label: "FREEZING", detail: "Water → Ice", value: visualPhase, color: "#8fdcff" };
        if (visualPhase < 0.5)
          return {
            label: "SOLID",
            detail: "Ice crystal lattice",
            value: visualPhase,
            color: "#8fdcff",
          };
        if (visualPhase < 1.5)
          return {
            label: "LIQUID",
            detail: "Contained water volume",
            value: visualPhase,
            color: "#73e4ff",
          };
        return {
          label: "GAS",
          detail: "Water vapour diffusion",
          value: visualPhase,
          color: "#f5c16c",
        };
      }

      function energyLabel(): string {
        const normalized = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1.8,
        );
        if (normalized < 0.3) return "LOW";
        if (normalized < 0.85) return "MEDIUM";
        if (normalized < 1.35) return "HIGH";
        return "VERY HIGH";
      }

      function particleColor(): string {
        const normalized = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1,
        );
        if (normalized > 0.78) return "#ff9a67";
        if (normalized > 0.45) return "#f4c86e";
        return material.accent;
      }

      function wavePath(time: number, top: number): string {
        const points: string[] = [];
        for (let x = CHAMBER.left + 8; x <= CHAMBER.right - 8; x += 12) {
          const y =
            top + Math.sin(x * 0.035 + time * 1.5) * 4 + Math.sin(x * 0.011 + time * 0.55) * 2;
          points.push(`${x === CHAMBER.left + 8 ? "M" : "L"} ${x} ${y}`);
        }
        return points.join(" ");
      }

      function updateAttractions(phase: number, opacity: number) {
        attractionLayer.replaceChildren();
        const show = clamp((1 - phase) * opacity, 0, 0.55);
        for (let row = 0; row < 9; row += 1) {
          for (let column = 0; column < 9; column += 1) {
            const index = row * 10 + column;
            const start = solidPosition(index);
            const end = solidPosition(index + 1);
            attractionLayer.append(
              svg("line", {
                x1: String(start.x),
                y1: String(start.y),
                x2: String(end.x),
                y2: String(end.y),
                stroke: particleColor(),
                "stroke-opacity": String(show),
                "stroke-width": "1",
                "stroke-dasharray": phase > 0.4 ? "2 5" : "none",
              }),
            );
          }
        }
      }

      function updateParticles(time: number, step: number, phase: number, liquidAmount: number) {
        const liquidProgress = clamp(phase, 0, 1);
        const gasProgress = clamp(phase - 1, 0, 1);
        const energy = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1.6,
        );
        const speed = 0.5 + energy * 2.2;
        const liquidTop = CHAMBER.bottom - 176 * liquidAmount;
        const escapedLimit = gasProgress * (PARTICLE_COUNT + 8);
        particles.forEach((particle, index) => {
          const solid = solidPosition(index);
          const fluid = liquidPosition(index, liquidTop, time);
          const vibration = 1.4 + energy * 8.5;
          const solidX =
            solid.x + Math.sin(time * (2.4 + particle.seed * 0.025) + particle.seed) * vibration;
          const solidY =
            solid.y +
            Math.cos(time * (2.1 + particle.seed * 0.02) + particle.seed * 0.7) * vibration;
          const liquidX = fluid.x + Math.sin(time * speed + particle.seed) * (3 + energy * 10);
          const liquidY =
            fluid.y + Math.cos(time * speed * 0.8 + particle.seed * 0.6) * (3 + energy * 7);
          const escaping = index < escapedLimit;
          if (escaping && !particle.escaped) {
            particle.escaped = true;
            particle.gasX = liquidX;
            particle.gasY = liquidTop - 3;
            particle.gasVY = -28 - (particle.seed % 24);
          }
          if (particle.escaped) {
            particle.gasX += particle.gasVX * step * speed;
            particle.gasY += particle.gasVY * step * speed;
            particle.gasVY += 5 * step;
            if (particle.gasX < CHAMBER.left + 25 || particle.gasX > CHAMBER.right - 25)
              particle.gasVX *= -1;
            if (particle.gasY < CHAMBER.top + 35 || particle.gasY > CHAMBER.bottom - 25)
              particle.gasVY *= -1;
          }
          const gasX = particle.gasX;
          const gasY = particle.gasY;
          const gasWeight = gasProgress * (particle.escaped ? 1 : 0);
          const liquidWeight = liquidProgress * (1 - gasWeight);
          const solidWeight = 1 - liquidWeight - gasWeight;
          const total = Math.max(1, solidWeight + liquidWeight + gasWeight);
          const x = (solidX * solidWeight + liquidX * liquidWeight + gasX * gasWeight) / total;
          const y = (solidY * solidWeight + liquidY * liquidWeight + gasY * gasWeight) / total;
          const radius = (4.5 + energy * 1.2) * (0.8 + particle.z * 0.3);
          const glow = particleGlows[index];
          const node = particleNodes[index];
          const trail = particleTrails[index];
          glow?.setAttribute("cx", String(x));
          glow?.setAttribute("cy", String(y));
          glow?.setAttribute("r", String(radius * 2.2));
          glow?.setAttribute("fill", particleColor());
          glow?.setAttribute("fill-opacity", String(0.09 + energy * 0.1));
          node?.setAttribute("cx", String(x));
          node?.setAttribute("cy", String(y));
          node?.setAttribute("r", String(radius));
          node?.setAttribute("fill-opacity", String(0.55 + particle.z * 0.4));
          if (particle.escaped && gasProgress > 0) {
            trail?.setAttribute("x1", String(x));
            trail?.setAttribute("y1", String(y));
            trail?.setAttribute("x2", String(x - particle.gasVX * 0.18));
            trail?.setAttribute("y2", String(y - particle.gasVY * 0.18));
            trail?.setAttribute("stroke-opacity", String(0.12 + gasProgress * 0.22));
          } else {
            trail?.setAttribute("stroke-opacity", "0");
          }
        });
      }

      function publishMeasurements() {
        const status = phaseStatus();
        host.publishMeasurements([
          { id: "material", label: "Material", value: material.label },
          {
            id: "temperature",
            label: "Temperature",
            value: temperature,
            unit: "°C",
            precision: 0,
            emphasis: true,
          },
          {
            id: "melting-point",
            label: "Melting point",
            value: material.melting,
            unit: "°C",
            precision: 0,
          },
          {
            id: "boiling-point",
            label: "Boiling point",
            value: material.boiling,
            unit: "°C",
            precision: 0,
          },
          { id: "phase", label: "Current phase", value: status.label },
          { id: "molecular-energy", label: "Molecular energy", value: energyLabel() },
          { id: "thermal-trend", label: "Heating / cooling", value: trend },
        ]);
        const detail =
          status.label === "SOLID"
            ? "Packed ice molecules vibrate around fixed crystal positions. As heating increases, the lattice deforms into flowing water."
            : status.label === "LIQUID"
              ? "Water molecules are contained below the surface and slide past one another. Heating sends the most energetic molecules toward escape."
              : status.label === "GAS"
                ? "Water vapour molecules are widely separated, moving rapidly and colliding with the chamber walls."
                : status.label === "BOILING"
                  ? "Energetic molecules escape through the surface one by one. The water level falls as the vapour population grows."
                  : status.label === "MELTING"
                    ? "The ice lattice is deforming. Stronger vibration lets molecules leave fixed positions and form a liquid flow."
                    : status.label === "CONDENSATION"
                      ? "Vapour molecules slow down and descend, clustering into the growing water region."
                      : "Cooling reduces molecular motion and allows the liquid particles to organize into an ice crystal.";
        host.publishExplanation({ whatsHappening: detail });
      }

      function updateReadout(time: number) {
        const status = phaseStatus();
        const energy = energyLabel();
        const normalized = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1.4,
        );
        const liquidProgress = clamp(visualPhase, 0, 1);
        const gasProgress = clamp(visualPhase - 1, 0, 1);
        const liquidAmount = liquidProgress * (1 - gasProgress);
        const liquidTop = CHAMBER.bottom - 176 * liquidAmount;
        const hot = clamp(normalized, 0, 1);
        const cold = clamp(
          (material.melting - temperature) / Math.max(1, Math.abs(material.melting) + 40),
          0,
          1,
        );
        infoMaterial.textContent = `MATERIAL        ${material.label}`;
        infoTemp.textContent = `TEMPERATURE     ${format(temperature, 0)}°C`;
        infoMelting.textContent = `MELTING POINT   ${format(material.melting, 0)}°C`;
        infoBoiling.textContent = `BOILING POINT   ${format(material.boiling, 0)}°C`;
        infoEnergy.textContent = `MOLECULAR ENERGY ${energy}`;
        infoMotion.textContent = `THERMAL TREND   ${trend}`;
        legend.textContent =
          visualPhase < 0.5
            ? "ICE / PACKED CRYSTAL"
            : visualPhase < 1.5
              ? "WATER / FLOWING VOLUME"
              : "VAPOUR / DIFFUSION";
        phaseBadgeText.textContent = status.label;
        phaseBadge.setAttribute("stroke", status.color);
        phaseBadgeText.setAttribute("fill", status.color);
        statusLabel.textContent = "CURRENT PHASE";
        statusValue.textContent = status.label;
        statusDetail.textContent = status.detail;
        statusDirection.textContent = `${format(temperature, 0)}°C  ·  ${energy} ENERGY`;
        statusValue.setAttribute("fill", status.color);
        frameGlow.setAttribute("fill", hot > cold ? "#ff684c" : "#50c7ff");
        frameGlow.setAttribute("fill-opacity", String(0.035 + Math.max(hot, cold) * 0.14));
        liquidShade.setAttribute(
          "d",
          `${wavePath(time, liquidTop)} L ${CHAMBER.right - 8} ${CHAMBER.bottom} L ${CHAMBER.left + 8} ${CHAMBER.bottom} Z`,
        );
        liquidShade.setAttribute("fill", material.tint);
        liquidShade.setAttribute("fill-opacity", String(liquidAmount * 0.18));
        liquidSurface.setAttribute("d", wavePath(time, liquidTop));
        liquidSurface.setAttribute("stroke", material.accent);
        liquidSurface.setAttribute("stroke-opacity", String(liquidAmount * 0.8));
        iceFrame.setAttribute("stroke-opacity", String(clamp(1 - liquidProgress, 0, 1) * 0.48));
        iceCracks.setAttribute("stroke-opacity", String(clamp(1 - liquidProgress, 0, 1) * 0.4));
        liquidLabel.textContent = liquidAmount > 0.18 ? "WATER / LIQUID LEVEL" : "";
        liquidLabel.setAttribute("opacity", String(liquidAmount));
        gasHint.textContent = gasProgress > 0.16 ? "VAPOUR / ESCAPED MOLECULES" : "";
        gasHint.setAttribute("opacity", String(gasProgress));
        updateAttractions(visualPhase, 0.8);
      }

      function publishGraph() {
        const sample: GraphSample = { x: elapsed, temperature };
        host.publishGraphSample(sample);
      }

      function frame(timestamp: number) {
        const frameSeconds = Math.min(
          MAX_FRAME_STEP,
          Math.max(0, (timestamp - lastTimestamp) / 1000),
        );
        lastTimestamp = timestamp;
        if (running) {
          const goal = targetPhase();
          visualPhase += (goal - visualPhase) * Math.min(1, frameSeconds * 2.2);
          accumulator += frameSeconds;
          while (accumulator >= FIXED_STEP) {
            elapsed += FIXED_STEP;
            accumulator -= FIXED_STEP;
          }
          uiAccumulator += frameSeconds;
          if (uiAccumulator >= 1 / 15) {
            publishGraph();
            publishMeasurements();
            uiAccumulator = 0;
          }
          if (actionMode === "melting" && visualPhase > 0.995) {
            visualPhase = 1;
            actionMode = null;
            running = false;
            host.setRunning(false);
          }
          if (actionMode === "boiling" && visualPhase > 1.995) {
            visualPhase = 2;
            actionMode = null;
            running = false;
            host.setRunning(false);
          }
        }
        updateParticles(
          elapsed,
          running ? frameSeconds : 0,
          visualPhase,
          clamp(visualPhase, 0, 1) * (1 - clamp(visualPhase - 1, 0, 1)),
        );
        updateReadout(elapsed);
        animationFrame = requestAnimationFrame(frame);
      }

      function resetState() {
        elapsed = 0;
        accumulator = 0;
        uiAccumulator = 0;
        actionMode = null;
        running = false;
        visualPhase = phaseFromTemperature();
        resetEscapes();
        host.replaceGraphData([]);
        host.setRunning(false);
        publishMeasurements();
        updateReadout(0);
      }

      function applyParams() {
        material = MATERIALS[substanceId] ?? MATERIALS["water"]!;
        const delta = temperature - previousTemperature;
        trend = delta > 0.2 ? "HEATING" : delta < -0.2 ? "COOLING" : "STABLE";
        previousTemperature = temperature;
        actionMode = null;
        resetEscapes();
        publishMeasurements();
        updateReadout(elapsed);
      }

      applyParams();
      resetEscapes();
      updateParticles(0, 0, visualPhase, clamp(visualPhase, 0, 1));
      updateReadout(0);
      animationFrame = requestAnimationFrame(frame);

      return {
        start() {
          running = true;
          lastTimestamp = performance.now();
          host.setRunning(true);
        },
        pause() {
          running = false;
          host.setRunning(false);
        },
        reset() {
          resetState();
        },
        resize(nextWidth, nextHeight) {
          root.style.width = `${nextWidth}px`;
          root.style.height = `${nextHeight}px`;
        },
        setParam(id: string, value: ParamValue) {
          params = { ...params, [id]: value };
          if (id === "temperature" && typeof value === "number") temperature = value;
          if (id === "substance" && typeof value === "string") substanceId = value;
          applyParams();
        },
        setParams(nextParams: SimulationParams) {
          params = { ...nextParams };
          temperature = numberParam(params, "temperature", DEFAULTS.temperature);
          previousTemperature = temperature;
          substanceId = stringParam(params, "substance", DEFAULTS.substance);
          material = MATERIALS[substanceId] ?? MATERIALS["water"]!;
          resetState();
        },
        onAction(actionId: string) {
          if (actionId !== "melting" && actionId !== "boiling") return;
          actionMode = actionId;
          visualPhase = actionId === "melting" ? 0 : 1;
          resetEscapes();
          running = true;
          lastTimestamp = performance.now();
          host.setRunning(true);
        },
        destroy() {
          cancelAnimationFrame(animationFrame);
          container.replaceChildren();
        },
      };
    },
  };
}

export const chemistryStates = createStatesModule();
