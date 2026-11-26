/** Sign in (mock Google), first-run household setup and invite acceptance (sign-in.md). */
import { type FormEvent, useEffect, useRef, useState } from "react";
import { PrototypeBanner } from "../components/AppShell";
import { useToast } from "../components/feedback";
import { GoogleMark, Icon } from "../components/Icon";
import { Modal } from "../components/overlays";
import { memberColors, NEW_USER_ID } from "../demo/household";
import type { Member, Role, User } from "../demo/types";
import { initials, t } from "../lib/format";
import { navigate, useLocation } from "../lib/router";
import { he } from "../locale/he";
import { createEmptyHousehold, newId } from "../state/household-data";
import { findUser, useStore } from "../state/store";

type SignInError = "cancelled" | "unverified" | "network";
const ERRORS: SignInError[] = ["cancelled", "unverified", "network"];

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <PrototypeBanner />
      <main id="main" className="auth__main">
        <div className="auth__card card">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="auth__brand">
      <span className="logo-mark logo-mark--lg" aria-hidden="true">
        <Icon name="logo" size={28} />
      </span>
      <h1 className="auth__title">{he.appName}</h1>
      <p className="auth__tagline">{he.signIn.tagline}</p>
    </div>
  );
}

export function SignInPage() {
  const { state, setState } = useStore();
  const [chooser, setChooser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<SignInError | null>(null);
  const errorIndex = useRef(0);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    buttonRef.current?.focus();
  }, []);

  const signInAs = (userId: string, householdId: string | null) => {
    setChooser(false);
    setLoading(true);
    setError(null);
    setTimeout(() => {
      setState((s) => ({
        ...s,
        session: { userId, householdId },
        signedOutReason: null,
      }));
      navigate(householdId ? "/" : "/setup");
    }, 600);
  };
  const simulateError = () => {
    setChooser(false);
    setError(ERRORS[errorIndex.current % ERRORS.length] ?? "cancelled");
    errorIndex.current += 1;
  };

  return (
    <AuthLayout>
      <Brand />
      {state.signedOutReason ? (
        <p className="info-line" role="status">
          <Icon name="info" size={16} />
          {state.signedOutReason === "expired"
            ? he.signIn.expired
            : he.signIn.signedOut}
        </p>
      ) : null}
      <button
        ref={buttonRef}
        type="button"
        className="google-btn"
        onClick={() => setChooser(true)}
        disabled={loading}
        aria-haspopup="dialog"
      >
        {loading ? (
          <span className="spinner" aria-hidden="true" />
        ) : (
          <GoogleMark />
        )}
        <span>{loading ? he.signIn.connecting : he.signIn.google}</span>
      </button>
      {error ? (
        <div className="form-error" role="alert">
          <p>{he.signIn[error]}</p>
          {error === "network" ? (
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setChooser(true)}
            >
              {he.common.retry}
            </button>
          ) : null}
        </div>
      ) : null}
      <p className="auth__privacy">{he.signIn.privacy}</p>
      <p className="auth__privacy">{he.signIn.mfaTip}</p>

      {chooser ? (
        <Modal
          title={he.signIn.chooserTitle}
          onClose={() => setChooser(false)}
          size="sm"
        >
          <p className="muted">{he.signIn.chooserNote}</p>
          <ul className="chooser">
            <li>
              <button
                type="button"
                className="chooser__item"
                onClick={() => signInAs("u-parent-a", "hh-demo")}
                data-autofocus
              >
                <span className="avatar" aria-hidden="true">
                  {initials(findUser(state, "u-parent-a")?.displayName ?? "")}
                </span>
                <span>
                  {he.signIn.asParentA}
                  <bdi dir="ltr" className="chooser__email">
                    {findUser(state, "u-parent-a")?.email}
                  </bdi>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="chooser__item"
                onClick={() => signInAs("u-parent-b", "hh-demo")}
              >
                <span className="avatar avatar--b" aria-hidden="true">
                  {initials(findUser(state, "u-parent-b")?.displayName ?? "")}
                </span>
                <span>
                  {he.signIn.asParentB}
                  <bdi dir="ltr" className="chooser__email">
                    {findUser(state, "u-parent-b")?.email}
                  </bdi>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="chooser__item"
                onClick={() => {
                  const hh = Object.values(state.households).find((h) =>
                    h.users.some((u) => u.id === NEW_USER_ID),
                  );
                  signInAs(NEW_USER_ID, hh?.household.id ?? null);
                }}
              >
                <span className="avatar avatar--new" aria-hidden="true">
                  <Icon name="plus" size={16} />
                </span>
                <span>
                  {he.signIn.asNewUser}
                  <bdi dir="ltr" className="chooser__email">
                    {findUser(state, NEW_USER_ID)?.email}
                  </bdi>
                </span>
              </button>
            </li>
            <li>
              <button
                type="button"
                className="chooser__item chooser__item--error"
                onClick={simulateError}
              >
                <span className="avatar avatar--error" aria-hidden="true">
                  <Icon name="warning" size={16} />
                </span>
                <span>
                  {he.signIn.simulateError}
                  <span className="chooser__email">
                    {he.signIn.simulateErrorHint}
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </Modal>
      ) : null}
    </AuthLayout>
  );
}

