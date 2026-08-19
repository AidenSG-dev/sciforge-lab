import { useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SimulationCard } from "./SimulationCard";
import { listSimulations, listSimulationsBySubject } from "@/simulations/registry";
import { SUBJECTS, getSubject } from "@/lib/subjects";
import type { SubjectId } from "@/simulations/types";
import { useUiStore } from "@/stores/uiStore";

export function ExploreContent() {
  const query = useUiStore((state) => state.query);
  const subjectFilter = useUiStore((state) => state.subjectFilter);
  const gradeFilter = useUiStore((state) => state.gradeFilter);
  const conceptFilter = useUiStore((state) => state.conceptFilter);
  const setQuery = useUiStore((state) => state.setQuery);
  const setSubjectFilter = useUiStore((state) => state.setSubjectFilter);
  const setGradeFilter = useUiStore((state) => state.setGradeFilter);
  const setConceptFilter = useUiStore((state) => state.setConceptFilter);
  const simulations = useMemo(
    () =>
      listSimulations().filter(
        (module) =>
          (!query ||
            `${module.title} ${module.description} ${module.concepts.join(" ")}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (subjectFilter === "all" || module.subject === subjectFilter) &&
          (gradeFilter === "all" || module.grade === gradeFilter) &&
          (conceptFilter === "all" ||
            module.concepts.some(
              (concept) => concept.toLowerCase() === conceptFilter.toLowerCase(),
            )),
      ),
    [query, subjectFilter, gradeFilter, conceptFilter],
  );
  const concepts = [...new Set(listSimulations().flatMap((module) => module.concepts))].sort();
  return (
    <div className="subject-tint">
      <main className="container py-12 sm:py-16">
        <header className="max-w-3xl">
          <p className="panel-label text-subject">
            Discovery index / {String(listSimulations().length).padStart(2, "0")} modules
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
            Explore simulations.
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Find a system, tune its variables, and make a testable observation.
          </p>
        </header>
        <section className="panel mt-10 p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search simulations..."
                className="h-10 border-border bg-background pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                aria-label="Subject"
                value={subjectFilter === "all" ? "" : subjectFilter}
                onChange={(event) =>
                  setSubjectFilter((event.target.value || "all") as SubjectId | "all")
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">All subjects</option>
                {SUBJECTS.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Grade"
                value={gradeFilter === "all" ? "" : gradeFilter}
                onChange={(event) =>
                  setGradeFilter((event.target.value || "all") as "all" | "6-8" | "8-10" | "9-12")
                }
                className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">All grades</option>
                <option value="6-8">Grades 6–8</option>
                <option value="8-10">Grades 8–10</option>
                <option value="9-12">Grades 9–12</option>
              </select>
              <select
                aria-label="Concept"
                value={conceptFilter === "all" ? "" : conceptFilter}
                onChange={(event) => setConceptFilter(event.target.value || "all")}
                className="h-10 max-w-48 rounded-md border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="">All concepts</option>
                {concepts.map((concept) => (
                  <option key={concept} value={concept}>
                    {concept}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="size-3.5 text-subject" /> {simulations.length} simulation
            {simulations.length === 1 ? "" : "s"} match your filters.
          </div>
        </section>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {simulations.map((module) => (
            <SimulationCard key={module.id} module={module} />
          ))}
        </div>
        {simulations.length === 0 && (
          <div className="panel mt-4 px-6 py-16 text-center">
            <p className="font-display text-lg font-semibold">No matching modules</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try widening the search or clearing a filter.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export function SubjectContent({ subjectId }: { subjectId: SubjectId }) {
  const subject = getSubject(subjectId);
  const Icon = subject.icon;
  const simulations = listSimulationsBySubject(subjectId);
  return (
    <div data-subject={subjectId} className="subject-tint">
      <main className="container py-12 sm:py-16">
        <header className="panel relative overflow-hidden p-7 sm:p-10">
          <div className="absolute -right-10 -top-20 size-72 rounded-full bg-subject/10 blur-3xl" />
          <div className="relative max-w-3xl">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-subject/30 bg-subject/10 text-subject">
              <Icon className="size-7" />
            </div>
            <p className="mt-8 panel-label text-subject">{subject.name} laboratory</p>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              {subject.intro}
            </h1>
            <p className="mt-5 text-base text-muted-foreground">{subject.tagline}</p>
          </div>
        </header>
        <div className="mt-12 flex items-end justify-between gap-4">
          <div>
            <p className="panel-label text-subject">Available modules</p>
            <h2 className="mt-2 font-display text-2xl font-semibold">Start an investigation.</h2>
          </div>
          <span className="font-mono text-xs text-muted-foreground">
            {simulations.length.toString().padStart(2, "0")} modules
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {simulations.map((module) => (
            <SimulationCard key={module.id} module={module} />
          ))}
        </div>
      </main>
    </div>
  );
}
