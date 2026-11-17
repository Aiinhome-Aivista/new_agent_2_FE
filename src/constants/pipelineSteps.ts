export interface PipelineStepItem {
  key: string;
  name: string;
  desc: string;
  metricKey?: string;
}

export const BASELINE_STEPS: PipelineStepItem[] = [
  {
    key: "Detect Scope Sections",
    name: "Detect Scope Sections",
    desc: "Scanning contract scope sections, deliverables, and clauses.",
  },
  {
    key: "Extract Deliverables",
    name: "Extract Deliverables & Scope Items",
    desc: "Extracting candidate deliverables and contract obligations.",
  },
  {
    key: "Classify Scope Items",
    name: "Classify In-Scope & Out-of-Scope",
    desc: "Classifying deliverables into in-scope and out-of-scope boundaries.",
  },
  {
    key: "Extract Milestones & Dates",
    name: "Extract Milestones & Deadlines",
    desc: "Detecting target milestone dates, delivery deadlines, and dependencies.",
  },
  {
    key: "Finalize Baseline Draft",
    name: "Finalize Baseline Draft",
    desc: "Generating structured baseline version ready for management review.",
  },
];

export const mapStageToBaselineStepIndex = (stage: string, progress?: number): number => {
  if (!stage) return 0;
  const s = stage.toLowerCase();
  if (
    s.includes("save") ||
    s.includes("saving") ||
    s.includes("draft") ||
    s.includes("finalize") ||
    s.includes("complete") ||
    s.includes("recurring") ||
    s.includes("building") ||
    s.includes("commitments")
  ) {
    return 4;
  }
  if (
    s.includes("milestone") ||
    s.includes("deadline") ||
    s.includes("date") ||
    s.includes("enrich") ||
    s.includes("dependenc")
  ) {
    return 3;
  }
  if (
    s.includes("classif") ||
    s.includes("deduplicat") ||
    s.includes("merge")
  ) {
    return 2;
  }
  if (
    s.includes("extract") ||
    s.includes("candidate") ||
    s.includes("deliverable") ||
    s.includes("scope") ||
    s.includes("activity") ||
    s.includes("activities")
  ) {
    return 1;
  }

  // Safety progress fallbacks
  if (progress !== undefined && progress >= 85) return 4;
  if (progress !== undefined && progress >= 70) return 3;
  if (progress !== undefined && progress >= 50) return 2;
  if (progress !== undefined && progress >= 25) return 1;

  return 0;
};