interface MemberDraft {
  key: string;
  name: string;
  usesApp: boolean;
  email: string;
  role: Role;
}

export function SetupPage() {
  const { state, setState } = useStore();
  const toast = useToast();
  const session = state.session;
  const me = session ? findUser(state, session.userId) : undefined;
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);
  const [members, setMembers] = useState<MemberDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lastAdded = useRef<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);
  useEffect(() => {
    if (lastAdded.current) {
      document.getElementById(`member-${lastAdded.current}`)?.focus();
      lastAdded.current = null;
    }
  }, [members]);

  if (!session || !me) return null;

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(true);
      return;
    }
    setStep(2);
  };
  const create = (e: FormEvent) => {
    e.preventDefault();
    if (members.some((m) => !m.name.trim())) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const householdId = newId("hh");
      const memberList: Member[] = [
        {
          id: newId("m"),
          name: he.setup.familyTag,
          kind: "family",
          color: "#4A5568",
        },
        {
          id: newId("m"),
          name: me.displayName,
          kind: "person",
          color: memberColors[0],
          userId: me.id,
        },
        ...members.map((m, i): Member => ({
          id: newId("m"),
          name: m.name.trim(),
          kind: "person",
          color: memberColors[(i + 1) % memberColors.length] ?? "#4A5568",
        })),
      ];
      const users: User[] = [
        { ...me, role: "admin", status: "active" },
        ...members
          .filter((m) => m.usesApp && m.email.trim())
          .map((m): User => ({
            id: newId("u"),
            displayName: m.name.trim(),
            email: m.email.trim(),
            role: m.role,
            status: "invited",
            invitedAt: "2026-10-15",
          })),
      ];
      const hh = createEmptyHousehold(
        householdId,
        name.trim(),
        memberList,
        users,
      );
      setState((s) => ({
        ...s,
        households: { ...s.households, [householdId]: hh },
        looseUsers: s.looseUsers.filter((u) => u.id !== me.id),
        session: { userId: me.id, householdId },
      }));
      toast.show(he.setup.success);
      navigate("/");
    }, 700);
  };

  return (
    <AuthLayout>
      <p className="step-indicator">{t(he.setup.stepOf, { n: step })}</p>
      {step === 1 ? (
        <form onSubmit={next} noValidate>
          <h1 className="auth__title" tabIndex={-1} ref={headingRef}>
            {he.setup.step1Title}
          </h1>
          <label className="field">
            <span className="field-label">{he.setup.householdName}</span>
            <input
              type="text"
              value={name}
              maxLength={40}
              required
              placeholder={he.setup.householdNamePlaceholder}
              aria-invalid={nameError}
              aria-describedby="hh-name-hint"
              onChange={(e) => {
                setName(e.target.value);
                setNameError(false);
              }}
            />
            <span className="hint" id="hh-name-hint">
              {he.setup.householdNameHint}
            </span>
            {nameError ? (
              <span className="field-error" role="alert">
                {he.setup.householdNameRequired}
              </span>
            ) : null}
          </label>
          <div className="wizard-actions">
            <span />
            <button type="submit" className="btn btn--primary">
              {he.common.next}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={create} noValidate>
          <h1 className="auth__title" tabIndex={-1} ref={headingRef}>
            {he.setup.step2Title}
          </h1>
          <p className="muted">{he.setup.intro}</p>
          <ul className="member-rows">
            <li className="member-row member-row--me">
              <span className="avatar" aria-hidden="true">
                {me.displayName.slice(0, 1)}
              </span>
              <strong>{me.displayName}</strong>
              <span className="badge badge--neutral">{he.common.you}</span>
              <span className="badge badge--primary">{he.roles.admin}</span>
            </li>
            {members.map((m, i) => (
              <li key={m.key} className="member-row">
                <div className="member-row__fields">
                  <label className="field">
                    <span className="field-label">{he.setup.memberName}</span>
                    <input
                      id={`member-${m.key}`}
                      type="text"
                      value={m.name}
                      maxLength={30}
                      required
                      aria-invalid={showErrors && !m.name.trim()}
                      onChange={(e) =>
                        setMembers((ms) =>
                          ms.map((x) =>
                            x.key === m.key
                              ? { ...x, name: e.target.value }
                              : x,
                          ),
                        )
                      }
                    />
                    {showErrors && !m.name.trim() ? (
                      <span className="field-error">
                        {he.setup.memberNameRequired}
                      </span>
                    ) : null}
                  </label>
                  <label className="switch-row">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={m.usesApp}
                      onChange={(e) =>
                        setMembers((ms) =>
                          ms.map((x) =>
                            x.key === m.key
                              ? { ...x, usesApp: e.target.checked }
                              : x,
                          ),
                        )
                      }
                    />
                    {he.setup.usesApp}
                  </label>
                  {m.usesApp ? (
                    <div className="field-grid">
                      <label className="field">
                        <span className="field-label">
                          {he.setup.inviteEmail}
                        </span>
                        <input
                          type="email"
                          dir="ltr"
                          value={m.email}
                          placeholder="name@example.com"
                          onChange={(e) =>
                            setMembers((ms) =>
                              ms.map((x) =>
                                x.key === m.key
                                  ? { ...x, email: e.target.value }
                                  : x,
                              ),
                            )
                          }
                        />
                      </label>
                      <label className="field">
                        <span className="field-label">{he.setup.role}</span>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            setMembers((ms) =>
                              ms.map((x) =>
                                x.key === m.key
                                  ? { ...x, role: e.target.value as Role }
                                  : x,
                              ),
                            )
                          }
                        >
                          <option value="partner">{he.roles.partner}</option>
                          <option value="limited">{he.roles.limited}</option>
                          <option value="admin">{he.roles.admin}</option>
                        </select>
                      </label>
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t(he.setup.removeMember, {
                    name: m.name || `${he.setup.unnamedMember} ${i + 1}`,
                  })}
                  onClick={() =>
                    setMembers((ms) => ms.filter((x) => x.key !== m.key))
                  }
                >
                  <Icon name="trash" />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="link-btn"
            onClick={() => {
              const key = newId("draft");
              lastAdded.current = key;
              setMembers((ms) => [
                ...ms,
                { key, name: "", usesApp: false, email: "", role: "partner" },
              ]);
            }}
          >
            {he.setup.addMember}
          </button>
          <p className="family-chip-line">
            <span className="chip chip--solid">
              <span
                className="chip__dot"
                style={{ backgroundColor: "#4A5568" }}
                aria-hidden="true"
              />
              {he.setup.familyTag}
            </span>
            <span className="muted">{he.setup.familyTagNote}</span>
          </p>
          <div className="wizard-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setStep(1)}
            >
              {he.common.back}
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving}
            >
              {saving ? he.setup.creating : he.setup.create}
            </button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}

export function InviteAcceptPage() {
  const { query } = useLocation();
  const { state, setState } = useStore();
  const toast = useToast();
  const inviteId = query.get("invite") ?? "";
  const hh = Object.values(state.households).find((h) =>
    h.users.some((u) => u.id === inviteId && u.status === "invited"),
  );
  const invitee = hh?.users.find((u) => u.id === inviteId);
  const back = () => navigate(state.session ? "/household" : "/sign-in");
  const accept = () => {
    if (!hh || !invitee) return;
    setState((s) => {
      const target = s.households[hh.household.id];
      if (!target) return s;
      return {
        ...s,
        households: {
          ...s.households,
          [hh.household.id]: {
            ...target,
            users: target.users.map((u) =>
              u.id === invitee.id ? { ...u, status: "active" } : u,
            ),
          },
        },
      };
    });
    toast.show(he.invite.joined);
    back();
  };
  return (
    <AuthLayout>
      <Brand />
      {hh && invitee ? (
        <>
          <h2 className="auth__subtitle">
            {t(he.invite.title, { household: hh.household.name })}
          </h2>
          <p>{t(he.invite.roleLine, { role: he.roles[invitee.role] })}</p>
          <p className="hint">{he.invite.prototypeNote}</p>
          <div className="wizard-actions">
            <button type="button" className="btn btn--secondary" onClick={back}>
              {he.invite.notNow}
            </button>
            <button type="button" className="btn btn--primary" onClick={accept}>
              {he.invite.join}
            </button>
          </div>
        </>
      ) : (
        <div className="form-error" role="alert">
          <p>{he.invite.invalid}</p>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={back}
          >
            {he.common.back}
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
