import * as placeholders from "../placeholders/modules";
import { physicsPendulum } from "../modules/physics-pendulum";
import { physicsBuoyancy } from "../modules/physics-buoyancy";
import { chemistryStates } from "../modules/chemistry-states-of-matter";
import { chemistryBonding } from "../modules/chemistry-bonding";
import { roboticsCircuit } from "../modules/robotics-circuit";
import { biologyHeart } from "../modules/biology-heart";
import type { SimulationModule, SubjectId } from "../types";

/**
 * Central simulation registry.
 * ---------------------------------------------------------------------------
 * The UI resolves every simulation through this map. To ship a real
 * simulation, import your module and replace the placeholder entry — the
 * SimulationWorkspace needs no changes.
 *
 *   import { pendulum } from "../modules/physics-pendulum";
 *   "physics-pendulum": pendulum,
 */
const modules: SimulationModule[] = [
  physicsPendulum,
  physicsBuoyancy,
  chemistryStates,
  chemistryBonding,
  biologyHeart,
  placeholders.biologyCell,
  roboticsCircuit,
];

const registry = new Map<string, SimulationModule>(modules.map((m) => [m.id, m]));

export function getSimulation(id: string): SimulationModule | undefined {
  return registry.get(id);
}

export function listSimulations(): SimulationModule[] {
  return [...registry.values()];
}

export function listSimulationsBySubject(subject: SubjectId): SimulationModule[] {
  return listSimulations().filter((m) => m.subject === subject);
}

/** Register or replace a module at runtime (used by future module bundles). */
export function registerSimulation(module: SimulationModule): void {
  registry.set(module.id, module);
}
