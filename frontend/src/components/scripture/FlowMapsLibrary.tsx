import { useEffect, useMemo, useState } from "react";
import { FolderOpen, GripVertical, Plus, Trash2 } from "lucide-react";

import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/shared/Modal";
import type { ScriptureFlowFolder, ScriptureFlowMap } from "@/types";
import clsx from "clsx";

const MAP_MIME = "application/x-kairos-flow-map";

function parseMapDrag(e: React.DragEvent): string | null {
  try {
    const raw = e.dataTransfer.getData(MAP_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return null;
    const j = JSON.parse(raw) as { mapId?: string };
    return typeof j.mapId === "string" ? j.mapId : null;
  } catch {
    return null;
  }
}

export function FlowMapsLibrary({
  maps,
  folders,
  onRefresh,
  onOpenMap,
}: {
  maps: ScriptureFlowMap[];
  folders: ScriptureFlowFolder[];
  onRefresh: () => void | Promise<void>;
  onOpenMap: (mapId: string) => void;
}) {
  const [folderModal, setFolderModal] = useState(false);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [deleteMapId, setDeleteMapId] = useState<string | null>(null);
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const mapsByFolder = useMemo(() => {
    const unfiled = maps.filter((m) => !m.folder_id).sort(sortByUpdated);
    const by = new Map<string, ScriptureFlowMap[]>();
    for (const f of folders) {
      by.set(f.id, maps.filter((m) => m.folder_id === f.id).sort(sortByUpdated));
    }
    return { unfiled, by };
  }, [maps, folders]);

  const moveMapToFolder = async (mapId: string, folderId: string | null) => {
    try {
      await api.patch<ScriptureFlowMap>(`/scripture/flow-maps/${mapId}`, { folder_id: folderId });
      await onRefresh();
    } catch {
      /* ignore */
    }
  };

  const createFolder = async () => {
    const title = newFolderTitle.trim() || "Untitled folder";
    await api.post<ScriptureFlowFolder>("/scripture/flow-folders", { title });
    setNewFolderTitle("");
    setFolderModal(false);
    await onRefresh();
  };

  const renameFolder = async (id: string, title: string) => {
    await api.patch<ScriptureFlowFolder>(`/scripture/flow-folders/${id}`, {
      title: title.trim() || "Untitled folder",
    });
    await onRefresh();
  };

  const removeFolder = async (id: string) => {
    await api.delete(`/scripture/flow-folders/${id}`);
    setDeleteFolderId(null);
    await onRefresh();
  };

  const removeMap = async (id: string) => {
    await api.delete(`/scripture/flow-maps/${id}`);
    setDeleteMapId(null);
    await onRefresh();
  };

  const createMapInFolder = async (folderId: string | null) => {
    const { data } = await api.post<ScriptureFlowMap>("/scripture/flow-maps", {
      title: "Untitled map",
      folder_id: folderId,
    });
    await onRefresh();
    onOpenMap(data.id);
  };

  const dropHandlers = (folderId: string | null) => ({
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverZone(folderId ?? "unfiled");
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverZone(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDragOverZone(null);
      const mapId = parseMapDrag(e);
      if (!mapId) return;
      const current = maps.find((m) => m.id === mapId)?.folder_id ?? null;
      const target = folderId;
      if (current === target) return;
      void moveMapToFolder(mapId, target);
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Passage maps</h2>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setFolderModal(true)}>
            <FolderOpen className="mr-1 h-4 w-4" strokeWidth={2} />
            New folder
          </Button>
          <Button type="button" size="sm" onClick={() => void createMapInFolder(null)}>
            <Plus className="mr-1 h-4 w-4" strokeWidth={2} />
            New map (unfiled)
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:overflow-x-auto lg:pb-2">
        <FolderColumn
          title="Unfiled"
          maps={mapsByFolder.unfiled}
          dragOver={dragOverZone === "unfiled"}
          dropHandlers={dropHandlers(null)}
          onOpenMap={onOpenMap}
          onCreateMap={() => void createMapInFolder(null)}
          onRequestDeleteMap={(id) => setDeleteMapId(id)}
        />
        {folders.map((f) => (
          <FolderColumn
            key={f.id}
            title={f.title}
            folderId={f.id}
            maps={mapsByFolder.by.get(f.id) ?? []}
            dragOver={dragOverZone === f.id}
            dropHandlers={dropHandlers(f.id)}
            onOpenMap={onOpenMap}
            onCreateMap={() => void createMapInFolder(f.id)}
            onRename={(title) => void renameFolder(f.id, title)}
            onRequestDelete={() => setDeleteFolderId(f.id)}
            onRequestDeleteMap={(id) => setDeleteMapId(id)}
          />
        ))}
      </div>

      <Modal open={folderModal} onClose={() => setFolderModal(false)} title="New folder">
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground">Name</label>
            <Input
              value={newFolderTitle}
              onChange={(e) => setNewFolderTitle(e.target.value)}
              className="mt-1.5"
              placeholder="e.g. Easter series"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFolderModal(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void createFolder()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={deleteFolderId != null} onClose={() => setDeleteFolderId(null)} title="Delete folder?">
        <p className="text-sm text-muted-foreground">
          Maps in this folder will move to <strong>Unfiled</strong>. This cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteFolderId(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => deleteFolderId && void removeFolder(deleteFolderId)}
          >
            Delete folder
          </Button>
        </div>
      </Modal>

      <Modal open={deleteMapId != null} onClose={() => setDeleteMapId(null)} title="Delete map?">
        <p className="text-sm text-muted-foreground">This passage map will be deleted permanently. This cannot be undone.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setDeleteMapId(null)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" size="sm" onClick={() => deleteMapId && void removeMap(deleteMapId)}>
            Delete map
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function sortByUpdated(a: ScriptureFlowMap, b: ScriptureFlowMap) {
  return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
}

function FolderColumn({
  title,
  maps,
  dragOver,
  dropHandlers,
  onOpenMap,
  onCreateMap,
  folderId,
  onRename,
  onRequestDelete,
  onRequestDeleteMap,
}: {
  title: string;
  maps: ScriptureFlowMap[];
  dragOver: boolean;
  dropHandlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  onOpenMap: (id: string) => void;
  onCreateMap: () => void;
  folderId?: string;
  onRename?: (title: string) => void;
  onRequestDelete?: () => void;
  onRequestDeleteMap: (id: string) => void;
}) {
  const [editing, setEditing] = useState(title);
  useEffect(() => {
    setEditing(title);
  }, [title]);

  return (
    <section
      className={clsx(
        "flex min-h-[12rem] min-w-0 flex-1 flex-col rounded-2xl border border-dashed border-black/[0.12] bg-muted/5 p-4 transition-colors lg:min-w-[17rem] lg:max-w-[20rem]",
        dragOver && "border-primary/50 bg-primary/5",
      )}
      {...dropHandlers}
    >
      <div className="mb-3 flex items-start gap-2 border-b border-black/[0.06] pb-2">
        {folderId ? (
          <Input
            value={editing}
            onChange={(e) => setEditing(e.target.value)}
            onBlur={() => {
              if (editing.trim() !== title) onRename?.(editing);
            }}
            className="h-8 flex-1 text-sm font-semibold"
          />
        ) : (
          <h3 className="flex-1 text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        )}
        {folderId && onRequestDelete ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            onClick={onRequestDelete}
            aria-label="Delete folder"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-2">
        {maps.map((m) => (
          <MapRow key={m.id} map={m} onOpen={() => onOpenMap(m.id)} onRequestDelete={() => onRequestDeleteMap(m.id)} />
        ))}
        {!maps.length ? <p className="py-4 text-center text-xs text-muted-foreground">Drop maps here</p> : null}
      </div>
      <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" onClick={onCreateMap}>
        <Plus className="mr-1 h-3.5 w-3.5" strokeWidth={2} />
        New map
      </Button>
    </section>
  );
}

function MapRow({
  map,
  onOpen,
  onRequestDelete,
}: {
  map: ScriptureFlowMap;
  onOpen: () => void;
  onRequestDelete: () => void;
}) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(MAP_MIME, JSON.stringify({ mapId: map.id }));
    e.dataTransfer.setData("text/plain", JSON.stringify({ mapId: map.id }));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex items-stretch gap-1 rounded-xl border border-black/[0.06] bg-card shadow-sm">
      <div
        className="flex w-8 shrink-0 cursor-grab items-center justify-center border-r border-black/[0.06] text-muted-foreground active:cursor-grabbing"
        draggable
        onDragStart={onDragStart}
        title="Drag into another folder"
      >
        <GripVertical className="h-4 w-4" strokeWidth={2} />
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/30"
      >
        <span className="font-medium text-foreground">{map.title}</span>
        <span className="mt-1 block text-[10px] text-muted-foreground">Updated {new Date(map.updated_at).toLocaleString()}</span>
      </button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-auto shrink-0 rounded-none border-l border-black/[0.06] px-2 text-muted-foreground hover:text-destructive"
        aria-label="Delete map"
        onClick={(e) => {
          e.stopPropagation();
          onRequestDelete();
        }}
      >
        <Trash2 className="h-4 w-4" strokeWidth={2} />
      </Button>
    </div>
  );
}
