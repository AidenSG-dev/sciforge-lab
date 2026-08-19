import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { ParamValue, SimulationControl, SimulationParams } from "@/simulations/types";

interface SimulationControlsProps {
  controls: SimulationControl[];
  params: SimulationParams;
  disabled?: boolean;
  running: boolean;
  onParamChange(id: string, value: ParamValue): void;
  onAction(actionId: string): void;
  onStart(): void;
  onPause(): void;
  onReset(): void;
}

/**
 * Renders whatever controls a simulation module declares. Nothing here is
 * simulation-specific: add a new control kind to the `SimulationControl` union
 * and handle it below.
 */
export function SimulationControls({
  controls,
  params,
  disabled,
  running,
  onParamChange,
  onAction,
  onStart,
  onPause,
  onReset,
}: SimulationControlsProps) {
  const groups = groupControls(controls);

  return (
    <section className="panel flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="panel-label">Experiment</h2>
        <span className="font-mono text-[11px] text-muted-foreground">
          {running ? "RUNNING" : "PAUSED"}
        </span>
      </header>

      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled}
          onClick={running ? onPause : onStart}
          className="flex-1 bg-subject/15 text-foreground hover:bg-subject/25"
        >
          {running ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          {running ? "Pause" : "Play"}
        </Button>
        <Button size="sm" variant="outline" onClick={onReset} disabled={disabled}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
        {groups.map(([group, items]) => (
          <div key={group} className="space-y-5">
            {group !== "_" && <p className="panel-label">{group}</p>}
            {items.map((control) => (
              <ControlField
                key={control.id}
                control={control}
                value={params[control.id]}
                disabled={disabled}
                onParamChange={onParamChange}
                onAction={onAction}
              />
            ))}
          </div>
        ))}
        {controls.length === 0 && (
          <p className="text-sm text-muted-foreground">
            This simulation declares no controls yet.
          </p>
        )}
      </div>
    </section>
  );
}

function ControlField({
  control,
  value,
  disabled,
  onParamChange,
  onAction,
}: {
  control: SimulationControl;
  value: ParamValue | undefined;
  disabled?: boolean;
  onParamChange(id: string, value: ParamValue): void;
  onAction(actionId: string): void;
}) {
  const id = `control-${control.id}`;

  switch (control.kind) {
    case "slider": {
      const current = typeof value === "number" ? value : control.defaultValue;
      return (
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor={id} className="text-sm font-normal text-foreground">
              {control.label}
            </Label>
            <span className="font-mono text-xs text-subject">
              {formatNumber(current)}
              {control.unit ? ` ${control.unit}` : ""}
            </span>
          </div>
          <Slider
            id={id}
            disabled={disabled}
            min={control.min}
            max={control.max}
            step={control.step ?? 0.1}
            value={[current]}
            onValueChange={([next]) => onParamChange(control.id, next)}
            className="[&_[data-slot=slider-range]]:bg-subject [&_[data-slot=slider-thumb]]:border-subject"
          />
          {control.hint && <p className="text-xs text-muted-foreground">{control.hint}</p>}
        </div>
      );
    }
    case "number": {
      const current = typeof value === "number" ? value : control.defaultValue;
      return (
        <div className="space-y-2">
          <Label htmlFor={id} className="text-sm font-normal text-foreground">
            {control.label}
            {control.unit ? <span className="text-muted-foreground"> ({control.unit})</span> : null}
          </Label>
          <Input
            id={id}
            type="number"
            disabled={disabled}
            min={control.min}
            max={control.max}
            step={control.step ?? 1}
            value={current}
            onChange={(e) => onParamChange(control.id, Number(e.target.value))}
            className="h-9 bg-background font-mono text-xs"
          />
        </div>
      );
    }
    case "toggle": {
      const current = typeof value === "boolean" ? value : control.defaultValue;
      return (
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor={id} className="text-sm font-normal text-foreground">
            {control.label}
          </Label>
          <Switch
            id={id}
            disabled={disabled}
            checked={current}
            onCheckedChange={(next) => onParamChange(control.id, next)}
            className="data-[state=checked]:bg-subject"
          />
        </div>
      );
    }
    case "checkbox": {
      const current = typeof value === "boolean" ? value : control.defaultValue;
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            id={id}
            disabled={disabled}
            checked={current}
            onCheckedChange={(next) => onParamChange(control.id, next === true)}
            className="data-[state=checked]:border-subject data-[state=checked]:bg-subject"
          />
          <Label htmlFor={id} className="text-sm font-normal text-foreground">
            {control.label}
          </Label>
        </div>
      );
    }
    case "select": {
      const current = typeof value === "string" ? value : control.defaultValue;
      return (
        <div className="space-y-2">
          <Label htmlFor={id} className="text-sm font-normal text-foreground">
            {control.label}
          </Label>
          <Select
            disabled={disabled}
            value={current}
            onValueChange={(next) => onParamChange(control.id, next)}
          >
            <SelectTrigger id={id} className="h-9 w-full bg-background text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {control.options.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    case "button":
      return (
        <Button
          variant={control.variant === "outline" ? "outline" : "secondary"}
          size="sm"
          disabled={disabled}
          onClick={() => onAction(control.actionId)}
          className={
            control.variant === "subject"
              ? "w-full bg-subject/15 text-foreground hover:bg-subject/25"
              : "w-full"
          }
        >
          {control.label}
        </Button>
      );
  }
}

function groupControls(controls: SimulationControl[]): Array<[string, SimulationControl[]]> {
  const map = new Map<string, SimulationControl[]>();
  for (const control of controls) {
    const key = control.group ?? "_";
    map.set(key, [...(map.get(key) ?? []), control]);
  }
  return [...map.entries()];
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
}
