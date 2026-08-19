import { Atom, FlaskConical, HeartPulse, Cpu, type LucideIcon } from "lucide-react";
import type { SubjectId } from "@/simulations/types";

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  tagline: string;
  topics: string;
  intro: string;
  icon: LucideIcon;
  /** Route path for the subject page. */
  path: "/physics" | "/chemistry" | "/biology" | "/robotics";
}

export const SUBJECTS: SubjectMeta[] = [
  {
    id: "physics",
    name: "Physics",
    tagline: "Motion • Forces • Electricity • Light",
    topics: "Motion, forces, electricity, light",
    intro: "Explore the laws that govern the physical world.",
    icon: Atom,
    path: "/physics",
  },
  {
    id: "chemistry",
    name: "Chemistry",
    tagline: "Matter • Reactions • Bonding",
    topics: "Matter, reactions, bonding",
    intro: "Investigate how matter behaves, changes and combines.",
    icon: FlaskConical,
    path: "/chemistry",
  },
  {
    id: "biology",
    name: "Biology",
    tagline: "Cells • Systems • Life",
    topics: "Cells, systems, life",
    intro: "Look inside living systems and see how they keep working.",
    icon: HeartPulse,
    path: "/biology",
  },
  {
    id: "robotics",
    name: "Robotics",
    tagline: "Circuits • Sensors • Automation",
    topics: "Circuits, sensors, automation",
    intro: "Build circuits and program machines that respond to the world.",
    icon: Cpu,
    path: "/robotics",
  },
];

export function getSubject(id: SubjectId): SubjectMeta {
  return SUBJECTS.find((s) => s.id === id)!;
}
