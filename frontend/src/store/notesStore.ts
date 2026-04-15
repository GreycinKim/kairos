import { create } from "zustand";

import { api } from "@/api/client";
import type { Note, Tag } from "@/types";

interface NotesState {
  tags: Tag[];
  notesByEvent: Record<string, Note[]>;
  loadingTags: boolean;
  loadingNotes: boolean;
  fetchTags: () => Promise<void>;
  fetchNotesForEvent: (eventId: string) => Promise<void>;
  createNote: (eventId: string, title?: string) => Promise<Note | null>;
  updateNote: (
    noteId: string,
    body: Partial<Pick<Note, "title" | "body" | "is_private">> & { tag_ids?: string[]; theme_ids?: string[] },
  ) => Promise<void>;
  deleteNote: (noteId: string, eventId: string) => Promise<boolean>;
  clearCacheForEvent: (eventId: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  tags: [],
  notesByEvent: {},
  loadingTags: false,
  loadingNotes: false,

  fetchTags: async () => {
    set({ loadingTags: true });
    try {
      const { data } = await api.get<Tag[]>("/tags");
      set({ tags: data, loadingTags: false });
    } catch {
      set({ loadingTags: false });
    }
  },

  fetchNotesForEvent: async (eventId: string) => {
    set({ loadingNotes: true });
    try {
      const { data } = await api.get<Note[]>(`/notes/by-event/${eventId}`);
      set((s) => ({
        notesByEvent: { ...s.notesByEvent, [eventId]: data },
        loadingNotes: false,
      }));
    } catch {
      set({ loadingNotes: false });
    }
  },

  createNote: async (eventId: string, title?: string) => {
    try {
      const { data } = await api.post<Note>("/notes", {
        event_id: eventId,
        title: title ?? "Untitled note",
        body: "",
        is_private: true,
        tag_ids: [],
        theme_ids: [],
      });
      const list = get().notesByEvent[eventId] ?? [];
      set((s) => ({
        notesByEvent: { ...s.notesByEvent, [eventId]: [data, ...list] },
      }));
      return data;
    } catch {
      return null;
    }
  },

  updateNote: async (noteId, body) => {
    await api.patch(`/notes/${noteId}`, body);
    const evId = Object.keys(get().notesByEvent).find((k) =>
      (get().notesByEvent[k] ?? []).some((n) => n.id === noteId),
    );
    if (evId) await get().fetchNotesForEvent(evId);
  },

  deleteNote: async (noteId, eventId) => {
    try {
      await api.delete(`/notes/${noteId}`);
      set((s) => {
        const list = s.notesByEvent[eventId] ?? [];
        return {
          notesByEvent: {
            ...s.notesByEvent,
            [eventId]: list.filter((n) => n.id !== noteId),
          },
        };
      });
      return true;
    } catch {
      return false;
    }
  },

  clearCacheForEvent: (eventId: string) =>
    set((s) => {
      const next = { ...s.notesByEvent };
      delete next[eventId];
      return { notesByEvent: next };
    }),
}));
