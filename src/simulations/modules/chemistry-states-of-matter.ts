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
const CHAMBER = { left: 270, right: 770, top: 92, bottom: 526 } as const;
const PARTICLE_COUNT = 72;

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

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function format(value: number, digits = 1): string {
  return value.toFixed(digits);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
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
        "Particles remain in continuous motion. Temperature changes their kinetic energy, while attractive forces influence how closely they stay together.",
      keyConcept:
        "A phase is an emergent pattern of particle spacing, organization and motion—not a separate animation.",
      deeperDive:
        "During a phase transition, added or removed energy changes particle freedom while the material moves smoothly between arrangements.",
    },
    aspectRatio: 4 / 3,
    mount(context: MountContext): SimulationInstance {
      const { container, host } = context;
      let params = { ...context.params };
      let temperature = numberParam(params, "temperature", DEFAULTS.temperature);
      let previousTemperature = temperature;
      let substanceId = stringParam(params, "substance", DEFAULTS.substance);
      let material = MATERIALS[substanceId] ?? MATERIALS["water"]!;
      let running = false;
      let elapsed = 0;
      let accumulator = 0;
      let uiAccumulator = 0;
      let lastTimestamp = performance.now();
      let animationFrame = 0;
      let width = 800;
      let height = 600;
      let trend: "HEATING" | "COOLING" | "STABLE" = "STABLE";

      const particles = Array.from({ length: PARTICLE_COUNT }, (_, index) => {
        const column = index % 12;
        const row = Math.floor(index / 12);
        return {
          seed: index + 1,
          latticeX: 325 + column * 32,
          latticeY: 178 + row * 38,
          z: ((index * 17) % 100) / 100,
          x: 330 + ((index * 71) % 380),
          y: 150 + ((index * 43) % 310),
          gasX: 305 + ((index * 61) % 430),
          gasY: 125 + ((index * 47) % 360),
          gasVX: 22 + ((index * 13) % 27),
          gasVY: 18 + ((index * 19) % 24),
        };
      });

      const root = document.createElement("div");
      root.className = "absolute inset-0 overflow-hidden";
      container.replaceChildren(root);

      const svg = createSvgElement("svg", {
        viewBox: "0 0 800 600",
        role: "img",
        "aria-label": "Interactive states of matter molecular simulation",
        class: "h-full w-full",
        preserveAspectRatio: "xMidYMid meet",
      });
      const defs = createSvgElement("defs", {});
      const backgroundGradient = createSvgElement("linearGradient", {
        id: "states-bg",
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1",
      });
      backgroundGradient.append(
        createSvgElement("stop", { offset: "0%", "stop-color": "#10152d" }),
        createSvgElement("stop", { offset: "100%", "stop-color": "#070b16" }),
      );
      const chamberGradient = createSvgElement("linearGradient", {
        id: "states-chamber",
        x1: "0",
        y1: "0",
        x2: "1",
        y2: "1",
      });
      chamberGradient.append(
        createSvgElement("stop", { offset: "0%", "stop-color": "#14324b", "stop-opacity": "0.48" }),
        createSvgElement("stop", {
          offset: "100%",
          "stop-color": "#080d1c",
          "stop-opacity": "0.74",
        }),
      );
      const particleGradient = createSvgElement("radialGradient", {
        id: "states-particle",
        cx: "32%",
        cy: "25%",
        r: "70%",
      });
      particleGradient.append(
        createSvgElement("stop", { offset: "0%", "stop-color": "#ffffff", "stop-opacity": "0.95" }),
        createSvgElement("stop", { offset: "30%", "stop-color": "#8eefff", "stop-opacity": "0.9" }),
        createSvgElement("stop", {
          offset: "100%",
          "stop-color": "#2c77bb",
          "stop-opacity": "0.7",
        }),
      );
      const gridPattern = createSvgElement("pattern", {
        id: "states-grid",
        width: "32",
        height: "32",
        patternUnits: "userSpaceOnUse",
      });
      gridPattern.append(
        createSvgElement("path", {
          d: "M 32 0 L 0 0 0 32",
          fill: "none",
          stroke: "#89b5ef",
          "stroke-opacity": "0.08",
          "stroke-width": "1",
        }),
      );
      const glow = createSvgElement("filter", {
        id: "states-glow",
        x: "-80%",
        y: "-80%",
        width: "260%",
        height: "260%",
      });
      glow.append(createSvgElement("feGaussianBlur", { stdDeviation: "5", result: "blur" }));
      defs.append(backgroundGradient, chamberGradient, particleGradient, gridPattern, glow);
      svg.append(defs);

      const background = createSvgElement("rect", {
        width: "800",
        height: "600",
        fill: "url(#states-bg)",
      });
      const grid = createSvgElement("rect", {
        width: "800",
        height: "600",
        fill: "url(#states-grid)",
      });
      const chamberGlow = createSvgElement("rect", {
        x: "248",
        y: "70",
        width: "544",
        height: "480",
        rx: "22",
        fill: "#5f8cff",
        "fill-opacity": "0.07",
        filter: "url(#states-glow)",
      });
      const chamber = createSvgElement("rect", {
        x: "260",
        y: "82",
        width: "520",
        height: "456",
        rx: "18",
        fill: "url(#states-chamber)",
        stroke: "#98c4e6",
        "stroke-opacity": "0.5",
        "stroke-width": "2",
      });
      const chamberTop = createSvgElement("path", {
        d: "M 278 82 L 762 82 L 780 104 L 260 104 Z",
        fill: "#c6e9ff",
        "fill-opacity": "0.06",
        stroke: "#b6e4ff",
        "stroke-opacity": "0.24",
      });
      const chamberBase = createSvgElement("path", {
        d: "M 260 538 L 780 538 L 762 554 L 278 554 Z",
        fill: "#08111d",
        stroke: "#a9d5eb",
        "stroke-opacity": "0.28",
      });
      const volumeGuide = createSvgElement("rect", {
        x: "285",
        y: "112",
        width: "470",
        height: "395",
        rx: "10",
        fill: "none",
        stroke: "#91c9e4",
        "stroke-opacity": "0.14",
        "stroke-dasharray": "4 9",
      });
      const liquidSurface = createSvgElement("path", {
        fill: "none",
        stroke: "#84e8ff",
        "stroke-width": "2",
        "stroke-opacity": "0.72",
      });
      const liquidShade = createSvgElement("path", { fill: "#48bee4", "fill-opacity": "0.14" });
      const liquidLabel = createSvgElement("text", {
        x: "304",
        y: "344",
        fill: "#b8f4ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.5",
      });
      const gasHint = createSvgElement("text", {
        x: "304",
        y: "144",
        fill: "#f3c677",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.5",
      });
      const gasArrows = createSvgElement("g", {
        stroke: "#f1c26e",
        "stroke-opacity": "0.52",
        fill: "none",
      });
      gasArrows.append(
        createSvgElement("path", { d: "M 712 196 l 0 -18 m 0 -0 l -4 7 m 4 -7 l 4 7" }),
        createSvgElement("path", { d: "M 736 238 l 0 -18 m 0 -0 l -4 7 m 4 -7 l 4 7" }),
      );
      const iceBlock = createSvgElement("path", {
        d: "M 390 415 Q 520 398 650 415 L 650 498 Q 520 510 390 498 Z",
        fill: "#94eaff",
        "fill-opacity": "0.13",
        stroke: "#a8f1ff",
        "stroke-opacity": "0.36",
        "stroke-width": "2",
      });
      const iceCracks = createSvgElement("g", {
        stroke: "#b9f5ff",
        "stroke-opacity": "0.35",
        fill: "none",
        "stroke-width": "1.5",
      });
      iceCracks.append(
        createSvgElement("path", { d: "M 430 432 l 24 18 l -9 21 l 28 18" }),
        createSvgElement("path", { d: "M 570 424 l -18 26 l 18 18 l -8 22" }),
        createSvgElement("path", { d: "M 622 438 l -20 17 l 8 22" }),
      );
      const attractionLayer = createSvgElement("g", {});
      const thermalLeft = createSvgElement("rect", {
        x: "260",
        y: "116",
        width: "18",
        height: "390",
        rx: "9",
        fill: "#ff684c",
        "fill-opacity": "0",
      });
      const thermalRight = createSvgElement("rect", {
        x: "762",
        y: "116",
        width: "18",
        height: "390",
        rx: "9",
        fill: "#ff684c",
        "fill-opacity": "0",
      });
      const particleLayer = createSvgElement("g", {});
      const particleGlows = particles.map(() =>
        createSvgElement("circle", {
          r: "12",
          fill: "#5edbff",
          "fill-opacity": "0.16",
          filter: "url(#states-glow)",
        }),
      );
      const particleNodes = particles.map(() =>
        createSvgElement("circle", { r: "6", fill: "url(#states-particle)" }),
      );
      particleGlows.forEach((node) => particleLayer.append(node));
      particleNodes.forEach((node) => particleLayer.append(node));
      const statusPanel = createSvgElement("rect", {
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
      const statusLabel = createSvgElement("text", {
        x: "52",
        y: "428",
        fill: "#78e6ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
        "letter-spacing": "2",
      });
      const statusValue = createSvgElement("text", {
        x: "52",
        y: "459",
        fill: "#eefaff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "24",
        "font-weight": "700",
      });
      const statusDetail = createSvgElement("text", {
        x: "52",
        y: "486",
        fill: "#a8cadc",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
      });
      const statusDirection = createSvgElement("text", {
        x: "52",
        y: "514",
        fill: "#89bbd5",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.2",
      });
      const info = createSvgElement("g", {
        fill: "#dbf7ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
      });
      const infoTitle = createSvgElement("text", {
        x: "32",
        y: "48",
        fill: "#7ce7ff",
        "font-size": "13",
        "letter-spacing": "2.8",
      });
      infoTitle.textContent = "MOLECULAR CHAMBER / LIVE MODEL";
      const infoMaterial = createSvgElement("text", { x: "32", y: "76", "font-size": "12" });
      const infoTemp = createSvgElement("text", { x: "32", y: "99", "font-size": "12" });
      const infoMelting = createSvgElement("text", { x: "32", y: "122", "font-size": "12" });
      const infoBoiling = createSvgElement("text", { x: "32", y: "145", "font-size": "12" });
      const infoEnergy = createSvgElement("text", {
        x: "32",
        y: "168",
        "font-size": "12",
        fill: "#f5c16c",
      });
      const infoMotion = createSvgElement("text", {
        x: "32",
        y: "191",
        "font-size": "11",
        fill: "#9fc9df",
      });
      info.append(
        infoTitle,
        infoMaterial,
        infoTemp,
        infoMelting,
        infoBoiling,
        infoEnergy,
        infoMotion,
      );
      const legend = createSvgElement("text", {
        x: "290",
        y: "118",
        fill: "#9ccfe5",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "letter-spacing": "1.4",
      });
      const phaseBadge = createSvgElement("rect", {
        x: "620",
        y: "104",
        width: "138",
        height: "28",
        rx: "14",
        fill: "#07111d",
        stroke: "#86eaff",
        "stroke-opacity": "0.35",
      });
      const phaseBadgeText = createSvgElement("text", {
        x: "689",
        y: "122",
        fill: "#8eeeff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "text-anchor": "middle",
        "letter-spacing": "1.4",
      });
      const temperatureGlow = createSvgElement("rect", {
        x: "272",
        y: "94",
        width: "496",
        height: "420",
        rx: "14",
        fill: "#ff774c",
        "fill-opacity": "0",
        pointerEvents: "none",
      });

      svg.append(
        background,
        grid,
        chamberGlow,
        chamber,
        chamberTop,
        chamberBase,
        volumeGuide,
        thermalLeft,
        thermalRight,
        liquidShade,
        iceBlock,
        iceCracks,
        liquidSurface,
        liquidLabel,
        gasHint,
        gasArrows,
        temperatureGlow,
        info,
        legend,
        phaseBadge,
        phaseBadgeText,
        attractionLayer,
        particleLayer,
        statusPanel,
        statusLabel,
        statusValue,
        statusDetail,
        statusDirection,
      );
      root.append(svg);

      function phaseValue(): number {
        const melt = material.melting;
        const boil = material.boiling;
        if (temperature < melt - 8) return 0;
        if (temperature < melt + 8) return clamp((temperature - (melt - 8)) / 16, 0, 1);
        if (temperature < boil - 10) return 1;
        if (temperature < boil + 10) return 1 + clamp((temperature - (boil - 10)) / 20, 0, 1);
        return 2;
      }

      function phaseStatus(): { label: string; detail: string; value: number; color: string } {
        const value = phaseValue();
        const meltBand = temperature >= material.melting - 8 && temperature <= material.melting + 8;
        const boilBand =
          temperature >= material.boiling - 10 && temperature <= material.boiling + 10;
        if (meltBand && temperature < material.melting + 2)
          return { label: "MELTING", detail: "Solid → Liquid", value, color: "#f2bd67" };
        if (meltBand && temperature < material.melting - 2)
          return { label: "FREEZING", detail: "Liquid → Solid", value, color: "#8fdcff" };
        if (boilBand && temperature < material.boiling)
          return { label: "EVAPORATION", detail: "Liquid → Gas", value, color: "#f2bd67" };
        if (boilBand) return { label: "BOILING", detail: "Liquid → Gas", value, color: "#ff9a62" };
        if (value < 0.5)
          return { label: "SOLID", detail: "Ordered lattice", value, color: "#8fdcff" };
        if (value < 1.5)
          return { label: "LIQUID", detail: "Close, flowing particles", value, color: "#73e4ff" };
        return { label: "GAS", detail: "Rapid diffusion", value, color: "#f5c16c" };
      }

      function energyLabel(): string {
        const span = material.boiling - material.melting;
        const normalized = clamp((temperature - material.melting) / span, 0, 1.8);
        if (normalized < 0.3) return "LOW";
        if (normalized < 0.85) return "MEDIUM";
        if (normalized < 1.35) return "HIGH";
        return "VERY HIGH";
      }

      function particleColor(): string {
        const warm = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1,
        );
        if (warm > 0.78) return "#ff9a67";
        if (warm > 0.45) return "#f4c86e";
        return material.accent;
      }

      function wavePath(time: number): string {
        const phase = time * 1.5;
        const points: string[] = [];
        for (let x = CHAMBER.left + 8; x <= CHAMBER.right - 8; x += 12) {
          const y = 350 + Math.sin(x * 0.035 + phase) * 4 + Math.sin(x * 0.011 + phase * 0.55) * 2;
          points.push(`${x === CHAMBER.left + 8 ? "M" : "L"} ${x} ${y}`);
        }
        return points.join(" ");
      }

      function liquidPath(time: number): string {
        return `${wavePath(time)} L ${CHAMBER.right - 8} ${CHAMBER.bottom} L ${CHAMBER.left + 8} ${CHAMBER.bottom} Z`;
      }

      function solidPosition(index: number): { x: number; y: number } {
        const column = index % 12;
        const row = Math.floor(index / 12);
        return { x: 412 + column * 18, y: 424 + row * 13 };
      }

      function liquidPosition(index: number): { x: number; y: number } {
        return {
          x: 316 + ((index * 47) % 408),
          y: 382 + ((index * 31) % 112),
        };
      }

      function updateAttractions(phase: number, temperatureGlowAmount: number) {
        attractionLayer.replaceChildren();
        const show = clamp((1 - phase) * 0.74 - temperatureGlowAmount * 0.15, 0, 0.7);
        const solidColumns = 12;
        const solidRows = 6;
        for (let row = 0; row < solidRows; row += 1) {
          for (let column = 0; column < solidColumns - 1; column += 1) {
            const index = row * solidColumns + column;
            const next = index + 1;
            const start = solidPosition(index);
            const end = solidPosition(next);
            const line = createSvgElement("line", {
              x1: String(start.x),
              y1: String(start.y),
              x2: String(end.x),
              y2: String(end.y),
              stroke: particleColor(),
              "stroke-opacity": String(show),
              "stroke-width": "1.2",
              "stroke-dasharray": phase > 0.35 ? "2 5" : "none",
            });
            attractionLayer.append(line);
          }
        }
      }

      function updateParticles(time: number, step: number, phase: number) {
        const liquidMix = clamp(phase, 0, 1);
        const gasMix = clamp(phase - 1, 0, 1);
        const temperatureEnergy = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1.6,
        );
        const speed = 0.5 + temperatureEnergy * 1.9;
        particles.forEach((particle, index) => {
          const vibration = 1.5 + temperatureEnergy * 9;
          const lattice = solidPosition(index);
          const fluid = liquidPosition(index);
          const latticeX =
            lattice.x + Math.sin(time * (2.2 + particle.seed * 0.03) + particle.seed) * vibration;
          const latticeY =
            lattice.y +
            Math.cos(time * (2.0 + particle.seed * 0.025) + particle.seed * 0.7) * vibration;
          const liquidX =
            fluid.x + Math.sin(time * speed + particle.seed * 0.4) * (8 + temperatureEnergy * 18);
          const liquidY =
            fluid.y + Math.cos(time * speed * 0.72 + particle.seed) * (6 + temperatureEnergy * 12);
          particle.gasX += particle.gasVX * step * speed;
          particle.gasY += particle.gasVY * step * speed;
          if (particle.gasX < CHAMBER.left + 24 || particle.gasX > CHAMBER.right - 24) {
            particle.gasVX *= -1;
            particle.gasX = clamp(particle.gasX, CHAMBER.left + 24, CHAMBER.right - 24);
          }
          if (particle.gasY < CHAMBER.top + 34 || particle.gasY > CHAMBER.bottom - 24) {
            particle.gasVY *= -1;
            particle.gasY = clamp(particle.gasY, CHAMBER.top + 34, CHAMBER.bottom - 24);
          }
          const mixedLiquidX = latticeX * (1 - liquidMix) + liquidX * liquidMix;
          const mixedLiquidY = latticeY * (1 - liquidMix) + liquidY * liquidMix;
          const x = mixedLiquidX * (1 - gasMix) + particle.gasX * gasMix;
          const y = mixedLiquidY * (1 - gasMix) + particle.gasY * gasMix;
          const depthScale = 0.78 + particle.z * 0.34;
          const radius = (4.8 + temperatureEnergy * 1.4) * depthScale;
          const opacity = 0.5 + particle.z * 0.45;
          const glow = particleGlows[index];
          const node = particleNodes[index];
          glow?.setAttribute("cx", String(x));
          glow?.setAttribute("cy", String(y));
          glow?.setAttribute("r", String(radius * 2.2));
          glow?.setAttribute("fill", particleColor());
          glow?.setAttribute("fill-opacity", String(0.1 + temperatureEnergy * 0.11));
          node?.setAttribute("cx", String(x));
          node?.setAttribute("cy", String(y));
          node?.setAttribute("r", String(radius));
          node?.setAttribute("fill", "url(#states-particle)");
          node?.setAttribute("fill-opacity", String(opacity));
        });
      }

      function updateMeasurements() {
        const status = phaseStatus();
        const energy = energyLabel();
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
          { id: "molecular-energy", label: "Molecular energy", value: energy },
          { id: "thermal-trend", label: "Heating / cooling", value: trend },
        ]);
        const detail =
          status.label === "SOLID"
            ? "Particles are closely packed and vibrate around fixed positions. Strong attractions keep the lattice organized."
            : status.label === "LIQUID"
              ? "Particles remain close together but move past one another, allowing the substance to flow."
              : status.label === "GAS"
                ? "Particles are widely separated and move rapidly in all directions, allowing diffusion throughout the chamber."
                : status.label === "BOILING" || status.label === "EVAPORATION"
                  ? "Particles have enough kinetic energy to escape the liquid surface and spread through the chamber."
                  : "Heating or cooling is changing molecular freedom. The ordered structure is reorganizing smoothly.";
        host.publishExplanation({ whatsHappening: detail });
      }

      function updateReadout(time: number) {
        const status = phaseStatus();
        const energy = energyLabel();
        const glowAmount = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
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
          status.value < 0.6
            ? "LATTICE / VIBRATION"
            : status.value < 1.5
              ? "FLOW / CLOSE RANGE"
              : "DIFFUSION / HIGH ENERGY";
        phaseBadgeText.textContent = status.label;
        phaseBadge.setAttribute("stroke", status.color);
        phaseBadgeText.setAttribute("fill", status.color);
        statusLabel.textContent = "CURRENT PHASE";
        statusValue.textContent = status.label;
        statusDetail.textContent = status.detail;
        statusDirection.textContent = `${format(temperature, 0)}°C  ·  ${energy} ENERGY`;
        statusValue.setAttribute("fill", status.color);
        temperatureGlow.setAttribute(
          "fill",
          temperature >= material.boiling
            ? "#ff754e"
            : temperature >= material.melting
              ? "#f4b45e"
              : "#58bde8",
        );
        temperatureGlow.setAttribute("fill-opacity", String(0.015 + glowAmount * 0.06));
        const liquidAmount = clamp(status.value < 1 ? status.value : 2 - status.value, 0, 1);
        const gasAmount = clamp(status.value - 1, 0, 1);
        const solidAmount = clamp(1 - status.value, 0, 1);
        const hotAmount = clamp(
          (temperature - material.melting) / Math.max(1, material.boiling - material.melting),
          0,
          1.4,
        );
        const coldAmount = clamp(
          (material.melting - temperature) / Math.max(1, Math.abs(material.melting) + 40),
          0,
          1,
        );
        liquidSurface.setAttribute("d", wavePath(time));
        liquidSurface.setAttribute("stroke", material.accent);
        liquidSurface.setAttribute("stroke-opacity", String(0.15 + liquidAmount * 0.62));
        liquidShade.setAttribute("d", liquidPath(time));
        liquidShade.setAttribute("fill", material.tint);
        liquidShade.setAttribute("fill-opacity", String(0.02 + liquidAmount * 0.17));
        liquidLabel.textContent =
          liquidAmount > 0.2
            ? `${(material.label.split(" /")[0] ?? material.label).toUpperCase()} / LIQUID LEVEL`
            : "";
        liquidLabel.setAttribute("opacity", String(liquidAmount));
        gasHint.textContent = gasAmount > 0.18 ? "VAPOUR / DIFFUSION" : "";
        gasHint.setAttribute("opacity", String(gasAmount));
        gasArrows.setAttribute("opacity", String(gasAmount));
        iceBlock.setAttribute("opacity", String(solidAmount));
        iceCracks.setAttribute("opacity", String(solidAmount));
        thermalLeft.setAttribute("fill", hotAmount > coldAmount ? "#ff654b" : "#45bfff");
        thermalRight.setAttribute("fill", hotAmount > coldAmount ? "#ff654b" : "#45bfff");
        thermalLeft.setAttribute(
          "fill-opacity",
          String(0.015 + Math.max(hotAmount, coldAmount) * 0.12),
        );
        thermalRight.setAttribute(
          "fill-opacity",
          String(0.015 + Math.max(hotAmount, coldAmount) * 0.12),
        );
        updateAttractions(status.value, glowAmount);
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
          accumulator += frameSeconds;
          while (accumulator >= FIXED_STEP) {
            elapsed += FIXED_STEP;
            accumulator -= FIXED_STEP;
          }
          uiAccumulator += frameSeconds;
          if (uiAccumulator >= 1 / 15) {
            publishGraph();
            updateMeasurements();
            uiAccumulator = 0;
          }
        }
        const status = phaseStatus();
        updateParticles(elapsed, frameSeconds, status.value);
        updateReadout(elapsed);
        animationFrame = requestAnimationFrame(frame);
      }

      function resetState() {
        elapsed = 0;
        accumulator = 0;
        uiAccumulator = 0;
        running = false;
        host.replaceGraphData([]);
        updateMeasurements();
        updateReadout(0);
      }

      function applyParams() {
        material = MATERIALS[substanceId] ?? MATERIALS["water"]!;
        const delta = temperature - previousTemperature;
        trend = delta > 0.2 ? "HEATING" : delta < -0.2 ? "COOLING" : "STABLE";
        previousTemperature = temperature;
        updateMeasurements();
        updateReadout(elapsed);
      }

      applyParams();
      updateParticles(0, 0, phaseStatus().value);
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
          host.setRunning(false);
        },
        resize(nextWidth, nextHeight) {
          width = nextWidth;
          height = nextHeight;
          root.style.width = `${width}px`;
          root.style.height = `${height}px`;
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
          applyParams();
          resetState();
        },
        destroy() {
          cancelAnimationFrame(animationFrame);
          container.replaceChildren();
          void width;
          void height;
        },
      };
    },
  };
}

export const chemistryStates = createStatesModule();
