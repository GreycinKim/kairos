/** Build a fetchable URL for a file under Vite `public/` (handles BASE_URL and spaces). */
export function publicAssetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  const clean = relativePath.replace(/^\/+/, "");
  const encoded = clean.split("/").map(encodeURIComponent).join("/");
  return `${base}${encoded}`;
}
