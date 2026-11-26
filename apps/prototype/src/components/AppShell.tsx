/** App shell: banner, top bar, side nav (desktop), icon rail (tablet), bottom nav (phone). */
import { type ReactNode, useState } from "react";
import type { Role } from "../demo/types";
import { initials, t } from "../lib/format";
import { Link, navigate, useLocation } from "../lib/router";
import { he } from "../locale/he";
import { useCurrent, useStore } from "../state/store";
import { Icon, type IconName } from "./Icon";
import { Popover } from "./overlays";

export function PrototypeBanner() {
  return (
    <div className="proto-banner" role="note">
      <strong>{he.banner.title}</strong>
      <span className="proto-banner__note">{he.banner.note}</span>
    </div>
  );
}

interface NavItem {
  key: "dashboard" | "transactions" | "upload" | "household" | "settings";
  to: string;
  icon: IconName;
}

const NAV: NavItem[] = [
  { key: "dashboard", to: "/", icon: "chart" },
  { key: "transactions", to: "/transactions", icon: "list" },
  { key: "upload", to: "/upload", icon: "upload" },
  { key: "household", to: "/household", icon: "people" },
  { key: "settings", to: "/settings", icon: "settings" },
];

function isActive(item: NavItem, path: string): boolean {
  return item.to === "/" ? path === "/" : path.startsWith(item.to);
}

function UserMenu() {
  const { user, role } = useCurrent();
  const { setState } = useStore();
  const [open, setOpen] = useState(false);
  const roles: Role[] = ["admin", "partner", "limited"];
  const switchRole = (r: Role) =>
    setState((s) =>
      s.session ? { ...s, session: { ...s.session, roleOverride: r } } : s,
    );
  const signOut = () => {
    setState((s) => ({
      ...s,
      session: null,
      signedOutReason: "signed-out",
      queue: [],
    }));
    navigate("/sign-in");
  };
  return (
    <div className="popover-anchor popover-anchor--end">
      <button
        type="button"
        className="avatar-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={t(he.userMenu.open, { name: user.displayName })}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="avatar" aria-hidden="true">
          {initials(user.displayName)}
        </span>
        <span className="avatar-btn__role">{he.roles[role]}</span>
      </button>
      {open ? (
        <Popover
          label={t(he.userMenu.open, { name: user.displayName })}
          onClose={() => setOpen(false)}
          className="user-menu"
        >
          <div className="user-menu__who">
            <strong>{user.displayName}</strong>
            <bdi dir="ltr" className="muted">
              {user.email}
            </bdi>
          </div>
          <fieldset className="user-menu__roles">
            <legend>
              {he.userMenu.viewAs}{" "}
              <span className="tag-proto">{he.userMenu.prototypeTag}</span>
            </legend>
            {roles.map((r) => (
              <label key={r} className="radio-row">
                <input
                  type="radio"
                  name="view-as"
                  checked={role === r}
                  onChange={() => switchRole(r)}
                />
                {he.roles[r]}
              </label>
            ))}
          </fieldset>
          <button
            type="button"
            className="btn btn--ghost btn--block"
            onClick={() => {
              setOpen(false);
              navigate("/settings");
            }}
          >
            <Icon name="settings" />
            {he.userMenu.settings}
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={signOut}
          >
            {he.userMenu.signOut}
          </button>
        </Popover>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { path } = useLocation();
  const { data, can } = useCurrent();
  const waiting = data.documents.filter(
    (d) => d.status === "awaiting-review",
  ).length;
  const items = NAV.filter((i) => i.key !== "upload" || can("upload"));
  const badge = (item: NavItem) =>
    item.key === "upload" && waiting > 0 ? (
      <span
        className="nav-badge"
        aria-label={t(he.nav.waitingBadge, { n: waiting })}
      >
        {waiting}
      </span>
    ) : null;

  return (
    <div className="shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        {he.skipToContent}
      </a>
      <PrototypeBanner />
      <header className="topbar">
        <Link to="/" className="topbar__brand">
          <span className="logo-mark" aria-hidden="true">
            <Icon name="logo" size={18} />
          </span>
          {he.appName}
        </Link>
        <div className="topbar__end">
          <span className="topbar__household">{data.household.name}</span>
          <UserMenu />
        </div>
      </header>
      <div className="shell__body">
        <nav className="sidenav" aria-label={he.nav.label}>
          <ul>
            {items.map((item) => {
              const active = isActive(item, path);
              return (
                <li key={item.key}>
                  <Link
                    to={item.to}
                    className={`sidenav__item ${active ? "is-active" : ""}`}
                    aria-current={active ? "page" : undefined}
                    title={he.nav[item.key]}
                  >
                    <Icon name={item.icon} />
                    <span className="sidenav__label">{he.nav[item.key]}</span>
                    {badge(item)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main id="main" className="main" tabIndex={-1}>
          {children}
        </main>
      </div>
      <nav className="bottomnav" aria-label={he.nav.label}>
        {items.map((item) => {
          const active = isActive(item, path);
          return (
            <Link
              key={item.key}
              to={item.to}
              className={`bottomnav__item ${active ? "is-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon name={item.icon} />
              <span>
                {item.key === "upload" ? he.nav.uploadShort : he.nav[item.key]}
              </span>
              {badge(item)}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      {children ? <div className="page-header__actions">{children}</div> : null}
    </div>
  );
}
