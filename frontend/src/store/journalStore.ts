import { create } from "zustand";

import { api } from "@/api/client";
import type { JournalEntry } from "@/types";

interface JournalState {
  entries: JournalEntry[];
  loading: boolean;
  fetchEntries: () => Promise<void>;
  saveEntry: (payload: {
    id?: string;
    entry_date: string;
    title?: string | null;
    body?: string | null;
    prayer_requests?: string | null;
    answered_prayers?: string | null;
    tags?: string[] | null;
    linked_event_id?: string | null;
    theme_ids?: string[];
  }) => Promise<JournalEntry | null>;
  deleteEntry: (id: string) => Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,

  fetchEntries: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get<JournalEntry[]>("/journal/entries");
      set({ entries: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  saveEntry: async (payload) => {
    try {
      if (payload.id) {
        const { id, entry_date: _d, ...rest } = payload;
        const { data } = await api.patch<JournalEntry>(`/journal/entries/${id}`, rest);
        set({
          entries: get().entries.map((e) => (e.id === id ? data : e)),
        });
        return data;
      }
      const { data } = await api.post<JournalEntry>("/journal/entries", {
        entry_date: payload.entry_date,
        title: payload.title ?? null,
        body: payload.body ?? null,
        prayer_requests: payload.prayer_requests ?? null,
        answered_prayers: payload.answered_prayers ?? null,
        tags: payload.tags ?? null,
        linked_event_id: payload.linked_event_id ?? null,
        theme_ids: payload.theme_ids ?? [],
      });
      set({ entries: [data, ...get().entries.filter((e) => e.entry_date !== data.entry_date)] });
      return data;
    } catch {
      return null;
    }
  },

  deleteEntry: async (id: string) => {
    await api.delete(`/journal/entries/${id}`);
    set({ entries: get().entries.filter((e) => e.id !== id) });
  },
}));
