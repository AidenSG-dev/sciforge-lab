import type {
  MountContext,
  ParamValue,
  SimulationInstance,
  SimulationModule,
  SimulationParams,
} from "../types";

const DEFAULTS = { supplyVoltage: 5, view: "physical", showCurrent: true } as const;
type ViewMode = "physical" | "diagram";
type Kind =
  | "battery"
  | "switch"
  | "bulb"
  | "resistor"
  | "variable"
  | "ammeter"
  | "voltmeter"
  | "fuse"
  | "terminal";
interface Node {
  id: number;
  kind: Kind;
  x: number;
  y: number;
  rotation: number;
  closed: boolean;
  resistance: number;
}
interface Wire {
  id: number;
  a: { node: number; terminal: number };
  b: { node: number; terminal: number };
}
const library: Array<{ kind: Kind | "wire"; label: string; symbol: string }> = [
  { kind: "battery", label: "Cell / Battery", symbol: "▯" },
  { kind: "switch", label: "Switch", symbol: "⌁" },
  { kind: "bulb", label: "Bulb", symbol: "◉" },
  { kind: "resistor", label: "Resistor", symbol: "▱" },
  { kind: "variable", label: "Variable resistor", symbol: "↗▱" },
  { kind: "ammeter", label: "Ammeter", symbol: "A" },
  { kind: "voltmeter", label: "Voltmeter", symbol: "V" },
  { kind: "fuse", label: "Fuse", symbol: "—▣—" },
  { kind: "terminal", label: "Open terminal", symbol: "○" },
  { kind: "wire", label: "Connecting wire", symbol: "╱" },
];
function num(p: SimulationParams, id: string, f: number) {
  return typeof p[id] === "number" && Number.isFinite(p[id]) ? p[id] : f;
}
function bool(p: SimulationParams, id: string, f: boolean) {
  return typeof p[id] === "boolean" ? p[id] : f;
}
function str(p: SimulationParams, id: string, f: string) {
  return typeof p[id] === "string" ? p[id] : f;
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string>) {
  const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  return n as SVGElementTagNameMap[K];
}

