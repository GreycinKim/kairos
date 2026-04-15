import { publicAssetUrl } from "@/lib/publicAssetUrl";
import type { WorkspaceMapCatalogEntry } from "@/lib/workspaceMapSections";

export type WorkspaceMapCatalog = {
  generated?: string;
  source?: string;
  entries: WorkspaceMapCatalogEntry[];
};

export async function fetchWorkspaceMapCatalog(): Promise<WorkspaceMapCatalog> {
  const url = publicAssetUrl("bible-map/data/workspace-maps-catalog.json");
  const res = await fetch(url);
  if (!res.ok) throw new Error(String(res.status));
  const data = (await res.json()) as WorkspaceMapCatalog;
  return Array.isArray(data.entries) ? data : { entries: [] };
}
