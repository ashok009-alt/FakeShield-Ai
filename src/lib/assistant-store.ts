import { create } from "zustand";
import type { AnalysisResult } from "./analysis/types";

export interface AssistantLink {
  label: string;
  href: string;
}

export interface AssistantMessage {
  id: number;
  role: "assistant" | "user";
  text: string;
  chips?: string[];
  links?: AssistantLink[];
}

interface AssistantState {
  context: AnalysisResult | null;
  open: boolean;
  messages: AssistantMessage[];
  nextId: number;
  setContext: (result: AnalysisResult) => void;
  setOpen: (open: boolean) => void;
  addMessage: (message: Omit<AssistantMessage, "id">) => number;
  reset: () => void;
}

const welcome: AssistantMessage = {
  id: 1,
  role: "assistant",
  text: "Hi — I'm the FakeShield assistant. I can explain a result, tell you what to do next, or point you to the right checker. My answers come from the detection engine and a fixed safety playbook, not a generative model.",
  chips: ["What should I do?", "How is the score calculated?", "Report to cybercrime"],
};

export const useAssistantStore = create<AssistantState>((set) => ({
  context: null,
  open: false,
  messages: [welcome],
  nextId: 2,
  setContext: (result) => set({ context: result }),
  setOpen: (open) => set({ open }),
  addMessage: (message) => {
    let assigned = 0;
    set((state) => {
      assigned = state.nextId;
      return {
        messages: [...state.messages, { ...message, id: state.nextId }],
        nextId: state.nextId + 1,
      };
    });
    return assigned;
  },
  reset: () => set({ messages: [welcome], nextId: 2 }),
}));
