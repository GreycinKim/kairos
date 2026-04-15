const DEBOUNCE_MS = 2000;

let timer: ReturnType<typeof setTimeout> | null = null;

/** Debounced upload of full workspace blobs to the API (after local edits). */
export function notifyWorkspaceLocalChanged(): void {
  if (typeof window === "undefined") return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void import("@/lib/workspaceRemoteSync").then((m) => m.pushFullWorkspaceToServer());
  }, DEBOUNCE_MS);
}
