const DEBOUNCE_MS = 1200;

let timer: ReturnType<typeof setTimeout> | null = null;

function clearDebounceTimer(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

/** Debounced upload of full workspace blobs to the API (after local edits). */
export function notifyWorkspaceLocalChanged(): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void import("@/lib/workspaceRemoteSync").then((m) => m.pushFullWorkspaceToServer());
  }, DEBOUNCE_MS);
}

/** Push immediately (e.g. tab backgrounded / unload) so edits are not lost waiting on debounce. */
export function flushWorkspacePushNow(): void {
  if (typeof window === "undefined") return;
  clearDebounceTimer();
  void import("@/lib/workspaceRemoteSync").then((m) => m.pushFullWorkspaceToServer());
}
