import type {
  GraphSample,
  MountContext,
  ParamValue,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULTS = {
  objectDensity: 700,
  volume: 0.01,
  fluid: "water",
  showForces: true,
} as const;

const GRAVITY = 9.81;
const FIXED_STEP = 1 / 120;
const MAX_FRAME_STEP = 1 / 20;
const GRAPH_WINDOW = 240;
const TANK = { left: 90, right: 710, surface: 286, bottom: 530 } as const;
const OBJECT_WIDTH = 108;
const OBJECT_HEIGHT = 76;

interface FluidConfig {
  label: string;
  density: number;
  top: string;
  bottom: string;
  accent: string;
  waveSpeed: number;
  bubbleOpacity: number;
}

const DEFAULT_FLUID: FluidConfig = {
  label: "Water",
  density: 1000,
  top: "#38c9ef",
  bottom: "#0d547d",
  accent: "#76e7ff",
  waveSpeed: 1,
  bubbleOpacity: 0.42,
};

const FLUIDS: Record<string, FluidConfig> = {
  water: DEFAULT_FLUID,
  seawater: {
    label: "Sea Water",
    density: 1025,
    top: "#36a7d2",
    bottom: "#123f70",
    accent: "#82d8eb",
    waveSpeed: 0.82,
    bubbleOpacity: 0.5,
  },
  glycerine: {
    label: "Glycerine",
    density: 1260,
    top: "#7b8be8",
    bottom: "#3b3c85",
    accent: "#b8c2ff",
    waveSpeed: 0.42,
    bubbleOpacity: 0.28,
  },
  honey: {
    label: "Honey",
    density: 1400,
    top: "#e4a541",
    bottom: "#7d451d",
    accent: "#ffd277",
    waveSpeed: 0.24,
    bubbleOpacity: 0.2,
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

function booleanParam(params: SimulationParams, id: string, fallback: boolean): boolean {
  const value = params[id];
  return typeof value === "boolean" ? value : fallback;
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function format(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function createBuoyancyModule(): SimulationModule {
  return {
    id: "physics-buoyancy",
    subject: "physics",
    title: "Buoyancy Lab",
    description: "Change density, volume and liquid to discover why objects float or sink.",
    concepts: ["Archimedes' principle", "Density", "Upthrust"],
    grade: "8-10",
    status: "ready",
    controls: [
      {
        kind: "slider",
        id: "objectDensity",
        label: "Object Density",
        min: 300,
        max: 2400,
        step: 10,
        unit: "kg/m³",
        defaultValue: DEFAULTS.objectDensity,
        group: "Object",
      },
      {
        kind: "slider",
        id: "volume",
        label: "Object Volume",
        min: 0.005,
        max: 0.02,
        step: 0.001,
        unit: "m³",
        defaultValue: DEFAULTS.volume,
        group: "Object",
      },
      {
        kind: "select",
        id: "fluid",
        label: "Liquid",
        options: [
          { value: "water", label: "Water · 1000 kg/m³" },
          { value: "seawater", label: "Sea Water · 1025 kg/m³" },
          { value: "glycerine", label: "Glycerine · 1260 kg/m³" },
          { value: "honey", label: "Honey · 1400 kg/m³" },
        ],
        defaultValue: DEFAULTS.fluid,
        group: "Environment",
      },
      {
        kind: "toggle",
        id: "showForces",
        label: "Show force vectors",
        defaultValue: DEFAULTS.showForces,
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
      window: GRAPH_WINDOW,
    },
    explanation: {
      whatsHappening:
        "A submerged object displaces liquid, producing an upward buoyant force. The object moves until buoyancy and weight balance, or until it reaches the bottom.",
      keyConcept:
        "An object floats when the upward buoyant force equals its downward weight. Changing either density changes how much must be submerged.",
      deeperDive:
        "The buoyant force is calculated from the density of the liquid, gravitational acceleration, and the displaced volume.",
      formula: "F_b = ρ_liquid · g · V_displaced     |     F_b = W",
    },
    aspectRatio: 4 / 3,
    mount(context: MountContext): SimulationInstance {
      const { container, host } = context;
      let params = { ...context.params };
      let objectDensity = numberParam(params, "objectDensity", DEFAULTS.objectDensity);
      let volume = numberParam(params, "volume", DEFAULTS.volume);
      let fluidId = stringParam(params, "fluid", DEFAULTS.fluid);
      let showForces = booleanParam(params, "showForces", DEFAULTS.showForces);
      let fluid: FluidConfig = FLUIDS[fluidId] ?? DEFAULT_FLUID;
      let objectY = 188;
      let velocity = 0;
      let elapsed = 0;
      let accumulator = 0;
      let uiAccumulator = 0;
      let lastTimestamp = performance.now();
      let animationFrame = 0;
      let running = false;
      let width = 800;
      let height = 600;

      const root = document.createElement("div");
      root.className = "absolute inset-0 overflow-hidden";
      container.replaceChildren(root);

      const svg = createSvgElement("svg", {
        viewBox: "0 0 800 600",
        role: "img",
        "aria-label": "Interactive buoyancy laboratory simulation",
        class: "h-full w-full",
        preserveAspectRatio: "xMidYMid meet",
      });
      const defs = createSvgElement("defs", {});
      const backgroundGradient = createSvgElement("linearGradient", {
        id: "buoyancy-bg",
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1",
      });
      backgroundGradient.append(
        createSvgElement("stop", { offset: "0%", "stop-color": "#0a1d28" }),
        createSvgElement("stop", { offset: "100%", "stop-color": "#071017" }),
      );
      const liquidGradient = createSvgElement("linearGradient", {
        id: "buoyancy-liquid",
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1",
      });
      const objectGradient = createSvgElement("linearGradient", {
        id: "buoyancy-object",
        x1: "0",
        y1: "0",
        x2: "1",
        y2: "1",
      });
      const gridPattern = createSvgElement("pattern", {
        id: "buoyancy-grid",
        width: "32",
        height: "32",
        patternUnits: "userSpaceOnUse",
      });
      gridPattern.append(
        createSvgElement("path", {
          d: "M 32 0 L 0 0 0 32",
          fill: "none",
          stroke: "#68b9d1",
          "stroke-opacity": "0.08",
          "stroke-width": "1",
        }),
      );
      const glow = createSvgElement("filter", {
        id: "buoyancy-glow",
        x: "-50%",
        y: "-50%",
        width: "200%",
        height: "200%",
      });
      glow.append(createSvgElement("feGaussianBlur", { stdDeviation: "6", result: "blur" }));
      const arrowMarker = createSvgElement("marker", {
        id: "buoyancy-arrow",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto-start-reverse",
      });
      arrowMarker.append(createSvgElement("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#5ddcff" }));
      const downArrowMarker = createSvgElement("marker", {
        id: "buoyancy-down-arrow",
        viewBox: "0 0 10 10",
        refX: "8",
        refY: "5",
        markerWidth: "6",
        markerHeight: "6",
        orient: "auto-start-reverse",
      });
      downArrowMarker.append(
        createSvgElement("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#e3a550" }),
      );
      defs.append(
        backgroundGradient,
        liquidGradient,
        objectGradient,
        gridPattern,
        glow,
        arrowMarker,
        downArrowMarker,
      );
      svg.append(defs);

      const background = createSvgElement("rect", {
        width: "800",
        height: "600",
        fill: "url(#buoyancy-bg)",
      });
      const grid = createSvgElement("rect", {
        width: "800",
        height: "600",
        fill: "url(#buoyancy-grid)",
      });
      const tankGlow = createSvgElement("rect", {
        x: String(TANK.left - 16),
        y: String(TANK.surface - 14),
        width: String(TANK.right - TANK.left + 32),
        height: String(TANK.bottom - TANK.surface + 30),
        rx: "18",
        fill: "#2bc4ed",
        "fill-opacity": "0.055",
        filter: "url(#buoyancy-glow)",
      });
      const tank = createSvgElement("rect", {
        x: String(TANK.left),
        y: String(TANK.surface - 10),
        width: String(TANK.right - TANK.left),
        height: String(TANK.bottom - TANK.surface + 10),
        rx: "10",
        fill: "none",
        stroke: "#9dd6df",
        "stroke-opacity": "0.45",
        "stroke-width": "3",
      });
      const liquid = createSvgElement("path", {
        fill: "url(#buoyancy-liquid)",
        "fill-opacity": "0.76",
      });
      const liquidSurface = createSvgElement("path", {
        fill: "none",
        stroke: "#8ceeff",
        "stroke-opacity": "0.72",
        "stroke-width": "3",
        "stroke-linecap": "round",
      });
      const liquidFlow = createSvgElement("path", {
        fill: "none",
        stroke: "#b8f5ff",
        "stroke-opacity": "0.16",
        "stroke-width": "2",
      });
      const liquidBubbles = Array.from({ length: 8 }, (_, index) =>
        createSvgElement("circle", {
          cx: String(130 + ((index * 71) % 520)),
          cy: String(340 + ((index * 37) % 150)),
          r: String(2 + (index % 3)),
          fill: "#c6f7ff",
          "fill-opacity": "0.3",
        }),
      );
      const liquidLabel = createSvgElement("text", {
        x: "112",
        y: "318",
        fill: "#c8f5ff",
        "fill-opacity": "0.7",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
        "letter-spacing": "2",
      });
      const tankBottom = createSvgElement("line", {
        x1: String(TANK.left + 14),
        y1: String(TANK.bottom),
        x2: String(TANK.right - 14),
        y2: String(TANK.bottom),
        stroke: "#9dd6df",
        "stroke-opacity": "0.25",
        "stroke-width": "4",
      });
      const objectGlow = createSvgElement("rect", {
        width: String(OBJECT_WIDTH + 14),
        height: String(OBJECT_HEIGHT + 14),
        rx: "12",
        fill: "#38d6ff",
        "fill-opacity": "0.3",
        filter: "url(#buoyancy-glow)",
      });
      const object = createSvgElement("rect", {
        width: String(OBJECT_WIDTH),
        height: String(OBJECT_HEIGHT),
        rx: "8",
        fill: "url(#buoyancy-object)",
        stroke: "#d7f8ff",
        "stroke-opacity": "0.8",
        "stroke-width": "2",
      });
      const objectHighlight = createSvgElement("line", {
        x1: "14",
        y1: "12",
        x2: "94",
        y2: "12",
        stroke: "#ffffff",
        "stroke-opacity": "0.28",
        "stroke-width": "3",
        "stroke-linecap": "round",
      });
      const objectLabel = createSvgElement("text", {
        fill: "#e4fbff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "text-anchor": "middle",
        "letter-spacing": "1.2",
      });
      objectLabel.textContent = "OBJECT";
      const forceLayer = createSvgElement("g", {});
      const buoyantArrow = createSvgElement("line", {
        stroke: "#5ddcff",
        "stroke-width": "4",
        "stroke-linecap": "round",
        "marker-end": "url(#buoyancy-arrow)",
      });
      const weightArrow = createSvgElement("line", {
        stroke: "#e3a550",
        "stroke-width": "4",
        "stroke-linecap": "round",
        "marker-end": "url(#buoyancy-down-arrow)",
      });
      const buoyantLabel = createSvgElement("text", {
        fill: "#72e4ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
      });
      const weightLabel = createSvgElement("text", {
        fill: "#f0bd67",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "11",
      });
      forceLayer.append(buoyantArrow, weightArrow, buoyantLabel, weightLabel);

      const info = createSvgElement("g", {
        fill: "#d8f7ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
      });
      const infoTitle = createSvgElement("text", {
        x: "32",
        y: "44",
        fill: "#78dcf5",
        "font-size": "13",
        "letter-spacing": "3",
      });
      infoTitle.textContent = "BUOYANCY / LIVE MODEL";
      const infoObject = createSvgElement("text", { x: "32", y: "72", "font-size": "12" });
      const infoLiquid = createSvgElement("text", { x: "32", y: "94", "font-size": "12" });
      const infoForce = createSvgElement("text", {
        x: "32",
        y: "116",
        "font-size": "12",
        fill: "#72e4ff",
      });
      const infoWeight = createSvgElement("text", {
        x: "32",
        y: "138",
        "font-size": "12",
        fill: "#f0bd67",
      });
      const infoSubmerged = createSvgElement("text", { x: "32", y: "160", "font-size": "12" });
      const infoState = createSvgElement("text", {
        x: "32",
        y: "182",
        "font-size": "11",
        fill: "#9ed6df",
        "letter-spacing": "1.2",
      });
      info.append(
        infoTitle,
        infoObject,
        infoLiquid,
        infoForce,
        infoWeight,
        infoSubmerged,
        infoState,
      );

      const statusCard = createSvgElement("rect", {
        x: "248",
        y: "548",
        width: "304",
        height: "36",
        rx: "18",
        fill: "#071017",
        "fill-opacity": "0.88",
        stroke: "#5ddcff",
        "stroke-opacity": "0.35",
      });
      const statusTitle = createSvgElement("text", {
        x: "400",
        y: "563",
        fill: "#72e4ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "10",
        "font-weight": "700",
        "letter-spacing": "1.4",
        "text-anchor": "middle",
      });
      const statusDetail = createSvgElement("text", {
        x: "400",
        y: "577",
        fill: "#9ed6df",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "8",
        "text-anchor": "middle",
      });
      svg.append(
        background,
        grid,
        tankGlow,
        info,
        tank,
        liquid,
        liquidSurface,
        liquidFlow,
        ...liquidBubbles,
        liquidLabel,
        tankBottom,
        objectGlow,
        object,
        objectHighlight,
        objectLabel,
        forceLayer,
        statusCard,
        statusTitle,
        statusDetail,
      );
      root.append(svg);

      function currentFluid(): FluidConfig {
        return FLUIDS[fluidId] ?? DEFAULT_FLUID;
      }

      function submergedFraction(y: number): number {
        const top = y - OBJECT_HEIGHT / 2;
        const bottom = y + OBJECT_HEIGHT / 2;
        return Math.max(0, Math.min(1, (bottom - TANK.surface) / OBJECT_HEIGHT));
      }

      function targetY(): number {
        const ratio = objectDensity / fluid.density;
        if (ratio < 1) return TANK.surface - OBJECT_HEIGHT / 2 + ratio * OBJECT_HEIGHT;
        if (Math.abs(ratio - 1) < 0.015) return TANK.surface + OBJECT_HEIGHT / 2 + 34;
        return TANK.bottom - OBJECT_HEIGHT / 2 - 6;
      }

      function forces() {
        const fraction = submergedFraction(objectY);
        const mass = objectDensity * volume;
        const weight = mass * GRAVITY;
        const displacedVolume = volume * fraction;
        const buoyant = fluid.density * GRAVITY * displacedVolume;
        return { fraction, mass, weight, buoyant, displacedVolume };
      }

      function stateFor(
        fraction: number,
        buoyant: number,
        weight: number,
      ): { title: string; detail: string; color: string } {
        const ratio = objectDensity / fluid.density;
        if (ratio < 1 && Math.abs(buoyant - weight) < Math.max(0.08, weight * 0.025)) {
          return {
            title: "OBJECT IS FLOATING",
            detail: "Partly submerged at the liquid surface.",
            color: "#72e4ff",
          };
        }
        if (
          Math.abs(ratio - 1) < 0.015 &&
          Math.abs(buoyant - weight) < Math.max(0.08, weight * 0.04)
        ) {
          return {
            title: "OBJECT IS NEUTRALLY BUOYANT",
            detail: "Fully submerged and suspended inside the liquid.",
            color: "#72e4ff",
          };
        }
        if (objectY < targetY() - 4 && weight > buoyant) {
          return {
            title: "OBJECT IS SINKING",
            detail: "Weight is greater than the current buoyant force.",
            color: "#f0bd67",
          };
        }
        if (objectY > targetY() + 4 && buoyant > weight) {
          return {
            title: "OBJECT IS RISING",
            detail: "Buoyant force is lifting the object toward equilibrium.",
            color: "#72e4ff",
          };
        }
        return {
          title: fraction >= 1 ? "OBJECT IS SUSPENDED" : "OBJECT IS FLOATING",
          detail: "Forces are approaching equilibrium.",
          color: "#72e4ff",
        };
      }

      function applyFluidColors() {
        fluid = currentFluid();
        liquidGradient.innerHTML = "";
        liquidGradient.append(
          createSvgElement("stop", { offset: "0%", "stop-color": fluid.top }),
          createSvgElement("stop", { offset: "100%", "stop-color": fluid.bottom }),
        );
        liquidSurface.setAttribute("stroke", fluid.accent);
        liquidFlow.setAttribute("stroke", fluid.accent);
        liquidLabel.textContent = `${fluid.label.toUpperCase()} / ${fluid.density} kg/m³`;
        liquidLabel.setAttribute("fill", fluid.accent);
        liquidBubbles.forEach((bubble) =>
          bubble.setAttribute("fill-opacity", String(fluid.bubbleOpacity)),
        );
      }

      function wavePath(time: number): string {
        const points: string[] = [];
        const travel = time * fluid.waveSpeed;
        for (let x = TANK.left + 1; x <= TANK.right - 1; x += 12) {
          const phase = x * 0.032 + travel * 2.4;
          const y = TANK.surface + Math.sin(phase) * 3 + Math.sin(phase * 0.47 + 1.3) * 1.4;
          points.push(`${x === TANK.left + 1 ? "M" : "L"} ${x} ${y}`);
        }
        return points.join(" ");
      }

      function liquidPath(time: number): string {
        const surface = wavePath(time).replace(/^M /, "M ");
        return `${surface} L ${TANK.right - 1} ${TANK.bottom} L ${TANK.left + 1} ${TANK.bottom} Z`;
      }

      function updateMeasurements() {
        const { fraction, buoyant, weight, displacedVolume } = forces();
        const state = stateFor(fraction, buoyant, weight);
        host.publishMeasurements([
          {
            id: "object-density",
            label: "Object density",
            value: objectDensity,
            unit: "kg/m³",
            precision: 0,
          },
          {
            id: "liquid-density",
            label: "Liquid density",
            value: fluid.density,
            unit: "kg/m³",
            precision: 0,
          },
          {
            id: "buoyant-force",
            label: "Buoyant force",
            value: buoyant,
            unit: "N",
            precision: 2,
            emphasis: true,
          },
          { id: "weight", label: "Weight", value: weight, unit: "N", precision: 2, emphasis: true },
          { id: "submerged", label: "Submerged", value: fraction * 100, unit: "%", precision: 0 },
          {
            id: "displaced-volume",
            label: "Displaced volume",
            value: displacedVolume,
            unit: "m³",
            precision: 4,
          },
          { id: "state", label: "Current state", value: state.title },
        ]);
        host.publishExplanation({
          whatsHappening: `${state.detail} The liquid currently provides ${format(buoyant)} N upward while the object weighs ${format(weight)} N downward.`,
        });
      }

      function updateReadout(time: number) {
        const { fraction, buoyant, weight } = forces();
        const state = stateFor(fraction, buoyant, weight);
        infoObject.textContent = `OBJECT DENSITY   ${format(objectDensity, 0)} kg/m³`;
        infoLiquid.textContent = `LIQUID DENSITY   ${format(fluid.density, 0)} kg/m³`;
        infoForce.textContent = `↑ BUOYANT FORCE  ${format(buoyant)} N`;
        infoWeight.textContent = `↓ WEIGHT         ${format(weight)} N`;
        infoSubmerged.textContent = `SUBMERGED       ${format(fraction * 100, 0)}%`;
        infoState.textContent = running
          ? "● RUNNING / BUOYANCY INTEGRATION"
          : "Ⅱ PAUSED / READY TO RUN";
        statusTitle.textContent = state.title;
        statusDetail.textContent = state.detail;
        statusTitle.setAttribute("fill", state.color);
        forceLayer.setAttribute("opacity", showForces ? "1" : "0");
        liquid.setAttribute("d", liquidPath(time));
        liquidSurface.setAttribute("d", wavePath(time));
        liquidFlow.setAttribute(
          "d",
          `M ${TANK.left + 28} ${TANK.surface + 45 + Math.sin(time) * 3} C 280 ${TANK.surface + 28}, 420 ${TANK.surface + 62}, ${TANK.right - 28} ${TANK.surface + 42 + Math.cos(time * 0.8) * 3}`,
        );
        liquidBubbles.forEach((bubble, index) => {
          const baseY = 342 + ((index * 37) % 142);
          const bubbleY = baseY - ((time * (0.8 + index * 0.06) * fluid.waveSpeed * 8) % 155);
          bubble.setAttribute(
            "cy",
            String(bubbleY < TANK.surface + 14 ? TANK.bottom - 12 : bubbleY),
          );
          bubble.setAttribute("opacity", String(0.35 + Math.sin(time * 1.3 + index) * 0.12));
        });
      }

      function updateVisuals(time: number) {
        const { fraction, buoyant, weight } = forces();
        const state = stateFor(fraction, buoyant, weight);
        const objectX = 400;
        object.setAttribute("x", String(objectX - OBJECT_WIDTH / 2));
        object.setAttribute("y", String(objectY - OBJECT_HEIGHT / 2));
        objectGlow.setAttribute("x", String(objectX - (OBJECT_WIDTH + 14) / 2));
        objectGlow.setAttribute("y", String(objectY - (OBJECT_HEIGHT + 14) / 2));
        objectHighlight.setAttribute(
          "transform",
          `translate(${objectX - OBJECT_WIDTH / 2} ${objectY - OBJECT_HEIGHT / 2})`,
        );
        objectLabel.setAttribute("x", String(objectX));
        objectLabel.setAttribute("y", String(objectY + 4));
        const arrowScale = Math.max(30, Math.min(100, Math.max(weight, buoyant) * 4));
        buoyantArrow.setAttribute("x1", String(objectX - 68));
        buoyantArrow.setAttribute("y1", String(objectY + 8));
        buoyantArrow.setAttribute("x2", String(objectX - 68));
        buoyantArrow.setAttribute(
          "y2",
          String(objectY + 8 - (buoyant / Math.max(weight, 0.01)) * arrowScale),
        );
        weightArrow.setAttribute("x1", String(objectX + 68));
        weightArrow.setAttribute("y1", String(objectY - 8));
        weightArrow.setAttribute("x2", String(objectX + 68));
        weightArrow.setAttribute(
          "y2",
          String(objectY - 8 + (weight / Math.max(buoyant, 0.01)) * arrowScale),
        );
        buoyantLabel.textContent = `↑ ${format(buoyant)} N`;
        buoyantLabel.setAttribute("x", String(objectX - 130));
        buoyantLabel.setAttribute("y", String(objectY - 38));
        weightLabel.textContent = `↓ ${format(weight)} N`;
        weightLabel.setAttribute("x", String(objectX + 82));
        weightLabel.setAttribute("y", String(objectY + 56));
        statusCard.setAttribute("stroke", state.color);
        updateReadout(time);
      }

      function publishGraph() {
        const { buoyant, weight, displacedVolume } = forces();
        const sample: GraphSample = { x: displacedVolume, buoyant, weight };
        host.publishGraphSample(sample);
      }

      function integrate(step: number) {
        const { fraction, buoyant, weight } = forces();
        const mass = Math.max(objectDensity * volume, 0.001);
        const acceleration = ((weight - buoyant) / mass) * 0.72;
        velocity += acceleration * step;
        velocity *= 0.985;
        objectY += velocity * step * 30;
        const minY = TANK.surface - OBJECT_HEIGHT / 2 - 100;
        const maxY = TANK.bottom - OBJECT_HEIGHT / 2 - 6;
        if (objectY < minY) {
          objectY = minY;
          velocity = Math.max(0, velocity);
        }
        if (objectY > maxY) {
          objectY = maxY;
          velocity *= -0.16;
        }
        if (fraction > 0 && fraction < 1 && Math.abs(weight - buoyant) < 0.08) velocity *= 0.92;
        elapsed += step;
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
            integrate(FIXED_STEP);
            accumulator -= FIXED_STEP;
          }
          uiAccumulator += frameSeconds;
          if (uiAccumulator >= 1 / 15) {
            publishGraph();
            updateMeasurements();
            uiAccumulator = 0;
          }
        }
        updateVisuals(elapsed);
        animationFrame = requestAnimationFrame(frame);
      }

      function resetState() {
        objectY = 188;
        velocity = 0;
        elapsed = 0;
        accumulator = 0;
        uiAccumulator = 0;
        host.replaceGraphData([]);
        updateMeasurements();
        updateVisuals(0);
      }

      applyFluidColors();
      updateMeasurements();
      updateVisuals(0);
      animationFrame = requestAnimationFrame(frame);

      return {
        start() {
          running = true;
          lastTimestamp = performance.now();
          host.setRunning(true);
          updateReadout(elapsed);
        },
        pause() {
          running = false;
          host.setRunning(false);
          updateReadout(elapsed);
        },
        reset() {
          running = false;
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
          if (id === "objectDensity" && typeof value === "number") objectDensity = value;
          if (id === "volume" && typeof value === "number") volume = value;
          if (id === "fluid" && typeof value === "string") fluidId = value;
          if (id === "showForces" && typeof value === "boolean") showForces = value;
          if (id === "fluid") applyFluidColors();
          updateMeasurements();
          updateVisuals(elapsed);
        },
        setParams(nextParams: SimulationParams) {
          params = { ...nextParams };
          objectDensity = numberParam(params, "objectDensity", DEFAULTS.objectDensity);
          volume = numberParam(params, "volume", DEFAULTS.volume);
          fluidId = stringParam(params, "fluid", DEFAULTS.fluid);
          showForces = booleanParam(params, "showForces", DEFAULTS.showForces);
          applyFluidColors();
          resetState();
        },
        onAction(actionId: string) {
          if (actionId === "drop") {
            objectY = TANK.surface - OBJECT_HEIGHT / 2 - 96;
            velocity = 0;
            running = true;
            host.setRunning(true);
          }
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

export const physicsBuoyancy = createBuoyancyModule();
