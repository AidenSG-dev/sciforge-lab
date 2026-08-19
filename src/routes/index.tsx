import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Atom,
  Brain,
  CircuitBoard,
  FlaskConical,
  MousePointer2,
  ScanLine,
  Sparkles,
  Waves,
} from "lucide-react";
import { SUBJECTS } from "@/lib/subjects";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SciForge — Experiment with Science" },
      {
        name: "description",
        content:
          "Interactive simulations that let you change variables, observe results, and understand why they happen.",
      },
    ],
  }),
  component: Home,
});
const subjectIcons = {
  physics: Waves,
  chemistry: FlaskConical,
  biology: Brain,
  robotics: CircuitBoard,
} as const;
function HeroNetwork() {
  return (
    <div className="relative aspect-square w-full max-w-[34rem] overflow-hidden rounded-[2rem] border border-border bg-background/70 shadow-2xl shadow-subject/10">
      <div className="absolute inset-0 lab-grid opacity-50" />
      {Array.from({ length: 16 }, (_, index) => (
        <motion.span
          key={index}
          className="absolute size-1.5 rounded-full bg-subject shadow-[0_0_18px_var(--subject)]"
          style={{ left: `${14 + ((index * 29) % 74)}%`, top: `${12 + ((index * 43) % 75)}%` }}
          animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.5, 0.8] }}
          transition={{ duration: 2.5 + (index % 4) * 0.4, repeat: Infinity, delay: index * 0.12 }}
        />
      ))}
      <svg className="absolute inset-0 size-full opacity-40" viewBox="0 0 500 500" fill="none">
        <path
          d="M80 120L190 245L340 100L420 300L270 390L190 245L420 300M80 120L270 390M340 100L420 300"
          stroke="currentColor"
          className="text-subject"
          strokeWidth="1"
          strokeDasharray="5 9"
        />
        <circle
          cx="250"
          cy="250"
          r="105"
          stroke="currentColor"
          className="text-subject"
          strokeWidth="1"
          strokeDasharray="2 12"
        />
        <circle
          cx="250"
          cy="250"
          r="47"
          fill="currentColor"
          className="text-subject/10"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>
      <motion.div
        className="absolute left-1/2 top-1/2 flex size-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-subject/50 bg-subject/10 text-subject"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
      >
        <Atom className="size-12" />
      </motion.div>
      <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-xl border border-border bg-panel/90 px-4 py-3 backdrop-blur">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          live system map
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] text-subject">
          <span className="status-dot status-dot-live">
            <span />
          </span>{" "}
          online
        </span>
      </div>
    </div>
  );
}
function Home() {
  return (
    <div className="subject-tint">
      <main>
        <section className="container grid min-h-[calc(100vh-5rem)] items-center gap-12 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-24">
          <div>
            <p className="mb-6 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.24em] text-subject">
              <Sparkles className="size-4" /> SciForge / interactive laboratory
            </p>
            <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-[-0.05em] text-foreground sm:text-7xl">
              Experiment
              <br />
              <span className="text-subject">with Science.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
              Interactive simulations that let you change variables, observe results, and understand
              why they happen.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-md bg-subject px-5 py-3 text-sm font-semibold text-subject-foreground transition-transform hover:-translate-y-0.5"
              >
                Explore simulations <ArrowRight className="size-4" />
              </Link>
              <a
                href="#subjects"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-panel px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-subject/50"
              >
                Explore subjects
              </a>
            </div>
            <div className="mt-12 flex items-center gap-5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="flex items-center gap-2">
                <ScanLine className="size-4 text-subject" /> 08 modules
              </span>
              <span className="h-4 w-px bg-border" />
              <span>04 disciplines</span>
            </div>
          </div>
          <HeroNetwork />
        </section>
        <section className="border-y border-border bg-panel/50">
          <div className="container grid gap-8 py-20 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="panel-label text-subject">A different way to learn</p>
              <h2 className="mt-4 max-w-md font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Science shouldn't just be observed.
              </h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Set up an experiment, perturb the system, and build an intuition you can carry
                beyond the screen.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "CHANGE", "Control scientific variables."],
                ["02", "OBSERVE", "Watch the system respond in real time."],
                ["03", "UNDERSTAND", "Discover the concept behind the result."],
              ].map(([number, title, text]) => (
                <div key={title} className="border-l border-subject/40 pl-4">
                  <span className="font-mono text-xs text-subject">{number}</span>
                  <h3 className="mt-10 font-display text-sm font-semibold tracking-[0.12em] text-foreground">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="subjects" className="container py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="panel-label text-subject">Explore science</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Choose your laboratory.
              </h2>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-subject"
            >
              View all simulations <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {SUBJECTS.map((subject, index) => {
              const Icon = subjectIcons[subject.id];
              return (
                <Link
                  key={subject.id}
                  to={subject.path}
                  data-subject={subject.id}
                  className="group panel relative min-h-56 overflow-hidden p-6 transition-transform hover:-translate-y-1"
                >
                  <div className="absolute -right-10 -top-10 size-40 rounded-full bg-subject/10 blur-3xl" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-xl border border-subject/30 bg-subject/10 text-subject">
                        <Icon className="size-6" />
                      </div>
                      <MousePointer2 className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-subject">
                        0{index + 1} / {subject.name}
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-semibold text-foreground">
                        {subject.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{subject.tagline}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
