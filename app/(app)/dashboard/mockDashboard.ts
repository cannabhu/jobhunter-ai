import type { ActivityEntry, ChartPoint, StatCardData } from "@/types";

// Mock data from context/designs/dashboard.png. Features 15, 16 and 17 replace each export with real data, then delete this file.

export const MOCK_STATS: StatCardData[] = [
  { label: "Total Jobs Found", value: "284", footer: { kind: "trend", change: "+12%", label: "vs last week" } },
  { label: "Avg. Match Rate", value: "82%", footer: { kind: "trend", change: "+3%", label: "vs last week" } },
  { label: "Companies Researched", value: "35", footer: { kind: "note", text: "Total researched" } },
  { label: "Jobs This Week", value: "28", footer: { kind: "note", text: "New this week" } },
];

export const MOCK_ACTIVITY: ActivityEntry[] = [
  { id: "1", message: "Found 8 jobs for Frontend Engineer", timeLabel: "10 mins ago", tone: "accent" },
  { id: "2", message: "Researched Stripe", timeLabel: "1 hour ago", tone: "info" },
  { id: "3", message: "Found 12 jobs for React Developer", timeLabel: "2 hours ago", tone: "success" },
  { id: "4", message: "Researched Vercel", timeLabel: "Yesterday", tone: "accent" },
  { id: "5", message: "Found 10 jobs for Full Stack Engineer", timeLabel: "Yesterday", tone: "success" },
];

export const MOCK_RESEARCH_BY_DAY: ChartPoint[] = [
  { label: "Mon", value: 2 },
  { label: "Tue", value: 5 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 8 },
  { label: "Fri", value: 12 },
  { label: "Sat", value: 4 },
  { label: "Sun", value: 1 },
];

export const MOCK_JOBS_BY_DAY: ChartPoint[] = [
  { label: "Mon", value: 12 },
  { label: "Tue", value: 45 },
  { label: "Wed", value: 32 },
  { label: "Thu", value: 60 },
  { label: "Fri", value: 85 },
  { label: "Sat", value: 40 },
  { label: "Sun", value: 10 },
];

export const MOCK_SCORE_DISTRIBUTION: ChartPoint[] = [
  { label: "50-60%", value: 5 },
  { label: "60-70%", value: 15 },
  { label: "70-80%", value: 45 },
  { label: "80-90%", value: 85 },
  { label: "90-100%", value: 35 },
];
