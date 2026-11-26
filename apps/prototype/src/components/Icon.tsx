/** Small inline SVG icon set (no dependency). Decorative by default (aria-hidden). */
export type IconName =
  | "chart"
  | "list"
  | "upload"
  | "people"
  | "check"
  | "clock"
  | "tilde"
  | "warning"
  | "error"
  | "card"
  | "info"
  | "chevron"
  | "chevronDown"
  | "close"
  | "plus"
  | "edit"
  | "trash"
  | "search"
  | "file"
  | "transfer"
  | "more"
  | "filter"
  | "logo"
  | "keyboard"
  | "copy"
  | "restore";

const paths: Record<IconName, string> = {
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  upload: "M12 16V4m0 0-5 5m5-5 5 5M4 20h16",
  people:
    "M16 20v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 20v-1a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  check: "M20 6 9 17l-5-5",
  clock: "M12 7v5l3 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  tilde: "M4 14c2-4 5-4 8 0s6 4 8 0",
  warning:
    "M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0",
  error: "M12 8v4M12 16h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  card: "M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20M6 15h4",
  info: "M12 16v-4M12 8h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20",
  // Points to the inline-end in LTR; mirrored under RTL by the .icon-dir class.
  chevron: "m9 18 6-6-6-6",
  chevronDown: "m6 9 6 6 6-6",
  close: "M18 6 6 18M6 6l12 12",
  plus: "M12 5v14M5 12h14",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  search: "m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14",
  file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6",
  transfer: "M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7",
  more: "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2",
  filter: "M22 3H2l8 9.5V19l4 2v-8.5z",
  logo: "M3 21h18M5 21V10l7-6 7 6v11M9 21v-6h6v6",
  keyboard: "M2 6h20v12H2zM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10",
  copy: "M9 9h11v11H9zM5 15H4V4h11v1",
  restore: "M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5",
};

export function Icon({
  name,
  size = 20,
  directional = false,
  className,
  label,
}: {
  name: IconName;
  size?: number;
  /** Mirror under RTL (chevrons, arrows). */
  directional?: boolean;
  className?: string;
  /** When set, the icon is announced with this label. */
  label?: string;
}) {
  const classes = ["icon", directional ? "icon-dir" : "", className ?? ""]
    .filter(Boolean)
    .join(" ");
  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}

/** Google "G" mark for the sign-in button (Google branding guidelines). */
export function GoogleMark() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7c-.5-1.4-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.4 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.6 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}
