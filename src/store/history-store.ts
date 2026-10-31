"use client";

import { create } from "zustand";
import { deleteAnalysis, fetchHistory, fetchStats } from "@/lib/api-client";
import type { StatsResponse, StoredAnalysis } from "@/lib/serialize";

interface HistoryState {
  analyses: StoredAnalysis[];
  stats: StatsResponse | null;
  level: string;
  type: string;
  loading: boolean;
  deletingId: string | null;
  error: string | null;
  hasLoaded: boolean;
  setLevel: (level: string) => void;
  setType: (type: string) => void;
  load: (options?: { silent?: boolean; withStats?: boolean }) => Promise<void>;
  remove: (id: string) => Promise<boolean>;
  reset: () => void;
}

// Latest in-flight history request. Filter changes abort the previous one so a
// slow response can never overwrite newer results.
let historyController: AbortController | null = null;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  analyses: [],
  stats: null,
  level: "all",
  type: "all",
  loading: false,
  deletingId: null,
  error: null,
  hasLoaded: false,

  setLevel: (level) => {
    if (get().level === level) return;
    set({ level });
    // Filters only change the list, not the aggregate stats.
    void get().load({ withStats: false });
  },

  setType: (type) => {
    if (get().type === type) return;
    set({ type });
    void get().load({ withStats: false });
  },

  load: async ({ silent = false, withStats = false } = {}) => {
    const { level, type, stats } = get();
    const needsStats = withStats || stats === null;

    historyController?.abort();
    const controller = new AbortController();
    historyController = controller;

    if (!silent) set({ loading: true, error: null });
    else set({ error: null });

    try {
      const [historyResult, statsResult] = await Promise.allSettled([
        fetchHistory({ level, type }, controller.signal),
        needsStats ? fetchStats(controller.signal) : Promise.resolve(null),
      ]);

      if (controller.signal.aborted) return;

      if (historyResult.status === "rejected") {
        throw historyResult.reason;
      }

      set((state) => ({
        analyses: historyResult.value.analyses,
        stats:
          statsResult.status === "fulfilled" && statsResult.value
            ? statsResult.value
            : state.stats,
        loading: false,
        hasLoaded: true,
        error: null,
      }));
    } catch (caught) {
      if (controller.signal.aborted) return;
      const message = caught instanceof Error ? caught.message : "Could not load history.";
      set({ loading: false, error: message, hasLoaded: true });
    } finally {
      if (historyController === controller) historyController = null;
    }
  },

  remove: async (id) => {
    set({ deletingId: id });
    try {
      await deleteAnalysis(id);
      set((state) => ({
        analyses: state.analyses.filter((item) => item.id !== id),
        deletingId: null,
      }));
      // Stats and the "most common signal" aggregate change after a delete,
      // so refresh both quietly in the background.
      void get().load({ silent: true, withStats: true });
      return true;
    } catch {
      set({ deletingId: null });
      return false;
    }
  },

  reset: () => {
    historyController?.abort();
    historyController = null;
    set({
      analyses: [],
      stats: null,
      level: "all",
      type: "all",
      loading: false,
      deletingId: null,
      error: null,
      hasLoaded: false,
    });
  },
}));
