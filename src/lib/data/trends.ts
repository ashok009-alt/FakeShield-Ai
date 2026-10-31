export interface TrendCategory {
  name: string;
  reports: number;
  change: number;
  color: string;
}

export interface TrendDay {
  day: string;
  reports: number;
  highRisk: number;
}

export interface StateHeat {
  state: string;
  reports: number;
  intensity: 1 | 2 | 3 | 4 | 5;
}

export interface RisingAlert {
  title: string;
  change: number;
  detail: string;
  level: "critical" | "high" | "medium";
}

export const trendSummary = {
  weekLabel: "19–25 October 2026",
  totalReports: 12480,
  comparedToLastWeek: 18,
  criticalShare: 31,
  topState: "Maharashtra",
};

export const trendCategories: TrendCategory[] = [
  { name: "Fake KYC / bank", reports: 3180, change: 22, color: "#fb923c" },
  { name: "OTP theft", reports: 2740, change: 34, color: "#ef4444" },
  { name: "Delivery fee", reports: 1980, change: 19, color: "#f59e0b" },
  { name: "Investment / crypto", reports: 1540, change: 12, color: "#fbbf24" },
  { name: "Digital arrest", reports: 1210, change: 28, color: "#f97316" },
  { name: "Job / task", reports: 940, change: 9, color: "#fb7185" },
  { name: "Lottery / prize", reports: 520, change: -6, color: "#a8a29e" },
  { name: "Tech support", reports: 370, change: 4, color: "#78716c" },
];

export const trendDaily: TrendDay[] = [
  { day: "Mon", reports: 1540, highRisk: 461 },
  { day: "Tue", reports: 1690, highRisk: 512 },
  { day: "Wed", reports: 1760, highRisk: 548 },
  { day: "Thu", reports: 1810, highRisk: 579 },
  { day: "Fri", reports: 2010, highRisk: 642 },
  { day: "Sat", reports: 1890, highRisk: 601 },
  { day: "Sun", reports: 1780, highRisk: 544 },
];

export const stateHeat: StateHeat[] = [
  { state: "Maharashtra", reports: 1840, intensity: 5 },
  { state: "Uttar Pradesh", reports: 1620, intensity: 5 },
  { state: "Karnataka", reports: 1180, intensity: 4 },
  { state: "Delhi", reports: 1050, intensity: 4 },
  { state: "Tamil Nadu", reports: 980, intensity: 4 },
  { state: "Telangana", reports: 870, intensity: 4 },
  { state: "Gujarat", reports: 760, intensity: 3 },
  { state: "West Bengal", reports: 720, intensity: 3 },
  { state: "Rajasthan", reports: 610, intensity: 3 },
  { state: "Madhya Pradesh", reports: 560, intensity: 3 },
  { state: "Punjab", reports: 380, intensity: 2 },
  { state: "Kerala", reports: 340, intensity: 2 },
  { state: "Bihar", reports: 330, intensity: 2 },
  { state: "Haryana", reports: 300, intensity: 2 },
  { state: "Odisha", reports: 260, intensity: 1 },
  { state: "Assam", reports: 190, intensity: 1 },
];

export const risingAlerts: RisingAlert[] = [
  {
    title: "OTP theft",
    change: 34,
    detail: "Callers posing as electricity-board staff ask for an OTP to stop a disconnection.",
    level: "critical",
  },
  {
    title: "Digital arrest",
    change: 28,
    detail: "Video-call scripts claim a parcel in your name contains illegal items.",
    level: "critical",
  },
  {
    title: "Fake delivery links",
    change: 19,
    detail: "Small redelivery fees are used to harvest card and UPI details.",
    level: "high",
  },
  {
    title: "Investment groups",
    change: 12,
    detail: "Telegram groups show small payouts before asking for a larger deposit.",
    level: "medium",
  },
];
