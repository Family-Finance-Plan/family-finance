/**
 * Upload documents and upload history (upload-and-review.md). Prototype: only File.name and
 * File.size are used; file contents are never read, kept or logged (R-015).
 */
import { type DragEvent, useState } from "react";
import { PageHeader } from "../components/AppShell";
import { EmptyState, ErrorState, SkeletonRows } from "../components/feedback";
import { Icon } from "../components/Icon";
import type { UploadDocument } from "../demo/types";
import { formatDate, formatDateTime, formatSize, t } from "../lib/format";
import { Link, navigate, useLocation } from "../lib/router";
import { PHONE_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import { he } from "../locale/he";
import { newId } from "../state/household-data";
import { type QueueItem, useCurrent, useStore } from "../state/store";
import type { HouseholdData } from "../state/household-data";

export function detectedLabel(
  doc: UploadDocument,
  data: HouseholdData,
): string {
  if (!doc.detected) return he.common.none;
  const accounts = doc.detected.accountIds
    .map((id) => data.accounts.find((a) => a.id === id)?.name ?? id)
    .join(he.upload.and);
  return `${he.upload.kinds[doc.detected.kind]} · ${accounts}`;
}

export function statusLabel(doc: UploadDocument): string {
  switch (doc.status) {
    case "approved":
      return t(he.upload.statuses.approved, { n: doc.approvedCount ?? 0 });
    case "partially-approved":
      return t(he.upload.statuses["partially-approved"], {
        a: doc.approvedCount ?? 0,
        b: doc.totalRows ?? 0,
      });
    default:
      return he.upload.statuses[doc.status];
  }
}

const statusTone: Record<UploadDocument["status"], string> = {
  "awaiting-review": "badge--expected",
  approved: "badge--income",
  "partially-approved": "badge--verified",
  rejected: "badge--neutral",
  failed: "badge--expense",
};

/** Opens a manual-entry review (empty table + "הוספת שורה", FR-25, D5). */
export function useManualEntry() {
  const { update, user } = useCurrent();
  return () => {
    const id = newId("doc");
    update((d) => ({
      ...d,
      documents: [
        {
          id,
          fileName: he.upload.manualFileName,
          sizeBytes: 0,
          uploadedAt: "2026-10-15T10:00",
          uploadedBy: user.id,
          status: "awaiting-review",
        },
        ...d.documents,
      ],
      reviews: { ...d.reviews, [id]: [] },
    }));
    navigate(`/upload/${id}/review`);
  };
}

function QueueRow({ item }: { item: QueueItem }) {
  const { continueDuplicate, removeQueueItem, retryQueueItem } = useStore();
  const { data } = useCurrent();
  const manual = useManualEntry();
  const doc = item.documentId
    ? data.documents.find((d) => d.id === item.documentId)
    : undefined;
  const rows = item.documentId
    ? (data.reviews[item.documentId]?.length ?? 0)
    : 0;
  const tone =
    item.status === "error" || item.status === "failed"
      ? "queue-item--error"
      : item.status === "duplicate-file"
        ? "queue-item--warning"
        : item.status === "ready"
          ? "queue-item--success"
          : "";
  return (
    <li className={`queue-item ${tone}`}>
      <span className="queue-item__icon">
        <Icon name="file" />
      </span>
      <div className="queue-item__body">
        <div className="queue-item__name">
          <bdi>{item.fileName}</bdi>
          <span className="muted">
            <bdi>{formatSize(item.sizeBytes)}</bdi>
          </span>
        </div>
        {item.status === "error" ? (
          <p className="queue-item__status">
            {item.error === "too-large"
              ? he.upload.tooLarge
              : he.upload.unsupported}
          </p>
        ) : null}
        {item.status === "uploading" ? (
          <>
            <p className="queue-item__status">
              {t(he.upload.uploading, { p: item.progress })}
            </p>
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={item.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={item.fileName}
            >
              <span style={{ inlineSize: `${item.progress}%` }} />
            </div>
          </>
        ) : null}
        {item.status === "duplicate-file" ? (
          <>
            <p className="queue-item__status">
              <Icon name="warning" size={16} />
              {t(he.upload.duplicate, {
                date: formatDateTime("2026-10-15T09:12"),
              })}
            </p>
            <div className="queue-item__actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => removeQueueItem(item.id)}
                data-autofocus
              >
                {he.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => continueDuplicate(item.id)}
              >
                {he.upload.continueAnyway}
              </button>
            </div>
          </>
        ) : null}
        {item.status === "extracting" ? (
          <>
            <p className="queue-item__status">{he.upload.extracting}</p>
            {item.slow ? (
              <p className="hint">{he.upload.extractingSlow}</p>
            ) : null}
            <div
              className="progress progress--indeterminate"
              role="progressbar"
              aria-label={he.upload.extracting}
            >
              <span />
            </div>
          </>
        ) : null}
        {item.status === "ready" && doc?.detected ? (
          <>
            <p className="queue-item__status">
              <Icon name="check" size={16} />
              {t(he.upload.ready, {
                kind: he.upload.kinds[doc.detected.kind],
                account: detectedLabel(doc, data).split(" · ")[1] ?? "",
                range: `${formatDate(doc.detected.from)}–${formatDate(doc.detected.to)}`,
                n: rows,
              })}
            </p>
            <div className="queue-item__actions">
              <Link
                to={`/upload/${doc.id}/review`}
                className="btn btn--primary btn--sm"
              >
                {he.upload.toReview}
              </Link>
            </div>
          </>
        ) : null}
        {item.status === "failed" ? (
          <>
            <p className="queue-item__status">
              <Icon name="error" size={16} />
              {he.upload.failReasons[item.failureReason ?? "low-quality-scan"]}
            </p>
            <div className="queue-item__actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => retryQueueItem(item.id)}
              >
                {he.upload.tryAgain}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={manual}
              >
                {he.upload.manualEntry}
              </button>
            </div>
          </>
        ) : null}
        {item.status === "card" ? (
          <>
            <p className="queue-item__status">
              <Icon name="card" size={16} />
              {he.upload.cardNote}
            </p>
            <div className="queue-item__actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => removeQueueItem(item.id)}
              >
                {he.common.close}
              </button>
            </div>
          </>
        ) : null}
      </div>
      {item.status === "error" ||
      item.status === "ready" ||
      item.status === "failed" ? (
        <button
          type="button"
          className="icon-btn"
          aria-label={he.upload.removeFromQueue}
          onClick={() => removeQueueItem(item.id)}
        >
          <Icon name="close" size={16} />
        </button>
      ) : null}
    </li>
  );
}

function History({ data, isPhone }: { data: HouseholdData; isPhone: boolean }) {
  const docs = [...data.documents].sort((a, b) =>
    b.uploadedAt.localeCompare(a.uploadedAt),
  );
  const who = (id: string) =>
    data.users.find((u) => u.id === id)?.displayName ?? he.common.none;
  const action = (d: UploadDocument) =>
    d.status === "awaiting-review" ? (
      <Link to={`/upload/${d.id}/review`} className="btn btn--primary btn--sm">
        {he.upload.continueReview}
      </Link>
    ) : data.reviews[d.id] ? (
      <Link to={`/upload/${d.id}/review`} className="btn btn--ghost btn--sm">
        {he.upload.view}
      </Link>
    ) : d.status === "approved" || d.status === "partially-approved" ? (
      <Link
        to={`/transactions?document=${d.id}`}
        className="btn btn--ghost btn--sm"
      >
        {he.upload.view}
      </Link>
    ) : (
      <span className="muted">{he.common.none}</span>
    );
  if (docs.length === 0)
    return <p className="muted card__pad">{he.upload.historyEmpty}</p>;
  if (isPhone) {
    return (
      <ul className="history-cards">
        {docs.map((d) => (
          <li key={d.id} className="history-card">
            <div className="history-card__top">
              <Icon name="file" />
              <bdi className="history-card__name">{d.fileName}</bdi>
              <span className={`badge ${statusTone[d.status]}`}>
                {statusLabel(d)}
              </span>
            </div>
            <p className="muted">
              <bdi>{formatDateTime(d.uploadedAt)}</bdi> · {who(d.uploadedBy)}
            </p>
            <p>{detectedLabel(d, data)}</p>
            {d.status === "failed" && d.failureReason ? (
              <p className="hint">{he.upload.failReasons[d.failureReason]}</p>
            ) : null}
            <div>{action(d)}</div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th scope="col">{he.upload.uploadedAt}</th>
            <th scope="col">{he.upload.file}</th>
            <th scope="col">{he.upload.detectedAs}</th>
            <th scope="col">{he.upload.uploadedBy}</th>
            <th scope="col">{he.upload.status}</th>
            <th scope="col">
              <span className="sr-only">{he.upload.action}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id}>
              <td>
                <bdi className="date">{formatDateTime(d.uploadedAt)}</bdi>
              </td>
              <td>
                <span className="file-cell">
                  <Icon name="file" size={18} />
                  <bdi>{d.fileName}</bdi>
                </span>
              </td>
              <td>
                {detectedLabel(d, data)}
                {d.detected ? (
                  <div className="muted tx-sub">
                    <bdi>
                      {formatDate(d.detected.from)}–{formatDate(d.detected.to)}
                    </bdi>
                  </div>
                ) : null}
              </td>
              <td>{who(d.uploadedBy)}</td>
              <td>
                <span className={`badge ${statusTone[d.status]}`}>
                  {statusLabel(d)}
                </span>
                {d.status === "failed" && d.failureReason ? (
                  <div className="hint">
                    {he.upload.failReasons[d.failureReason]}
                  </div>
                ) : null}
              </td>
              <td className="col-end">{action(d)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UploadPage() {
  const { data, can } = useCurrent();
  const { state, enqueueFiles } = useStore();
  const { query } = useLocation();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [dragging, setDragging] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [retried, setRetried] = useState(false);
  const forced = retried ? null : query.get("state");

  const add = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    // Name and size only; contents are never read.
    const n = enqueueFiles(
      [...files].map((f) => ({ name: f.name, size: f.size })),
    );
    setAnnounce(t(he.upload.added, { n }));
  };
  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    add(e.dataTransfer.files);
  };

  return (
    <div className="page">
      <PageHeader title={he.upload.title} />
      {can("upload") ? (
        <label
          className={`dropzone ${dragging ? "is-dragging" : ""} ${isPhone ? "dropzone--compact" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            type="file"
            multiple
            className="sr-only"
            accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.heic,application/pdf,text/csv,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
          <span className="dropzone__icon">
            <Icon name="upload" size={28} />
          </span>
          {dragging ? (
            <span className="dropzone__title">{he.upload.dropHere}</span>
          ) : (
            <span className="dropzone__title">
              {isPhone ? null : <span>{he.upload.dropTitle} </span>}
              <span className="btn btn--primary dropzone__btn">
                {he.upload.choose}
              </span>
            </span>
          )}
          <span className="dropzone__hint">{he.upload.accepted}</span>
          <span className="dropzone__proto">
            <Icon name="warning" size={16} />
            {he.upload.prototypeNote}
          </span>
        </label>
      ) : (
        <div className="note-bar">
          <Icon name="info" size={18} />
          <span>{he.upload.noPermission}</span>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {state.queue.length > 0 ? (
        <section className="card" aria-labelledby="queue-title">
          <h2 id="queue-title" className="card__title">
            {he.upload.queueTitle}
          </h2>
          <ul className="queue" aria-live="polite">
            {state.queue.map((item) => (
              <QueueRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card card--flush" aria-labelledby="history-title">
        <div className="card__header card__header--padded">
          <h2 id="history-title" className="card__title">
            {he.upload.historyTitle}
          </h2>
        </div>
        {forced === "loading" ? (
          <SkeletonRows rows={3} />
        ) : forced === "error" ? (
          <ErrorState
            message={he.upload.historyError}
            onRetry={() => setRetried(true)}
          />
        ) : forced === "empty" ? (
          <EmptyState icon="file" title={he.upload.historyEmpty} />
        ) : (
          <History data={data} isPhone={isPhone} />
        )}
      </section>
    </div>
  );
}
