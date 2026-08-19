import { create } from "zustand";
import type { GradeBand, SubjectId } from "@/simulations/types";

interface UiState {
  /** Explore page discovery state (kept in a store so it survives navigation). */
  query: string;
  subjectFilter: SubjectId | "all";
  gradeFilter: GradeBand | "all";
  conceptFilter: string | "all";
  mobileNavOpen: boolean;
  searchOpen: boolean;
  setQuery(query: string): void;
  setSubjectFilter(value: SubjectId | "all"): void;
  setGradeFilter(value: GradeBand | "all"): void;
  setConceptFilter(value: string | "all"): void;
  resetFilters(): void;
  setMobileNavOpen(open: boolean): void;
  setSearchOpen(open: boolean): void;
}

export const useUiStore = create<UiState>((set) => ({
  query: "",
  subjectFilter: "all",
  gradeFilter: "all",
  conceptFilter: "all",
  mobileNavOpen: false,
  searchOpen: false,
  setQuery: (query) => set({ query }),
  setSubjectFilter: (subjectFilter) => set({ subjectFilter }),
  setGradeFilter: (gradeFilter) => set({ gradeFilter }),
  setConceptFilter: (conceptFilter) => set({ conceptFilter }),
  resetFilters: () =>
    set({ query: "", subjectFilter: "all", gradeFilter: "all", conceptFilter: "all" }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setSearchOpen: (searchOpen) => set({ searchOpen }),
}));
