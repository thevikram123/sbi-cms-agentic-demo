// Resolves image paths correctly whether running on localhost or GitHub Pages
// On GitHub Pages the Vite base path prefixes root-relative media paths.
const base = (process.env.BASE_URL || '').replace(/\/$/, '');

export function img(path: string): string {
  // path should start with /images/...
  return base + path;
}
