import { lazy, Suspense, useEffect, useState } from "react";
import { X } from "lucide-react";

import { loadBibleLocationsCatalog, locationByIdFromList } from "@/lib/bibleLocationsCatalog";
import { BOOK_CITIES_ATTRIBUTION } from "@/lib/bookCitiesBasemap";
import { useReaderPlaceMapStore } from "@/store/readerPlaceMapStore";

const SinglePlaceFlyToMap = lazy(async () => {
  const m = await import("@/components/maps/SinglePlaceFlyToMap");
  return { default: m.SinglePlaceFlyToMap };
});

export function ReaderPlaceMapPanel() {
  const open = useReaderPlaceMapStore((s) => s.open);
  const placeId = useReaderPlaceMapStore((s) => s.placeId);
  const placeName = useReaderPlaceMapStore((s) => s.placeName);
  const description = useReaderPlaceMapStore((s) => s.description);
  const close = useReaderPlaceMapStore((s) => s.close);

  const [resolvedDesc, setResolvedDesc] = useState<string | null>(null);
  const [latLng, setLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    if (!open || !placeId) {
      setResolvedDesc(null);
      setLatLng(null);
      setMapFailed(false);
      return;
    }
    let cancelled = false;
    setMapFailed(false);
    void (async () => {
      try {
        const list = await loadBibleLocationsCatalog();
        if (cancelled) return;
        const loc = locationByIdFromList(list, placeId);
        if (loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) {
          setLatLng({ lat: loc.lat, lng: loc.lng });
        } else {
          setLatLng(null);
          setMapFailed(true);
        }
        const d = description ?? loc?.description ?? null;
        setResolvedDesc(typeof d === "string" ? d : null);
      } catch {
        if (!cancelled) {
          setLatLng(null);
          setMapFailed(true);
          setResolvedDesc(description);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, placeId, description]);

  if (!open || !placeId || !placeName) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[56] bg-black/25 md:bg-black/20"
        aria-label="Close place map"
        onClick={close}
      />
      <aside
        className="fixed z-[57] flex flex-col bg-white shadow-2xl transition-transform max-md:inset-x-0 max-md:bottom-0 max-md:h-[min(88dvh,560px)] max-md:rounded-t-2xl max-md:border-t max-md:border-neutral-200 md:inset-y-0 md:right-0 md:w-[min(100vw,400px)] md:border-l md:border-neutral-200"
        role="dialog"
        aria-label="Place on map"
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-neutral-900">{placeName}</p>
            <p className="truncate text-[10px] text-neutral-500">{placeId}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"
            aria-label="Close"
            onClick={close}
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1">
          {latLng && !mapFailed ? (
            <Suspense
              fallback={<div className="flex h-full min-h-[200px] items-center justify-center text-sm text-neutral-500">Loading map…</div>}
            >
              <SinglePlaceFlyToMap lat={latLng.lat} lng={latLng.lng} placeName={placeName} panelTone="light" />
            </Suspense>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col justify-center gap-2 px-4 text-sm text-neutral-700">
              <p className="font-medium">{placeName}</p>
              {resolvedDesc ? <p className="text-xs leading-relaxed text-neutral-600">{resolvedDesc}</p> : <p className="text-xs text-neutral-500">No map position found for this place id.</p>}
            </div>
          )}
        </div>
        {latLng && !mapFailed ? (
          <footer className="shrink-0 border-t border-neutral-100 px-2 py-1 text-[9px] leading-tight text-neutral-500">
            {resolvedDesc ? <p className="line-clamp-3">{resolvedDesc}</p> : null}
            <p className="mt-1 opacity-80">{BOOK_CITIES_ATTRIBUTION}</p>
          </footer>
        ) : null}
      </aside>
    </>
  );
}
