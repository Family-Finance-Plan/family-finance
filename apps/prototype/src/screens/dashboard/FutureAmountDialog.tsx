/** Preview layer only: edit a future amount with "save" vs "temporary estimate" (FR-89, FR-90, FR-92). */
import { useState } from "react";
import { useToast } from "../../components/feedback";
import { Modal } from "../../components/overlays";
import { Amount, CertaintyBadge } from "../../components/primitives";
import { DEMO_NOW } from "../../demo/demo-today";
import type { FutureItem } from "../../demo/types";
import {
  amountToInput,
  formatMonth,
  parseAmountInput,
  t,
} from "../../lib/format";
import { he } from "../../locale/he";
import {
  futureAmount,
  futureCertainty,
  saveFutureAmount,
  setTemporaryEstimate,
} from "../../state/household-data";
import { useCurrent } from "../../state/store";

export function FutureAmountDialog({
  item,
  onClose,
}: {
  item: FutureItem;
  onClose: () => void;
}) {
  const { update, user } = useCurrent();
  const toast = useToast();
  const [value, setValue] = useState(amountToInput(futureAmount(item)));
  const [choice, setChoice] = useState<"save" | "temporary" | null>(null);
  const [error, setError] = useState(false);
  const month = formatMonth(item.date.slice(0, 7));

  const confirm = () => {
    const amount = parseAmountInput(value);
    if (amount === null || amount === 0) {
      setError(true);
      return;
    }
    if (choice === "save") {
      update((d) =>
        saveFutureAmount(
          setTemporaryEstimate(d, item.id, null),
          item.id,
          amount,
          user.displayName,
          DEMO_NOW,
        ),
      );
      toast.show(t(he.future.saved, { month }));
    } else if (choice === "temporary") {
      update((d) => setTemporaryEstimate(d, item.id, amount));
      toast.show(he.future.temporarySaved);
    }
    onClose();
  };

  return (
    <Modal
      title={he.future.dialogTitle}
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
            className="btn btn--primary"
            onClick={confirm}
            disabled={choice === null}
          >
            {he.common.confirm}
          </button>
        </>
      }
    >
      <dl className="facts">
        <div>
          <dt>{he.future.item}</dt>
          <dd>
            {item.description} · {month}
          </dd>
        </div>
        <div>
          <dt>{he.future.current}</dt>
          <dd>
            <Amount agorot={futureAmount(item)} type={item.type} />
          </dd>
        </div>
        <div>
          <dt>{he.future.certainty}</dt>
          <dd>
            <CertaintyBadge certainty={futureCertainty(item)} />
          </dd>
        </div>
      </dl>
      <label className="field">
        <span className="field-label">{he.future.newAmount} (₪)</span>
        <input
          type="text"
          inputMode="decimal"
          dir="ltr"
          value={value}
          aria-invalid={error}
          data-autofocus
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
        />
        {error ? (
          <span className="field-error">{he.future.invalidAmount}</span>
        ) : null}
      </label>
      <fieldset className="field-block">
        <legend className="field-label">{he.future.choiceLegend}</legend>
        <label className="radio-card">
          <input
            type="radio"
            name="future-choice"
            checked={choice === "save"}
            onChange={() => setChoice("save")}
          />
          <span>
            <strong>{he.future.save}</strong>
            <span className="hint">{he.future.saveHint}</span>
          </span>
        </label>
        <label className="radio-card">
          <input
            type="radio"
            name="future-choice"
            checked={choice === "temporary"}
            onChange={() => setChoice("temporary")}
          />
          <span>
            <strong>{he.future.temporary}</strong>
            <span className="hint">{he.future.temporaryHint}</span>
          </span>
        </label>
      </fieldset>
    </Modal>
  );
}
