/**
 * Minimal hash router (no dependency). Routes look like `#/transactions?month=2026-10`.
 * Hash routing keeps the prototype a static site with no server rewrites.
 */
import {
  type AnchorHTMLAttributes,
  type MouseEvent,
  useSyncExternalStore,
} from "react";

export interface Location {
  path: string;
  query: URLSearchParams;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

const getHash = (): string => window.location.hash;

export function parseHash(hash: string): Location {
  const raw = hash.replace(/^#/, "") || "/";
  const [pathPart = "/", queryPart = ""] = raw.split("?", 2);
  const path = pathPart.startsWith("/") ? pathPart : `/${pathPart}`;
  return {
    path: path.length > 1 ? path.replace(/\/$/, "") : path,
    query: new URLSearchParams(queryPart),
  };
}

export function useLocation(): Location {
  const hash = useSyncExternalStore(subscribe, getHash, () => "");
  return parseHash(hash);
}

export function navigate(
  to: string,
  options: { replace?: boolean } = {},
): void {
  const target = `#${to}`;
  if (window.location.hash === target) return;
  if (options.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = to;
  }
}

/** Builds `path?query` from a params object, dropping empty values. */
export function withQuery(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

/** Matches `/upload/:documentId/review` style patterns. */
export function matchPath(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const p = pattern.split("/");
  const a = path.split("/");
  if (p.length !== a.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i += 1) {
    const seg = p[i] ?? "";
    const val = a[i] ?? "";
    if (seg.startsWith(":")) params[seg.slice(1)] = decodeURIComponent(val);
    else if (seg !== val) return null;
  }
  return params;
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};

export function Link({ to, onClick, ...rest }: LinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey
    )
      return;
    e.preventDefault();
    navigate(to);
  };
  // Content comes in through `children` in `rest`.
  // oxlint-disable-next-line jsx-a11y/anchor-has-content
  return <a href={`#${to}`} onClick={handle} {...rest} />;
}
