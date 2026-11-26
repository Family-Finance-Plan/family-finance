/** Empty, error and loading states, and the undo toast (docs/ux/README.md). */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { he } from "../locale/he";
import { Icon, type IconName } from "./Icon";

export function EmptyState({
  icon = "file",
  title,
  text,
  action,
  secondary,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
  secondary?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <Icon name={icon} size={28} />
      </span>
      <h2 className="empty-state__title">{title}</h2>
      {text ? <p className="empty-state__text">{text}</p> : null}
      {action || secondary ? (
        <div className="empty-state__actions">
          {action}
          {secondary}
        </div>
      ) : null}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="error-state" role="alert">
      <Icon name="error" size={24} />
      <p>{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          {he.common.retry}
        </button>
      ) : null}
    </div>
  );
}

export function Skeleton({
  inline = "100%",
  block = 16,
  className,
}: {
  inline?: string;
  block?: number;
  className?: string;
}) {
  return (
    <span
      className={`skeleton ${className ?? ""}`}
      style={{ inlineSize: inline, blockSize: `${block}px` }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRows({ rows }: { rows: number }) {
  return (
    <div
      className="skeleton-rows"
      aria-busy="true"
      aria-label={he.common.loading}
    >
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <Skeleton inline="12%" />
          <Skeleton inline="38%" />
          <Skeleton inline="18%" />
          <Skeleton inline="14%" />
        </div>
      ))}
    </div>
  );
}

// --- Toasts -------------------------------------------------------------------------------------

interface Toast {
  id: number;
  message: string;
  tone: "info" | "danger";
  action?: { label: string; onClick: () => void };
}

interface ToastApi {
  show: (
    message: string,
    options?: {
      action?: Toast["action"];
      tone?: Toast["tone"];
      durationMs?: number;
    },
  ) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const dismiss = useCallback(
    (id: number) => setToasts((ts) => ts.filter((x) => x.id !== id)),
    [],
  );
  const show = useCallback<ToastApi["show"]>(
    (message, options = {}) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((ts) => [
        ...ts.slice(-2),
        {
          id,
          message,
          tone: options.tone ?? "info",
          ...(options.action ? { action: options.action } : {}),
        },
      ]);
      setTimeout(() => dismiss(id), options.durationMs ?? 6000);
    },
    [dismiss],
  );
  const api = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="toasts"
        role="status"
        aria-live="polite"
        aria-label={he.common.notifications}
      >
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tone}`}>
            <span>{toast.message}</span>
            {toast.action ? (
              <button
                type="button"
                className="toast__action"
                onClick={() => {
                  toast.action?.onClick();
                  dismiss(toast.id);
                }}
              >
                {toast.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="icon-btn icon-btn--xs toast__close"
              aria-label={he.common.dismiss}
              onClick={() => dismiss(toast.id)}
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(ToastContext);
  if (!v) throw new Error("useToast outside ToastProvider");
  return v;
}
