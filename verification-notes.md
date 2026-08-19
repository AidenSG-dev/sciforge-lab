# Verification notes

The home route rendered successfully at `http://127.0.0.1:8080/`, including the SciForge header, hero network visual, CTAs, feature blocks, subject cards, and footer. The explore route rendered successfully with eight simulation cards, search, subject, grade, and concept filters.

The first simulation route attempt rendered blank because TanStack Start tried to serialize the registry module returned by the route loader; placeholder modules contain function properties such as `mount`. The route was corrected to resolve the module from the registry inside the component using `Route.useParams()`, while keeping route metadata derived from the parameter. TypeScript had passed before this final route adjustment; the route must be rechecked and the simulation route revisited.

The corrected physics pendulum route rendered the complete reusable workspace with declared controls, an unavailable placeholder viewport, mock-data graph labeling, explanation/formula, and experiment notes. The robotics circuit route rendered the same shared workspace plus the specialized components tray, build area, and program/logic area. Both routes showed no visible runtime errors.

Final checks: `pnpm exec tsc --noEmit` passed; `pnpm build` passed; `pnpm lint` passed with six pre-existing Fast Refresh warnings in shadcn UI files and no errors.
