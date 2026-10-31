export interface CommunityItem {
  inputType: "message" | "email" | "url";
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  riskScore: number;
  topSignal: string;
  createdAt: string;
}

export interface CommunityResponse {
  items: CommunityItem[];
  updatedAt: string;
  note: string;
}
