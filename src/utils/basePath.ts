// next/link and the router add the base path themselves; redirects, public files, image src and CSS urls do not.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function withBasePath(path: string): string {
  if (!BASE_PATH || !path.startsWith('/') || path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) return path;
  return `${BASE_PATH}${path}`;
}
