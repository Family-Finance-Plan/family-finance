/** Household: members (labels), users and roles, tags (household.md). Invites are mocks. */
import { type FormEvent, useState } from "react";
import { PageHeader } from "../components/AppShell";
import { ErrorState, SkeletonRows, useToast } from "../components/feedback";
import { Icon } from "../components/Icon";
import { Modal, Popover } from "../components/overlays";
import { memberColors } from "../demo/household";
import type { Member, Role, User } from "../demo/types";
import { formatDate, initials, t } from "../lib/format";
import { Link, navigate, useLocation } from "../lib/router";
import { isActive } from "../lib/selectors";
import { he } from "../locale/he";
import { deleteTag, newId, removeMember } from "../state/household-data";
import { useCurrent } from "../state/store";

type Tab = "members" | "users" | "tags";
const ROLES: Role[] = ["admin", "partner", "limited"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span
      className="avatar"
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

function ConfirmDialog({
  title,
  text,
  confirmLabel,
  onConfirm,
  onClose,
  danger = true,
}: {
  title: string;
  text: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <Modal
      title={title}
      size="sm"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            {he.common.cancel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn--danger" : "btn--primary"}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p>{text}</p>
    </Modal>
  );
}

function MemberDialog({
  member,
  onClose,
  onInvite,
}: {
  member: Member | null;
  onClose: () => void;
  onInvite: (memberId: string) => void;
}) {
  const { data, update } = useCurrent();
  const toast = useToast();
  const [name, setName] = useState(member?.name ?? "");
  const [color, setColor] = useState<string>(
    member?.color ??
      memberColors[data.members.length % memberColors.length] ??
      "#2952CC",
  );
  const [alsoInvite, setAlsoInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError(he.household.nameRequired);
    if (data.members.some((m) => m.name === trimmed && m.id !== member?.id))
      return setError(he.household.duplicateName);
    if (member) {
      update((d) => ({
        ...d,
        members: d.members.map((m) =>
          m.id === member.id ? { ...m, name: trimmed, color } : m,
        ),
      }));
      toast.show(he.household.memberSaved);
      onClose();
      return;
    }
    const id = newId("m");
    update((d) => ({
      ...d,
      members: [...d.members, { id, name: trimmed, kind: "person", color }],
    }));
    toast.show(t(he.household.memberAdded, { name: trimmed }));
    onClose();
    if (alsoInvite) onInvite(id);
  };
  return (
    <Modal
      title={
        member ? he.household.editMemberTitle : he.household.addMemberTitle
      }
      onClose={onClose}
      size="sm"
      footer={
        <>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            {he.common.cancel}
          </button>
          <button type="submit" form="member-form" className="btn btn--primary">
            {he.common.save}
          </button>
        </>
      }
    >
      <form id="member-form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">{he.household.memberName}</span>
          <input
            type="text"
            value={name}
            maxLength={30}
            required
            data-autofocus
            aria-invalid={error !== null}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />
          {error ? (
            <span className="field-error" role="alert">
              {error}
            </span>
          ) : null}
        </label>
        <fieldset className="field-block">
          <legend className="field-label">{he.household.color}</legend>
          <div className="swatches">
            {memberColors.map((c, i) => (
              <label key={c} className="swatch" style={{ backgroundColor: c }}>
                <input
                  type="radio"
                  name="member-color"
                  className="sr-only"
                  checked={color === c}
                  onChange={() => setColor(c)}
                  aria-label={t(he.household.colorOption, { n: i + 1 })}
                />
                {color === c ? <Icon name="check" size={16} /> : null}
              </label>
            ))}
          </div>
        </fieldset>
        {!member ? (
          <label className="check-row">
            <input
              type="checkbox"
              checked={alsoInvite}
              onChange={(e) => setAlsoInvite(e.target.checked)}
            />
            {he.household.alsoInvite}
          </label>
        ) : null}
      </form>
    </Modal>
  );
}

function InviteDialog({
  presetMemberId,
  onClose,
}: {
  presetMemberId: string | null;
  onClose: () => void;
}) {
  const { data, update } = useCurrent();
  const candidates = data.members.filter(
    (m) => m.kind === "person" && !m.userId,
  );
  const [memberId, setMemberId] = useState<string>(
    presetMemberId ?? candidates[0]?.id ?? "new",
  );
  const [newName, setNewName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("partner");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<User | null>(null);
  const [copied, setCopied] = useState(false);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!EMAIL.test(mail)) return setError(he.household.invalidEmail);
    const existing = data.users.find((u) => u.email.toLowerCase() === mail);
    if (existing)
      return setError(
        existing.status === "invited"
          ? he.household.alreadyInvited
          : he.household.alreadyUser,
      );
    if (memberId === "new" && !newName.trim())
      return setError(he.household.nameRequired);
    const userId = newId("u");
    const member = data.members.find((m) => m.id === memberId);
    const displayName =
      memberId === "new" ? newName.trim() : (member?.name ?? "");
    const user: User = {
      id: userId,
      displayName,
      email: mail,
      role,
      status: "invited",
      invitedAt: "2026-10-15",
    };
    update((d) => ({
      ...d,
      users: [...d.users, user],
      members:
        memberId === "new"
          ? [
              ...d.members,
              {
                id: newId("m"),
                name: displayName,
                kind: "person",
                color:
                  memberColors[d.members.length % memberColors.length] ??
                  "#2952CC",
                userId,
              },
            ]
          : d.members.map((m) => (m.id === memberId ? { ...m, userId } : m)),
    }));
    setCreated(user);
  };
  if (created) {
    const link = `https://family-finance.example/invite/${created.id}`;
    return (
      <Modal
        title={he.household.inviteCreated}
        onClose={onClose}
        size="sm"
        footer={
          <button type="button" className="btn btn--primary" onClick={onClose}>
            {he.common.close}
          </button>
        }
      >
        <p className="success-line">
          <Icon name="check" />
          {he.household.inviteCreated}
        </p>
        <p className="muted">{he.household.inviteMockNote}</p>
        <label className="field">
          <span className="field-label">{he.household.inviteLink}</span>
          <span className="copy-row">
            <input type="text" readOnly dir="ltr" value={link} />
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => {
                void navigator.clipboard
                  ?.writeText(link)
                  .catch(() => undefined);
                setCopied(true);
              }}
            >
              <Icon name="copy" size={16} />
              {he.household.copy}
            </button>
          </span>
        </label>
        <p className="hint" role="status" aria-live="polite">
          {copied ? he.household.copied : ""}
        </p>
        <Link to={`/invite/accept?invite=${created.id}`} className="link-btn">
          {he.household.showInvite}
        </Link>
      </Modal>
    );
  }
  return (
    <Modal
      title={he.household.inviteTitle}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
          >
            {he.common.cancel}
          </button>
          <button type="submit" form="invite-form" className="btn btn--primary">
            {he.household.sendInvite}
          </button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} noValidate>
        <label className="field">
          <span className="field-label">{he.household.inviteMember}</span>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
          >
            {candidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
            <option value="new">{he.household.newMemberOption}</option>
          </select>
        </label>
        {memberId === "new" ? (
          <label className="field">
            <span className="field-label">{he.household.newMemberName}</span>
            <input
              type="text"
              value={newName}
              maxLength={30}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
        ) : null}
        <label className="field">
          <span className="field-label">{he.household.inviteEmail}</span>
          <input
            type="email"
            dir="ltr"
            required
            value={email}
            placeholder="name@example.com"
            aria-invalid={error !== null}
            aria-describedby="invite-email-hint"
            data-autofocus
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />
          <span className="hint" id="invite-email-hint">
            {he.household.inviteEmailHint}
          </span>
          {error ? (
            <span className="field-error" role="alert">
              {error}
            </span>
          ) : null}
        </label>
        <fieldset className="field-block">
          <legend className="field-label">{he.household.inviteRole}</legend>
          {ROLES.map((r) => (
            <label key={r} className="radio-card">
              <input
                type="radio"
                name="invite-role"
                checked={role === r}
                onChange={() => setRole(r)}
              />
              <span>
                <strong>{he.roles[r]}</strong>
                <span className="hint">{he.roles[`${r}Desc` as const]}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </form>
    </Modal>
  );
}

function UserActions({
  u,
  onConfirm,
}: {
  u: User;
  onConfirm: (c: {
    title: string;
    text: string;
    label: string;
    action: () => void;
  }) => void;
}) {
  const { data, update, user: me } = useCurrent();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const admins = data.users.filter(
    (x) => x.role === "admin" && x.status === "active",
  ).length;
  const lastAdmin = u.role === "admin" && admins <= 1;
  const setStatus = (status: User["status"]) =>
    update((d) => ({
      ...d,
      users: d.users.map((x) => (x.id === u.id ? { ...x, status } : x)),
    }));
  const removeUser = () =>
    update((d) => ({
      ...d,
      users: d.users.filter((x) => x.id !== u.id),
      members: d.members.map((m) =>
        m.userId === u.id ? (({ userId: _u, ...rest }) => rest)(m) : m,
      ),
    }));
  return (
    <span className="popover-anchor popover-anchor--end">
      <button
        type="button"
        className="icon-btn"
        aria-label={`${he.household.actions}: ${u.displayName}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more" />
      </button>
      {open ? (
        <Popover
          label={`${he.household.actions}: ${u.displayName}`}
          onClose={() => setOpen(false)}
          className="menu"
        >
          {u.status === "invited" ? (
            <>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  setOpen(false);
                  toast.show(he.household.resent);
                }}
              >
                {he.household.resend}
              </button>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  setOpen(false);
                  setStatus("active");
                  toast.show(
                    t(he.household.inviteAccepted, { name: u.displayName }),
                  );
                }}
              >
                {he.household.simulateAccept}{" "}
                <span className="tag-proto">{he.userMenu.prototypeTag}</span>
              </button>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  setOpen(false);
                  navigate(`/invite/accept?invite=${u.id}`);
                }}
              >
                {he.household.showInvite}
              </button>
              <button
                type="button"
                className="menu__item menu__item--danger"
                onClick={() => {
                  setOpen(false);
                  removeUser();
                  toast.show(he.household.inviteCancelled);
                }}
              >
                {he.household.cancelInvite}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="menu__item menu__item--danger"
              disabled={lastAdmin || u.id === me.id}
              title={lastAdmin ? he.household.lastAdmin : undefined}
              onClick={() => {
                setOpen(false);
                onConfirm({
                  title: he.household.removeAccess,
                  text: t(he.household.removeAccessConfirm, {
                    name: u.displayName,
                  }),
                  label: he.household.removeAccess,
                  action: () => {
                    removeUser();
                    toast.show(he.household.accessRemoved);
                  },
                });
              }}
            >
              {he.household.removeAccess}
            </button>
          )}
        </Popover>
      ) : null}
    </span>
  );
}

export function HouseholdPage() {
  const { data, update, can, user: me } = useCurrent();
  const toast = useToast();
  const { query } = useLocation();
  const [retried, setRetried] = useState(false);
  const forced = retried ? null : query.get("state");
  const [tab, setTab] = useState<Tab>("members");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(data.household.name);
  const [memberDialog, setMemberDialog] = useState<Member | "new" | null>(null);
  const [invite, setInvite] = useState<{ memberId: string | null } | null>(
    null,
  );
  const [confirm, setConfirm] = useState<{
    title: string;
    text: string;
    label: string;
    action: () => void;
  } | null>(null);
  const [newTag, setNewTag] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [tagError, setTagError] = useState<string | null>(null);
  const canMembers = can("manageMembers");
  const canUsers = can("manageUsers");
  const canTags = can("manageTags");
  const active = data.transactions.filter(isActive);
  const memberCount = (id: string) =>
    active.filter((x) => x.memberIds.includes(id)).length;
  const tagCount = (id: string) =>
    active.filter((x) => x.tagIds.includes(id)).length;
  const admins = data.users.filter(
    (x) => x.role === "admin" && x.status === "active",
  ).length;
  const members = data.members.toSorted((a, b) =>
    a.kind === "family" ? -1 : b.kind === "family" ? 1 : 0,
  );

  const saveName = (e: FormEvent) => {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    update((d) => ({
      ...d,
      household: { ...d.household, name: nameDraft.trim().slice(0, 40) },
    }));
    setEditingName(false);
    toast.show(he.household.nameSaved);
  };
  const saveTag = (id: string | null, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (data.tags.some((tg) => tg.name === trimmed && tg.id !== id)) {
      setTagError(he.household.tagDuplicate);
      return;
    }
    if (id)
      update((d) => ({
        ...d,
        tags: d.tags.map((tg) =>
          tg.id === id ? { ...tg, name: trimmed } : tg,
        ),
      }));
    else
      update((d) => ({
        ...d,
        tags: [...d.tags, { id: newId("t"), name: trimmed }],
      }));
    setRenaming(null);
    setNewTag(null);
    setTagError(null);
    toast.show(he.household.tagSaved);
  };

  if (forced === "error") {
    return (
      <div className="page">
        <PageHeader title={he.household.title} />
        <ErrorState
          message={he.household.error}
          onRetry={() => setRetried(true)}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader title={he.household.title}>
        {editingName ? (
          <form className="inline-form" onSubmit={saveName}>
            <label className="sr-only" htmlFor="hh-name">
              {he.household.nameLabel}
            </label>
            <input
              id="hh-name"
              type="text"
              value={nameDraft}
              maxLength={40}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
            />
            <button type="submit" className="btn btn--primary btn--sm">
              {he.common.save}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setEditingName(false)}
            >
              {he.common.cancel}
            </button>
          </form>
        ) : (
          <span className="hh-name">
            <span className="muted">{he.household.nameLabel}:</span>{" "}
            <strong>{data.household.name}</strong>
            {canMembers ? (
              <button
                type="button"
                className="icon-btn"
                aria-label={he.household.editName}
                onClick={() => {
                  setNameDraft(data.household.name);
                  setEditingName(true);
                }}
              >
                <Icon name="edit" size={18} />
              </button>
            ) : null}
          </span>
        )}
      </PageHeader>

      <div className="tabs" role="tablist" aria-label={he.household.tabsLabel}>
        {(["members", "users", "tags"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            id={`tab-${k}`}
            aria-selected={tab === k}
            aria-controls={`panel-${k}`}
            className={tab === k ? "is-on" : ""}
            onClick={() => setTab(k)}
          >
            {he.household.tabs[k]}
          </button>
        ))}
      </div>

      <section
        className="card card--flush"
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
      >
        {forced === "loading" ? (
          <SkeletonRows rows={4} />
        ) : tab === "members" ? (
          <>
            <div className="card__header card__header--padded">
              <h2 className="card__title">{he.household.tabs.members}</h2>
              {canMembers ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setMemberDialog("new")}
                >
                  {he.household.addMember}
                </button>
              ) : (
                <span className="muted">{he.household.readOnlyMembers}</span>
              )}
            </div>
            <ul className="row-list">
              {members.map((m) => {
                const linkedUser = m.userId
                  ? data.users.find((u) => u.id === m.userId)
                  : undefined;
                const n = memberCount(m.id);
                return (
                  <li
                    key={m.id}
                    className={`row-list__item ${m.kind === "family" ? "row-list__item--pinned" : ""}`}
                  >
                    <Avatar name={m.name} color={m.color} />
                    <div className="row-list__main">
                      <strong>{m.name}</strong>
                      {m.kind === "family" ? (
                        <span className="muted">{he.household.familyNote}</span>
                      ) : null}
                    </div>
                    <div className="row-list__meta">
                      <span className="muted">{he.household.usesApp}:</span>{" "}
                      {linkedUser
                        ? t(he.household.usesAppYes, {
                            role: he.roles[linkedUser.role],
                          })
                        : he.common.no}
                    </div>
                    <div className="row-list__meta">
                      <Link to={`/transactions?member=${m.id}&period=all`}>
                        {n} {he.household.assignedCount}
                      </Link>
                    </div>
                    <div className="row-list__actions">
                      {canMembers && m.kind !== "family" ? (
                        <>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={t(he.household.editMember, {
                              name: m.name,
                            })}
                            onClick={() => setMemberDialog(m)}
                          >
                            <Icon name="edit" size={18} />
                          </button>
                          <button
                            type="button"
                            className="icon-btn"
                            aria-label={t(he.household.removeMember, {
                              name: m.name,
                            })}
                            disabled={Boolean(m.userId)}
                            title={
                              m.userId
                                ? he.household.removeUserFirst
                                : undefined
                            }
                            onClick={() =>
                              setConfirm({
                                title: t(he.household.removeMemberTitle, {
                                  name: m.name,
                                }),
                                text:
                                  n > 0
                                    ? t(he.household.removeMemberText, {
                                        name: m.name,
                                        n,
                                      })
                                    : t(he.household.removeMemberSimple, {
                                        name: m.name,
                                      }),
                                label: he.common.remove,
                                action: () => {
                                  update((d) => removeMember(d, m.id));
                                  toast.show(
                                    t(he.household.memberRemoved, {
                                      name: m.name,
                                    }),
                                  );
                                },
                              })
                            }
                          >
                            <Icon name="trash" size={18} />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
            {data.members.filter((m) => m.kind === "person").length <= 1 ? (
              <p className="muted card__pad">{he.household.membersEmpty}</p>
            ) : null}
          </>
        ) : tab === "users" ? (
          <>
            <div className="card__header card__header--padded">
              <h2 className="card__title">{he.household.tabs.users}</h2>
              {canUsers ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setInvite({ memberId: null })}
                >
                  {he.household.invite}
                </button>
              ) : (
                <span className="muted">{he.household.onlyAdmin}</span>
              )}
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">{he.household.memberName}</th>
                    <th scope="col">{he.household.email}</th>
                    <th scope="col">{he.household.role}</th>
                    <th scope="col">{he.household.status}</th>
                    <th scope="col">
                      <span className="sr-only">{he.household.actions}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u) => {
                    const lastAdmin =
                      u.role === "admin" &&
                      admins <= 1 &&
                      u.status === "active";
                    return (
                      <tr key={u.id}>
                        <td>
                          <strong>{u.displayName}</strong>{" "}
                          {u.id === me.id ? (
                            <span className="muted">({he.common.you})</span>
                          ) : null}
                        </td>
                        <td>
                          <bdi dir="ltr">{u.email}</bdi>
                        </td>
                        <td>
                          {canUsers ? (
                            <select
                              aria-label={t(he.household.roleFor, {
                                name: u.displayName,
                              })}
                              value={u.role}
                              disabled={lastAdmin}
                              title={
                                lastAdmin ? he.household.lastAdmin : undefined
                              }
                              onChange={(e) => {
                                const role = e.target.value as Role;
                                setConfirm({
                                  title: he.household.role,
                                  text: t(he.household.confirmRole, {
                                    name: u.displayName,
                                    role: he.roles[role],
                                  }),
                                  label: he.common.confirm,
                                  action: () => {
                                    update((d) => ({
                                      ...d,
                                      users: d.users.map((x) =>
                                        x.id === u.id ? { ...x, role } : x,
                                      ),
                                    }));
                                    toast.show(he.household.roleChanged);
                                  },
                                });
                              }}
                            >
                              {ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {he.roles[r]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            he.roles[u.role]
                          )}
                          {lastAdmin && canUsers ? (
                            <div className="hint">{he.household.lastAdmin}</div>
                          ) : null}
                        </td>
                        <td>
                          <span
                            className={`badge ${u.status === "active" ? "badge--income" : "badge--expected"}`}
                          >
                            {u.status === "active"
                              ? he.household.active
                              : t(he.household.invitedPending, {
                                  date: u.invitedAt
                                    ? formatDate(u.invitedAt)
                                    : "",
                                })}
                          </span>
                        </td>
                        <td className="col-end">
                          {canUsers ? (
                            <UserActions u={u} onConfirm={setConfirm} />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {data.users.length <= 1 ? (
              <p className="muted card__pad">{he.household.usersOnlyAdmin}</p>
            ) : null}
          </>
        ) : (
          <>
            <div className="card__header card__header--padded">
              <h2 className="card__title">{he.household.tabs.tags}</h2>
              {canTags ? (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    setNewTag("");
                    setTagError(null);
                  }}
                >
                  {he.household.newTag}
                </button>
              ) : (
                <span className="muted">{he.household.readOnlyTags}</span>
              )}
            </div>
            <ul className="row-list">
              {newTag !== null ? (
                <li className="row-list__item">
                  <form
                    className="inline-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveTag(null, newTag);
                    }}
                  >
                    <label className="sr-only" htmlFor="new-tag">
                      {he.household.tagName}
                    </label>
                    <input
                      id="new-tag"
                      type="text"
                      value={newTag}
                      autoFocus
                      maxLength={30}
                      onChange={(e) => setNewTag(e.target.value)}
                    />
                    <button type="submit" className="btn btn--primary btn--sm">
                      {he.common.save}
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setNewTag(null)}
                    >
                      {he.common.cancel}
                    </button>
                    {tagError ? (
                      <span className="field-error">{tagError}</span>
                    ) : null}
                  </form>
                </li>
              ) : null}
              {data.tags.map((tg) => (
                <li key={tg.id} className="row-list__item">
                  {renaming?.id === tg.id ? (
                    <form
                      className="inline-form"
                      onSubmit={(e) => {
                        e.preventDefault();
                        saveTag(tg.id, renaming.name);
                      }}
                    >
                      <label className="sr-only" htmlFor={`tag-${tg.id}`}>
                        {t(he.household.renameTagFor, { name: tg.name })}
                      </label>
                      <input
                        id={`tag-${tg.id}`}
                        type="text"
                        value={renaming.name}
                        autoFocus
                        maxLength={30}
                        onChange={(e) =>
                          setRenaming({ id: tg.id, name: e.target.value })
                        }
                      />
                      <button
                        type="submit"
                        className="btn btn--primary btn--sm"
                      >
                        {he.common.save}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setRenaming(null)}
                      >
                        {he.common.cancel}
                      </button>
                      {tagError ? (
                        <span className="field-error">{tagError}</span>
                      ) : null}
                    </form>
                  ) : (
                    <>
                      <span className="chip chip--outline">#{tg.name}</span>
                      <div className="row-list__main" />
                      <div className="row-list__meta">
                        <Link to={`/transactions?tag=${tg.id}&period=all`}>
                          {tagCount(tg.id)} {he.household.tagCount}
                        </Link>
                      </div>
                      <div className="row-list__actions">
                        {canTags ? (
                          <>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              aria-label={t(he.household.renameTagFor, {
                                name: tg.name,
                              })}
                              onClick={() => {
                                setRenaming({ id: tg.id, name: tg.name });
                                setTagError(null);
                              }}
                            >
                              {he.household.renameTag}
                            </button>
                            <button
                              type="button"
                              className="btn btn--danger-text btn--sm"
                              aria-label={t(he.household.deleteTagFor, {
                                name: tg.name,
                              })}
                              onClick={() =>
                                setConfirm({
                                  title: t(he.household.deleteTagFor, {
                                    name: tg.name,
                                  }),
                                  text: t(he.household.deleteTagConfirm, {
                                    n: tagCount(tg.id),
                                  }),
                                  label: he.household.deleteTag,
                                  action: () => {
                                    update((d) => deleteTag(d, tg.id));
                                    toast.show(he.household.tagDeleted);
                                  },
                                })
                              }
                            >
                              {he.household.deleteTag}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {data.tags.length === 0 && newTag === null ? (
              <p className="muted card__pad">{he.household.tagsEmpty}</p>
            ) : null}
          </>
        )}
      </section>

      <details className="card roles-explainer">
        <summary className="card__title">{he.household.rolesExplainer}</summary>
        <dl className="roles-list">
          {ROLES.map((r) => (
            <div key={r}>
              <dt>{he.roles[r]}</dt>
              <dd>{he.roles[`${r}Desc` as const]}</dd>
            </div>
          ))}
        </dl>
      </details>

      {memberDialog ? (
        <MemberDialog
          member={memberDialog === "new" ? null : memberDialog}
          onClose={() => setMemberDialog(null)}
          onInvite={(memberId) =>
            canUsers ? setInvite({ memberId }) : undefined
          }
        />
      ) : null}
      {invite ? (
        <InviteDialog
          presetMemberId={invite.memberId}
          onClose={() => setInvite(null)}
        />
      ) : null}
      {confirm ? (
        <ConfirmDialog
          title={confirm.title}
          text={confirm.text}
          confirmLabel={confirm.label}
          onConfirm={confirm.action}
          onClose={() => setConfirm(null)}
          danger={confirm.label !== he.common.confirm}
        />
      ) : null}
    </div>
  );
}
