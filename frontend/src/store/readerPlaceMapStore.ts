import { create } from "zustand";

export type ReaderPlaceMapPayload = {
  placeId: string;
  placeName: string;
  description?: string | null;
};

type ReaderPlaceMapState = {
  open: boolean;
  placeId: string | null;
  placeName: string | null;
  description: string | null;
  openPlace: (p: ReaderPlaceMapPayload) => void;
  close: () => void;
};

export const useReaderPlaceMapStore = create<ReaderPlaceMapState>((set) => ({
  open: false,
  placeId: null,
  placeName: null,
  description: null,
  openPlace: (p) =>
    set({
      open: true,
      placeId: p.placeId,
      placeName: p.placeName,
      description: p.description ?? null,
    }),
  close: () =>
    set({
      open: false,
      placeId: null,
      placeName: null,
      description: null,
    }),
}));
