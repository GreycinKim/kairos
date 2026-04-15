import { useCallback, useRef } from "react";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import type { MapRef } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { BOOK_CITIES_BASEMAP_DARK, BOOK_CITIES_BASEMAP_LIGHT } from "@/lib/bookCitiesBasemap";

type SinglePlaceFlyToMapProps = {
  lat: number;
  lng: number;
  placeName: string;
  panelTone?: "light" | "dark";
};

export function SinglePlaceFlyToMap({ lat, lng, placeName, panelTone = "light" }: SinglePlaceFlyToMapProps) {
  const mapRef = useRef<MapRef>(null);

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.resize();
    map.flyTo({ center: [lng, lat], zoom: 8, duration: 900 });
  }, [lat, lng]);

  const mapStyle = panelTone === "dark" ? BOOK_CITIES_BASEMAP_DARK : BOOK_CITIES_BASEMAP_LIGHT;

  return (
    <Map
      ref={mapRef}
      mapStyle={mapStyle}
      initialViewState={{ longitude: lng, latitude: lat, zoom: 8 }}
      style={{ width: "100%", height: "100%" }}
      attributionControl={false}
      onLoad={onLoad}
      reuseMaps
    >
      <NavigationControl position="top-right" showCompass={false} />
      <Marker longitude={lng} latitude={lat} anchor="bottom">
        <div className="rounded-full border-2 border-white bg-amber-600 px-2 py-1 text-xs font-semibold text-white shadow-md" title={placeName}>
          📍
        </div>
      </Marker>
    </Map>
  );
}