export const roboticsCircuit: SimulationModule = {
  id: "robotics-circuit",
  subject: "robotics",
  title: "Physics Circuits Lab",
  description: "Build, run, measure and modify your own school physics circuit.",
  concepts: ["Closed circuits", "Current", "Ohm's law", "Series and parallel paths"],
  grade: "6-8",
  layout: "robotics",
  status: "ready",
  aspectRatio: 4 / 3,
  controls: [
    {
      kind: "slider",
      id: "supplyVoltage",
      label: "Battery Voltage",
      min: 1.5,
      max: 12,
      step: 0.5,
      unit: "V",
      defaultValue: 5,
      group: "Power",
    },
    {
      kind: "select",
      id: "view",
      label: "Lab view",
      options: [
        { value: "physical", label: "Physical lab" },
        { value: "diagram", label: "Circuit diagram" },
      ],
      defaultValue: "physical",
      group: "Display",
    },
    {
      kind: "checkbox",
      id: "showCurrent",
      label: "Animate current flow",
      defaultValue: true,
      group: "Display",
    },
    {
      kind: "button",
      id: "runExperiment",
      label: "▶ RUN EXPERIMENT",
      actionId: "runExperiment",
      variant: "subject",
      group: "Experiment",
    },
    {
      kind: "button",
      id: "resetCircuit",
      label: "Reset blank workspace",
      actionId: "resetCircuit",
      variant: "outline",
      group: "Experiment",
    },
  ],
  graph: {
    title: "Current vs time",
    xLabel: "Time (s)",
    yLabel: "Current (A)",
    series: [{ id: "current", label: "Current", colorToken: 4 }],
    window: 180,
  },
  explanation: {
    whatsHappening:
      "Start with an empty workspace. Drag components from the library, connect terminals, then run the experiment.",
    keyConcept:
      "A closed conducting path lets current flow from one battery terminal and back to the other.",
    deeperDive:
      "Use Ohm's law, I = V/R, for the simplified school-level model. Series components share one current; parallel branches divide current.",
    formula: "V = I × R",
  },
  mount({ container, host, params: initial }: MountContext): SimulationInstance {
    let params = { ...initial };
    let nodes: Node[] = [];
    let wires: Wire[] = [];
    let nextId = 1;
    let nextWire = 1;
    let running = false;
    let elapsed = 0;
    let last = performance.now();
    let raf = 0;
    let graphClock = 0;
    let selectedTerminal: { node: number; terminal: number } | null = null;
    let drag: { node: number; dx: number; dy: number } | null = null;
    let width = 800;
    let height = 600;
    const root = document.createElement("div");
    root.className = "absolute inset-0 overflow-hidden";
    container.replaceChildren(root);
    const scene = svg("svg", {
      viewBox: "0 0 1000 680",
      class: "h-full w-full",
      role: "img",
      "aria-label": "Build your own school physics circuit",
    });
    root.append(scene);
    const defs = svg("defs", {});
    const bg = svg("linearGradient", { id: "lab-bg", x1: "0", y1: "0", x2: "0", y2: "1" });
    bg.append(
      svg("stop", { offset: "0%", "stop-color": "#101d35" }),
      svg("stop", { offset: "100%", "stop-color": "#070c17" }),
    );
    const grid = svg("pattern", {
      id: "lab-grid",
      width: "32",
      height: "32",
      patternUnits: "userSpaceOnUse",
    });
    grid.append(
      svg("path", { d: "M32 0H0V32", fill: "none", stroke: "#8dbbe0", "stroke-opacity": "0.08" }),
    );
    const glow = svg("filter", {
      id: "lab-glow",
      x: "-100%",
      y: "-100%",
      width: "300%",
      height: "300%",
    });
    glow.append(svg("feGaussianBlur", { stdDeviation: "7" }));
    defs.append(bg, grid, glow);
    scene.append(
      defs,
      svg("rect", { width: "1000", height: "680", fill: "url(#lab-bg)" }),
      svg("rect", { width: "1000", height: "680", fill: "url(#lab-grid)" }),
    );
    const wireLayer = svg("g", {}),
      flowLayer = svg("g", {}),
      nodeLayer = svg("g", {}),
      uiLayer = svg("g", {});
    scene.append(wireLayer, flowLayer, nodeLayer, uiLayer);
    const label = (
      x: number,
      y: number,
      s: string,
      fill = "#dff8ff",
      size = 12,
      anchor = "start",
    ) => {
      const t = svg("text", {
        x: String(x),
        y: String(y),
        fill,
        "font-family": "ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-size": String(size),
        "text-anchor": anchor,
      });
      t.textContent = s;
      return t;
    };
    function add(kind: Kind, x: number, y: number) {
      const n: Node = {
        id: nextId++,
        kind,
        x,
        y,
        rotation: 0,
        closed: kind !== "switch" || true,
        resistance:
          kind === "resistor"
            ? 100
            : kind === "variable"
              ? 220
              : kind === "bulb"
                ? 80
                : kind === "fuse"
                  ? 10
                  : 0,
      };
      nodes.push(n);
      draw();
      return n;
    }
    function reset() {
      nodes = [];
      wires = [];
      nextId = 1;
      nextWire = 1;
      selectedTerminal = null;
      running = false;
      elapsed = 0;
      host.replaceGraphData([]);
      host.setRunning(false);
      publish();
      draw();
    }
    function nodeBy(id: number) {
      return nodes.find((n) => n.id === id);
    }
    function terminals(n: Node) {
      return [
        { x: n.x - 34, y: n.y },
        { x: n.x + 34, y: n.y },
      ];
    }
    function connected(
      a: { node: number; terminal: number },
      b: { node: number; terminal: number },
    ) {
      return wires.some(
        (w) =>
          (w.a.node === a.node &&
            w.a.terminal === a.terminal &&
            w.b.node === b.node &&
            w.b.terminal === b.terminal) ||
          (w.b.node === a.node &&
            w.b.terminal === a.terminal &&
            w.a.node === b.node &&
            w.a.terminal === b.terminal),
      );
    }
    function attach(a: { node: number; terminal: number }, b: { node: number; terminal: number }) {
      if (a.node === b.node || connected(a, b)) return;
      wires.push({ id: nextWire++, a, b });
      selectedTerminal = null;
      draw();
    }
    function componentResistance(n: Node) {
      return n.resistance ?? 0;
    }
    function analyze() {
      const battery = nodes.find((n) => n.kind === "battery");
      const bulbs = nodes.filter((n) => n.kind === "bulb");
      const switches = nodes.filter((n) => n.kind === "switch");
      const fuse = nodes.find((n) => n.kind === "fuse");
      const hasOpenSwitch = switches.some((n) => n.closed === false);
      const hasInsufficient = !battery || bulbs.length === 0 || hasOpenSwitch || !wires.length;
      const resistance = nodes
        .filter((n) => ["bulb", "resistor", "variable", "fuse"].includes(n.kind))
        .reduce((a, n) => a + componentResistance(n), 1);
      const voltage = num(params, "supplyVoltage", 5);
      const current =
        hasInsufficient || (fuse && voltage / resistance > 0.08) ? 0 : voltage / resistance;
      const fuseBlown = Boolean(fuse && voltage / resistance > 0.08);
      return {
        battery,
        bulbs,
        switches,
        fuse,
        voltage,
        resistance,
        current,
        closed: current > 0 && !fuseBlown,
        fuseBlown,
      };
    }
    function publish() {
      const a = analyze();
      host.publishMeasurements([
        {
          id: "state",
          label: "Circuit state",
          value: a.closed ? "CLOSED" : "OPEN",
          emphasis: true,
        },
        { id: "voltage", label: "Voltage", value: a.voltage, unit: "V", precision: 1 },
        { id: "current", label: "Current", value: a.current, unit: "A", precision: 3 },
        { id: "resistance", label: "Resistance", value: a.resistance, unit: "Ω", precision: 0 },
        { id: "power", label: "Power", value: a.voltage * a.current, unit: "W", precision: 3 },
        { id: "components", label: "Components", value: nodes.length, precision: 0 },
      ]);
      host.publishExplanation({
        whatsHappening: a.closed
          ? "CIRCUIT CLOSED: the built path is complete, so current flows through the components."
          : nodes.length === 0
            ? "Blank workspace: drag a battery, switch and bulb from the component library, then connect their terminals."
            : a.fuseBlown
              ? "FAULT: the simplified fuse limit was exceeded. The fuse opens and current stops."
              : "CIRCUIT OPEN: add wires, close switches and complete a path from battery to battery.",
      });
    }
    function drawComponent(n: Node, a: ReturnType<typeof analyze>, diagram: boolean) {
      const on = a.closed && (n.kind === "bulb" || n.kind === "ammeter");
      const r = n.kind === "battery" ? 28 : 24;
      if (on && !diagram)
        nodeLayer.append(
          svg("circle", {
            cx: String(n.x),
            cy: String(n.y),
            r: "34",
            fill: "#ffd34e",
            "fill-opacity": "0.22",
            filter: "url(#lab-glow)",
          }),
        );
      const stroke = on
        ? "#ffe78b"
        : n.kind === "switch" && n.closed === false
          ? "#ff9a88"
          : "#a6bdd1";
      nodeLayer.append(
        svg("rect", {
          x: String(n.x - r),
          y: String(n.y - r),
          width: String(r * 2),
          height: String(r * 2),
          rx: "12",
          fill: diagram ? "none" : "#102234",
          stroke,
          "stroke-width": "3",
        }),
      );
      let symbol =
        n.kind === "battery"
          ? "CELL"
          : n.kind === "bulb"
            ? "◉"
            : n.kind === "switch"
              ? "⌁"
              : n.kind === "ammeter"
                ? "A"
                : n.kind === "voltmeter"
                  ? "V"
                  : n.kind === "fuse"
                    ? "▣"
                    : n.kind === "variable"
                      ? "R↗"
                      : n.kind === "resistor"
                        ? "R"
                        : "○";
      if (diagram && n.kind === "battery") symbol = "—| |—";
      const t = label(
        n.x,
        n.y + 6,
        symbol,
        on ? "#fff4ad" : "#d8eef7",
        n.kind === "battery" ? 10 : 20,
        "middle",
      );
      nodeLayer.append(t);
      const ts = terminals(n);
      ts.forEach((p, i) => {
        const term = svg("circle", {
          cx: String(p.x),
          cy: String(p.y),
          r: selectedTerminal?.node === n.id && selectedTerminal.terminal === i ? "9" : "6",
          fill:
            selectedTerminal?.node === n.id && selectedTerminal.terminal === i
              ? "#ffd34e"
              : "#8ce8ff",
          stroke: "#07121f",
          "stroke-width": "2",
        });
        term.dataset["node"] = String(n.id);
        term.dataset["terminal"] = String(i);
        nodeLayer.append(term);
      });
      nodeLayer.append(label(n.x, n.y + 45, n.kind.toUpperCase(), "#9bb8c9", 9, "middle"));
    }
    function draw() {
      const a = analyze();
      const diagram = str(params, "view", "physical") === "diagram";
      wireLayer.replaceChildren();
      flowLayer.replaceChildren();
      nodeLayer.replaceChildren();
      uiLayer.replaceChildren();
      const wireStroke = a.closed ? "#83d9ff" : "#66849a";
      wires.forEach((w) => {
        const na = nodeBy(w.a.node),
          nb = nodeBy(w.b.node);
        if (!na || !nb) return;
        const p = terminals(na)[w.a.terminal]!,
          q = terminals(nb)[w.b.terminal]!;
        wireLayer.append(
          svg("line", {
            x1: String(p.x),
            y1: String(p.y),
            x2: String(q.x),
            y2: String(q.y),
            stroke: wireStroke,
            "stroke-width": diagram ? "3" : "6",
            "stroke-linecap": "round",
          }),
        );
      });
      if (a.closed && bool(params, "showCurrent", true))
        wires.forEach((w) => {
          const na = nodeBy(w.a.node),
            nb = nodeBy(w.b.node);
          if (!na || !nb) return;
          const p = terminals(na)[w.a.terminal]!,
            q = terminals(nb)[w.b.terminal]!;
          const f = svg("line", {
            x1: String(p.x),
            y1: String(p.y),
            x2: String(q.x),
            y2: String(q.y),
            stroke: "#fff1a1",
            "stroke-width": "3",
            "stroke-dasharray": "12 12",
            "stroke-linecap": "round",
          });
          f.setAttribute("stroke-dashoffset", String(-elapsed * 45));
          flowLayer.append(f);
        });
      nodes.forEach((n) => drawComponent(n, a, diagram));
      uiLayer.append(
        label(
          28,
          40,
          diagram ? "TEXTBOOK CIRCUIT DIAGRAM" : "PHYSICS CIRCUITS / BUILD LAB",
          "#86eaff",
          14,
        ),
        label(28, 64, "BUILD → RUN → MEASURE → MODIFY", "#bad5e2", 10),
      );
      uiLayer.append(
        svg("rect", {
          x: "725",
          y: "25",
          width: "245",
          height: "42",
          rx: "20",
          fill: "#071321",
          stroke: a.closed ? "#8dffbf" : "#ff9e8c",
          "stroke-width": "2",
        }),
        label(
          847,
          51,
          a.closed ? "CIRCUIT CLOSED" : "CIRCUIT OPEN",
          a.closed ? "#8dffbf" : "#ffae9d",
          12,
          "middle",
        ),
      );
      uiLayer.append(
        svg("rect", {
          x: "18",
          y: "92",
          width: "206",
          height: "558",
          rx: "16",
          fill: "#081421",
          "fill-opacity": "0.92",
          stroke: "#6f9bb4",
          "stroke-opacity": "0.32",
        }),
        label(36, 122, "COMPONENT LIBRARY", "#ffd477", 11),
      );
      library.forEach((item, i) => {
        const y = 150 + i * 45;
        uiLayer.append(
          svg("rect", {
            x: "32",
            y: String(y - 20),
            width: "176",
            height: "34",
            rx: "8",
            fill: "#102437",
            stroke: "#4d7690",
            "stroke-opacity": "0.7",
          }),
          label(48, y + 1, `${item.symbol}  ${item.label}`, "#d7ecf4", 10),
        );
      });
      uiLayer.append(
        label(
          255,
          125,
          "BLANK WORKSPACE · DRAG COMPONENTS HERE · CLICK TWO TERMINALS TO CONNECT",
          "#9fc4d5",
          10,
        ),
      );
      uiLayer.append(
        label(760, 110, `NODES ${nodes.length}  WIRES ${wires.length}`, "#9fc4d5", 10),
      );
    }
    function point(e: MouseEvent) {
      const r = scene.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * 1000,
        y: ((e.clientY - r.top) / r.height) * 680,
      };
    }
    scene.addEventListener("pointerdown", (e) => {
      const p = point(e);
      const target = e.target as SVGElement;
      const nodeId = Number(target.dataset["node"]);
      const terminal = Number(target.dataset["terminal"]);
      if (Number.isFinite(nodeId) && Number.isFinite(terminal)) {
        const item = { node: nodeId, terminal };
        if (!selectedTerminal) selectedTerminal = item;
        else attach(selectedTerminal, item);
        draw();
        return;
      }
      const trayIndex = Math.floor((p.y - 130) / 45);
      if (p.x < 225 && trayIndex >= 0 && trayIndex < library.length) {
        const item = library[trayIndex];
        if (item && item.kind !== "wire") {
          const n = add(item.kind, 330 + (nextId % 4) * 120, 210 + Math.floor(nextId / 4) * 100);
          drag = { node: n.id, dx: 0, dy: 0 };
        }
        return;
      }
      const hit = nodes.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < 32);
      if (hit) drag = { node: hit.id, dx: p.x - hit.x, dy: p.y - hit.y };
    });
    scene.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const p = point(e);
      const n = nodeBy(drag.node);
      if (n) {
        n.x = clamp(p.x - drag.dx, 255, 950);
        n.y = clamp(p.y - drag.dy, 145, 625);
        draw();
      }
    });
    scene.addEventListener("pointerup", () => {
      drag = null;
    });
    scene.addEventListener("dblclick", (e) => {
      const p = point(e);
      const n = nodes.find((x) => Math.hypot(x.x - p.x, x.y - p.y) < 32);
      if (n?.kind === "switch") {
        n.closed = !n.closed;
        publish();
        draw();
      }
    });
    function render(now: number) {
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      if (running) {
        elapsed += dt;
        graphClock += dt;
        if (graphClock > 1 / 12) {
          host.publishGraphSample({ x: elapsed, current: analyze().current });
          graphClock = 0;
        }
      }
      draw();
      raf = requestAnimationFrame(render);
    }
    publish();
    raf = requestAnimationFrame(render);
    return {
      start() {
        running = true;
        host.setRunning(true);
      },
      pause() {
        running = false;
        host.setRunning(false);
      },
      reset,
      resize(w, h) {
        width = w;
        height = h;
        void width;
        void height;
      },
      setParam(id, value) {
        params[id] = value;
        publish();
        draw();
      },
      setParams(next) {
        params = { ...params, ...next };
        publish();
        draw();
      },
      onAction(actionId) {
        if (actionId === "resetCircuit") reset();
        if (actionId === "runExperiment") {
          running = true;
          host.setRunning(true);
          publish();
        }
      },
      destroy() {
        cancelAnimationFrame(raf);
        root.replaceChildren();
      },
    };
  },
};
