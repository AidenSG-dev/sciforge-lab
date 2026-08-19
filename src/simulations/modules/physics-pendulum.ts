import type {
  GraphSample,
  MountContext,
  ParamValue,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULTS = {
  length: 1,
  gravity: 9.81,
  initialAngle: 30,
  speed: 1,
  showMeasurements: true,
} as const;

const TAU = Math.PI * 2;
const FIXED_STEP = 1 / 120;
const MAX_FRAME_STEP = 1 / 20;
const GRAPH_WINDOW = 240;

function numberParam(params: SimulationParams, id: string, fallback: number): number {
  const value = params[id];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function booleanParam(params: SimulationParams, id: string, fallback: boolean): boolean {
  const value = params[id];
  return typeof value === "boolean" ? value : fallback;
}

function periodFor(length: number, gravity: number): number {
  return TAU * Math.sqrt(length / gravity);
}

function degrees(value: number): number {
  return (value * 180) / Math.PI;
}

function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attributes: Record<string, string>,
): SVGElementTagNameMap[K] {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  return element;
}

function createPendulumModule(): SimulationModule {
  return {
    id: "physics-pendulum",
    subject: "physics",
    title: "Interactive Pendulum",
    description: "Explore how pendulum length, angle and gravity affect its motion.",
    concepts: ["Oscillation", "Periodic motion", "Simple harmonic motion"],
    grade: "8-10",
    status: "ready",
    controls: [
      {
        kind: "slider",
        id: "length",
        label: "Pendulum Length",
        min: 0.5,
        max: 3,
        step: 0.05,
        unit: "m",
        defaultValue: DEFAULTS.length,
        group: "Setup",
      },
      {
        kind: "slider",
        id: "gravity",
        label: "Gravity",
        min: 1,
        max: 20,
        step: 0.01,
        unit: "m/s²",
        defaultValue: DEFAULTS.gravity,
        group: "Environment",
      },
      {
        kind: "slider",
        id: "initialAngle",
        label: "Initial Angle",
        min: 5,
        max: 60,
        step: 1,
        unit: "°",
        defaultValue: DEFAULTS.initialAngle,
        group: "Setup",
      },
      {
        kind: "select",
        id: "speed",
        label: "Animation Speed",
        options: [
          { value: "0.25", label: "0.25×" },
          { value: "0.5", label: "0.5×" },
          { value: "1", label: "1×" },
          { value: "2", label: "2×" },
        ],
        defaultValue: String(DEFAULTS.speed),
        group: "Environment",
      },
      {
        kind: "checkbox",
        id: "showMeasurements",
        label: "Show measurements",
        defaultValue: DEFAULTS.showMeasurements,
        group: "Display",
      },
    ],
    graph: {
      title: "Angle vs time",
      xLabel: "Time (s)",
      yLabel: "Angle (°)",
      series: [{ id: "angle", label: "Angle", colorToken: 1 }],
      window: GRAPH_WINDOW,
    },
    explanation: {
      whatsHappening:
        "The bob accelerates toward the lowest point under gravity, then continues past it because of inertia. The motion repeats as energy transfers between gravitational potential and kinetic energy.",
      keyConcept:
        "For the simple pendulum model, the period is set by length and gravitational acceleration. The bob's mass does not change the period.",
      formula: "T = 2π √(L / g)",
    },
    aspectRatio: 4 / 3,
    mount(context: MountContext): SimulationInstance {
      const { container, host } = context;
      let params = { ...context.params };
      let length = numberParam(params, "length", DEFAULTS.length);
      let gravity = numberParam(params, "gravity", DEFAULTS.gravity);
      let initialAngle = numberParam(params, "initialAngle", DEFAULTS.initialAngle);
      let speed = numberParam(params, "speed", DEFAULTS.speed);
      let showMeasurements = booleanParam(params, "showMeasurements", DEFAULTS.showMeasurements);
      let theta = (initialAngle * Math.PI) / 180;
      let angularVelocity = 0;
      let elapsed = 0;
      let accumulator = 0;
      let uiAccumulator = 0;
      let lastTimestamp = performance.now();
      let animationFrame = 0;
      let running = false;
      let oscillations = 0;
      let previousSign = Math.sign(theta) || 1;
      let previousAngularVelocity = angularVelocity;
      let measuredPeriod: number | null = null;
      let peakTimes: number[] = [];
      let width = 800;
      let height = 600;
      let trail: Array<{ x: number; y: number }> = [];

      const root = document.createElement("div");
      root.className = "absolute inset-0 overflow-hidden";
      container.replaceChildren(root);

      const svg = createSvgElement("svg", {
        viewBox: "0 0 800 600",
        role: "img",
        "aria-label": "Interactive pendulum simulation",
        class: "h-full w-full",
        preserveAspectRatio: "xMidYMid meet",
      });
      const defs = createSvgElement("defs", {});
      const gradient = createSvgElement("linearGradient", {
        id: "pendulum-bg",
        x1: "0",
        y1: "0",
        x2: "0",
        y2: "1",
      });
      gradient.append(
        createSvgElement("stop", { offset: "0%", "stop-color": "#0a1b25" }),
        createSvgElement("stop", { offset: "100%", "stop-color": "#071017" }),
      );
      const glow = createSvgElement("filter", {
        id: "pendulum-glow",
        x: "-50%",
        y: "-50%",
        width: "200%",
        height: "200%",
      });
      glow.append(createSvgElement("feGaussianBlur", { stdDeviation: "5", result: "blur" }));
      const gridPattern = createSvgElement("pattern", {
        id: "pendulum-grid",
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
      defs.append(gradient, glow, gridPattern);
      svg.append(defs);

      const background = createSvgElement("rect", {
        width: "800",
        height: "600",
        fill: "url(#pendulum-bg)",
      });
      const grid = createSvgElement("rect", {
        width: "800",
        height: "600",
        fill: "url(#pendulum-grid)",
      });
      const halo = createSvgElement("circle", {
        cx: "400",
        cy: "300",
        r: "210",
        fill: "#36c8ff",
        "fill-opacity": "0.055",
        filter: "url(#pendulum-glow)",
      });
      const referenceLine = createSvgElement("line", {
        x1: "400",
        y1: "106",
        x2: "400",
        y2: "520",
        stroke: "#8bc8d8",
        "stroke-opacity": "0.28",
        "stroke-dasharray": "5 8",
        "stroke-width": "2",
      });
      const angleArc = createSvgElement("path", {
        fill: "none",
        stroke: "#e2a84a",
        "stroke-width": "3",
        "stroke-linecap": "round",
      });
      const maxArc = createSvgElement("path", {
        fill: "none",
        stroke: "#e2a84a",
        "stroke-opacity": "0.35",
        "stroke-dasharray": "3 6",
        "stroke-width": "2",
      });
      const trailPath = createSvgElement("path", {
        fill: "none",
        stroke: "#46d2ff",
        "stroke-opacity": "0.36",
        "stroke-width": "2",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      const pivotRail = createSvgElement("line", {
        x1: "360",
        y1: "106",
        x2: "440",
        y2: "106",
        stroke: "#a9d7df",
        "stroke-opacity": "0.55",
        "stroke-width": "5",
        "stroke-linecap": "round",
      });
      const pivot = createSvgElement("circle", { cx: "400", cy: "106", r: "8", fill: "#f0c36a" });
      const rod = createSvgElement("line", {
        stroke: "#b7dbe2",
        "stroke-width": "5",
        "stroke-linecap": "round",
      });
      const rodGlow = createSvgElement("line", {
        stroke: "#41c8ef",
        "stroke-opacity": "0.22",
        "stroke-width": "13",
        "stroke-linecap": "round",
        filter: "url(#pendulum-glow)",
      });
      const bobGlow = createSvgElement("circle", {
        fill: "#39cfff",
        "fill-opacity": "0.36",
        filter: "url(#pendulum-glow)",
      });
      const bob = createSvgElement("circle", {
        fill: "#39cfff",
        stroke: "#d8f7ff",
        "stroke-width": "3",
      });
      const bobCore = createSvgElement("circle", { fill: "#e7fbff", "fill-opacity": "0.82" });
      const labels = createSvgElement("g", {
        fill: "#b6dce3",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": "12",
        "letter-spacing": "1.4",
      });
      const pivotLabel = createSvgElement("text", { x: "416", y: "92" });
      pivotLabel.textContent = "PIVOT";
      const lengthLabel = createSvgElement("text", { x: "418", y: "306" });
      lengthLabel.textContent = "L";
      const angleLabel = createSvgElement("text", { x: "448", y: "145", fill: "#e2a84a" });
      angleLabel.textContent = "θ";
      const measurements = createSvgElement("g", {
        fill: "#d8f7ff",
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
      });
      const infoTitle = createSvgElement("text", {
        x: "32",
        y: "46",
        fill: "#78dcf5",
        "font-size": "13",
        "letter-spacing": "3",
      });
      infoTitle.textContent = "PENDULUM / LIVE MODEL";
      const infoLine1 = createSvgElement("text", { x: "32", y: "76", "font-size": "12" });
      const infoLine2 = createSvgElement("text", { x: "32", y: "98", "font-size": "12" });
      const infoLine3 = createSvgElement("text", { x: "32", y: "120", "font-size": "12" });
      const infoLine4 = createSvgElement("text", {
        x: "32",
        y: "142",
        "font-size": "12",
        fill: "#f1c66b",
      });
      const currentReadout = createSvgElement("text", {
        x: "620",
        y: "548",
        "font-size": "12",
        fill: "#d8f7ff",
        "text-anchor": "end",
      });
      const statusReadout = createSvgElement("text", {
        x: "32",
        y: "548",
        "font-size": "11",
        fill: "#8bb4bd",
        "letter-spacing": "1.2",
      });
      labels.append(pivotLabel, lengthLabel, angleLabel);
      measurements.append(
        infoTitle,
        infoLine1,
        infoLine2,
        infoLine3,
        infoLine4,
        currentReadout,
        statusReadout,
      );
      svg.append(
        background,
        grid,
        halo,
        referenceLine,
        maxArc,
        trailPath,
        pivotRail,
        rodGlow,
        rod,
        pivot,
        bobGlow,
        bob,
        bobCore,
        angleArc,
        labels,
        measurements,
      );
      root.append(svg);

      function currentBob(lengthValue = length, angleValue = theta) {
        // Fixed pixels-per-metre preserves 0.5 m < 1 m < 2 m < 3 m ratios.
        // The 3 m maximum fits the fixed SVG viewBox without auto-scaling each run.
        const scale = 120 * lengthValue;
        const pivotX = 400;
        const pivotY = 106;
        return {
          x: pivotX + scale * Math.sin(angleValue),
          y: pivotY + scale * Math.cos(angleValue),
          pivotX,
          pivotY,
          scale,
        };
      }

      function updateMeasurements() {
        const calculatedPeriod = periodFor(length, gravity);
        const period = measuredPeriod ?? calculatedPeriod;
        const frequency = 1 / period;
        host.publishMeasurements([
          { id: "length", label: "Length", value: length, unit: "m", precision: 2 },
          { id: "gravity", label: "Gravity", value: gravity, unit: "m/s²", precision: 2 },
          {
            id: "initial-angle",
            label: "Initial angle",
            value: initialAngle,
            unit: "°",
            precision: 0,
          },
          {
            id: "period",
            label: "Period (T)",
            value: period,
            unit: "s",
            precision: 2,
            emphasis: true,
          },
          {
            id: "frequency",
            label: "Frequency (f)",
            value: frequency,
            unit: "Hz",
            precision: 2,
            emphasis: true,
          },
          {
            id: "current-angle",
            label: "Current angle",
            value: degrees(theta),
            unit: "°",
            precision: 1,
          },
          { id: "current-time", label: "Current time", value: elapsed, unit: "s", precision: 2 },
          {
            id: "oscillations",
            label: "Oscillation count",
            value: oscillations,
            unit: "cycles",
            precision: 0,
          },
        ]);
        host.publishExplanation({
          whatsHappening: `The bob is ${Math.abs(degrees(theta)) < 1 ? "near its equilibrium point" : theta > 0 ? "moving to the right of equilibrium" : "moving to the left of equilibrium"}. Its calculated period is ${formatNumber(period)} s for L = ${formatNumber(length)} m and g = ${formatNumber(gravity)} m/s².`,
        });
      }

      function updateReadout() {
        const period = measuredPeriod ?? periodFor(length, gravity);
        const frequency = 1 / period;
        infoLine1.textContent = `LENGTH       ${formatNumber(length)} m`;
        infoLine2.textContent = `GRAVITY      ${formatNumber(gravity)} m/s²`;
        infoLine3.textContent = `INITIAL θ    ${formatNumber(initialAngle, 0)}°`;
        infoLine4.textContent = `PERIOD       ${formatNumber(period)} s  /  ${formatNumber(frequency)} Hz`;
        currentReadout.textContent = `ANGLE ${formatNumber(degrees(theta), 1)}°   TIME ${formatNumber(elapsed, 2)} s   CYCLES ${oscillations}`;
        statusReadout.textContent = running
          ? "● RUNNING / NUMERICAL INTEGRATION"
          : "Ⅱ PAUSED / READY TO RUN";
        measurements.setAttribute("opacity", showMeasurements ? "1" : "0");
        referenceLine.setAttribute("opacity", showMeasurements ? "1" : "0.22");
        maxArc.setAttribute("opacity", showMeasurements ? "1" : "0");
        lengthLabel.setAttribute("opacity", showMeasurements ? "1" : "0");
        angleLabel.setAttribute("opacity", showMeasurements ? "1" : "0");
      }

      function updateVisuals() {
        const bobState = currentBob();
        const maxState = currentBob(length, (initialAngle * Math.PI) / 180);
        rod.setAttribute("x1", String(bobState.pivotX));
        rod.setAttribute("y1", String(bobState.pivotY));
        rod.setAttribute("x2", String(bobState.x));
        rod.setAttribute("y2", String(bobState.y));
        rodGlow.setAttribute("x1", String(bobState.pivotX));
        rodGlow.setAttribute("y1", String(bobState.pivotY));
        rodGlow.setAttribute("x2", String(bobState.x));
        rodGlow.setAttribute("y2", String(bobState.y));
        bob.setAttribute("cx", String(bobState.x));
        bob.setAttribute("cy", String(bobState.y));
        bob.setAttribute("r", "18");
        bobGlow.setAttribute("cx", String(bobState.x));
        bobGlow.setAttribute("cy", String(bobState.y));
        bobGlow.setAttribute("r", "34");
        bobCore.setAttribute("cx", String(bobState.x - 5));
        bobCore.setAttribute("cy", String(bobState.y - 6));
        bobCore.setAttribute("r", "4");
        const startAngle = -Math.PI / 2;
        const currentArc = Math.max(0.01, Math.abs(theta));
        const arcRadius = 54;
        const arcEndX = bobState.pivotX + arcRadius * Math.sin(theta);
        const arcEndY = bobState.pivotY + arcRadius * Math.cos(theta);
        const sweep = theta >= 0 ? 1 : 0;
        angleArc.setAttribute(
          "d",
          `M ${bobState.pivotX} ${bobState.pivotY + arcRadius} A ${arcRadius} ${arcRadius} 0 ${currentArc > Math.PI ? 1 : 0} ${sweep} ${arcEndX} ${arcEndY}`,
        );
        const maxEndX = maxState.pivotX + arcRadius * Math.sin((initialAngle * Math.PI) / 180);
        const maxEndY = maxState.pivotY + arcRadius * Math.cos((initialAngle * Math.PI) / 180);
        maxArc.setAttribute(
          "d",
          `M ${maxState.pivotX} ${maxState.pivotY + arcRadius} A ${arcRadius} ${arcRadius} 0 0 1 ${maxEndX} ${maxEndY}`,
        );
        lengthLabel.setAttribute("x", String((bobState.pivotX + bobState.x) / 2 + 12));
        lengthLabel.setAttribute("y", String((bobState.pivotY + bobState.y) / 2));
        angleLabel.setAttribute("x", String(bobState.pivotX + 66 * Math.sin(theta) + 8));
        angleLabel.setAttribute("y", String(bobState.pivotY + 66 * Math.cos(theta)));
        if (showMeasurements && trail.length > 1) {
          trailPath.setAttribute(
            "d",
            trail
              .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
              .join(" "),
          );
        } else {
          trailPath.setAttribute("d", "");
        }
        updateReadout();
      }

      function publishGraph() {
        const sample: GraphSample = { x: elapsed, angle: degrees(theta) };
        host.publishGraphSample(sample);
      }

      function integrate(step: number) {
        const acceleration = -(gravity / length) * Math.sin(theta);
        angularVelocity += acceleration * step;
        theta += angularVelocity * step;
        elapsed += step;
        const sign = Math.sign(theta) || previousSign;
        if (sign !== previousSign && sign !== 0) oscillations += 0.5;
        previousSign = sign;
        if (previousAngularVelocity > 0 && angularVelocity <= 0 && theta > 0) {
          peakTimes.push(elapsed);
          if (peakTimes.length > 1) {
            const latestPeak = peakTimes[peakTimes.length - 1];
            const previousPeak = peakTimes[peakTimes.length - 2];
            if (latestPeak !== undefined && previousPeak !== undefined) {
              measuredPeriod = latestPeak - previousPeak;
            }
          }
          if (peakTimes.length > 3) peakTimes.shift();
        }
        previousAngularVelocity = angularVelocity;
        const bobState = currentBob();
        if (showMeasurements) {
          trail.push({ x: bobState.x, y: bobState.y });
          if (trail.length > 90) trail.shift();
        }
      }

      function frame(timestamp: number) {
        const frameSeconds = Math.min(
          MAX_FRAME_STEP,
          Math.max(0, (timestamp - lastTimestamp) / 1000),
        );
        lastTimestamp = timestamp;
        if (running) {
          accumulator += frameSeconds * speed;
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
        updateVisuals();
        animationFrame = requestAnimationFrame(frame);
      }

      function resetState() {
        theta = (initialAngle * Math.PI) / 180;
        angularVelocity = 0;
        elapsed = 0;
        accumulator = 0;
        uiAccumulator = 0;
        oscillations = 0;
        previousSign = Math.sign(theta) || 1;
        previousAngularVelocity = angularVelocity;
        measuredPeriod = null;
        peakTimes = [];
        trail = [];
        host.replaceGraphData([]);
        updateMeasurements();
        updateVisuals();
      }

      updateMeasurements();
      updateVisuals();
      animationFrame = requestAnimationFrame(frame);

      return {
        start() {
          running = true;
          lastTimestamp = performance.now();
          host.setRunning(true);
          updateReadout();
        },
        pause() {
          running = false;
          host.setRunning(false);
          updateReadout();
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
          if (id === "length" && typeof value === "number") {
            length = value;
            measuredPeriod = null;
            peakTimes = [];
          }
          if (id === "gravity" && typeof value === "number") {
            gravity = value;
            measuredPeriod = null;
            peakTimes = [];
          }
          if (id === "initialAngle" && typeof value === "number") {
            initialAngle = value;
            measuredPeriod = null;
            peakTimes = [];
            if (!running) {
              theta = (initialAngle * Math.PI) / 180;
              previousAngularVelocity = 0;
            }
          }
          if (id === "speed" && typeof value === "string") speed = Number(value) || DEFAULTS.speed;
          if (id === "showMeasurements" && typeof value === "boolean") showMeasurements = value;
          if (
            id === "length" ||
            id === "gravity" ||
            id === "initialAngle" ||
            id === "showMeasurements"
          ) {
            updateMeasurements();
            updateVisuals();
          }
        },
        setParams(nextParams: SimulationParams) {
          params = { ...nextParams };
          length = numberParam(params, "length", DEFAULTS.length);
          gravity = numberParam(params, "gravity", DEFAULTS.gravity);
          initialAngle = numberParam(params, "initialAngle", DEFAULTS.initialAngle);
          measuredPeriod = null;
          peakTimes = [];
          speed = numberParam(params, "speed", DEFAULTS.speed);
          showMeasurements = booleanParam(params, "showMeasurements", DEFAULTS.showMeasurements);
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

export const physicsPendulum = createPendulumModule();
