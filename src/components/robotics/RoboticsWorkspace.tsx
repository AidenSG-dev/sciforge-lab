import {
  CircuitBoard,
  Cpu,
  Gauge,
  Lightbulb,
  Microchip,
  Move,
  Radio,
  Route,
  Zap,
} from "lucide-react";
import type { SimulationModule } from "@/simulations/types";
import { SimulationWorkspace } from "@/components/simulation/SimulationWorkspace";

const parts = [
  { label: "Arduino", icon: Cpu },
  { label: "LED", icon: Lightbulb },
  { label: "Resistor", icon: Gauge },
  { label: "Motor", icon: Move },
  { label: "Sensor", icon: Radio },
  { label: "Battery", icon: Zap },
  { label: "Button", icon: CircuitBoard },
];

export function RoboticsWorkspace({ module }: { module: SimulationModule }) {
  return (
    <div data-subject="robotics">
      <SimulationWorkspace module={module} />
      <section className="container -mt-4 pb-12">
        <div className="panel overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Microchip className="size-4 text-subject" />
              <p className="panel-label">Robotics integration surface</p>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              architecture preview
            </span>
          </header>
          <div className="grid lg:grid-cols-[14rem_1fr_18rem]">
            <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
              <p className="panel-label">Components</p>
              <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
                {parts.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-3 text-left text-sm text-muted-foreground transition-colors hover:border-subject/50 hover:text-foreground"
                  >
                    <Icon className="size-4 text-subject" />
                    {label}
                  </button>
                ))}
              </div>
            </aside>
            <div className="relative min-h-72 overflow-hidden border-b border-border bg-background/50 p-5 lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 lab-grid opacity-50" />
              <div className="relative flex h-full min-h-64 flex-col items-center justify-center text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-full border border-subject/35 bg-subject/10 text-subject">
                  <CircuitBoard className="size-7" />
                </div>
                <p className="font-display text-lg font-semibold">Build area</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Drag-and-drop circuit or robot components will be hosted here when the robotics
                  module is connected.
                </p>
              </div>
            </div>
            <aside className="p-4">
              <div className="flex items-center gap-2">
                <Route className="size-4 text-subject" />
                <p className="panel-label">Program / logic</p>
              </div>
              <div className="mt-4 rounded-md border border-dashed border-border bg-background p-4 font-mono text-xs leading-7 text-muted-foreground">
                <span className="text-subject">// logic slot</span>
                <br />
                when sensor.detects()
                <br />
                &nbsp;&nbsp;choose action()
                <br />
                &nbsp;&nbsp;update motors()
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
