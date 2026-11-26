/** Settings: display preferences for this device (docs/ux/settings.md). */
import { PageHeader } from "../components/AppShell";
import { useToast } from "../components/feedback";
import {
  DENSITIES,
  MOTIONS,
  type Preferences,
  resetPreferences,
  setPreferences,
  START_PAGES,
  TEXT_SIZES,
  THEMES,
  usePreferences,
} from "../lib/preferences";
import { he } from "../locale/he";

function ChoiceGroup<K extends keyof Preferences>({
  name,
  legend,
  hint,
  options,
  labels,
}: {
  name: K;
  legend: string;
  hint?: string;
  options: readonly Preferences[K][];
  labels: Record<Preferences[K], string>;
}) {
  const prefs = usePreferences();
  const hintId = hint ? `settings-${name}-hint` : undefined;
  return (
    <fieldset className="settings-row" aria-describedby={hintId}>
      <legend className="settings-row__label">{legend}</legend>
      <div className="choice-group">
        {options.map((value) => (
          <label
            key={value}
            className={`choice ${prefs[name] === value ? "is-on" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={value}
              checked={prefs[name] === value}
              onChange={() =>
                setPreferences({ [name]: value } as Partial<Preferences>)
              }
            />
            {labels[value]}
          </label>
        ))}
      </div>
      {hint ? (
        <p id={hintId} className="hint">
          {hint}
        </p>
      ) : null}
    </fieldset>
  );
}

export function SettingsPage() {
  const toast = useToast();
  const s = he.settings;
  return (
    <>
      <PageHeader title={s.title} />
      <p className="muted settings-intro">{s.intro}</p>

      <section
        className="card settings-card"
        aria-labelledby="settings-appearance"
      >
        <h2 id="settings-appearance" className="card__title">
          {s.appearance}
        </h2>
        <ChoiceGroup
          name="theme"
          legend={s.theme}
          hint={s.themeHint}
          options={THEMES}
          labels={s.themes}
        />
        <ChoiceGroup
          name="textSize"
          legend={s.textSize}
          options={TEXT_SIZES}
          labels={s.textSizes}
        />
        <p className="settings-preview" aria-hidden="true">
          {s.textPreview}
        </p>
        <ChoiceGroup
          name="density"
          legend={s.density}
          hint={s.densityHint}
          options={DENSITIES}
          labels={s.densities}
        />
      </section>

      <section className="card settings-card" aria-labelledby="settings-a11y">
        <h2 id="settings-a11y" className="card__title">
          {s.accessibility}
        </h2>
        <ChoiceGroup
          name="motion"
          legend={s.motion}
          options={MOTIONS}
          labels={s.motions}
        />
      </section>

      <section
        className="card settings-card"
        aria-labelledby="settings-general"
      >
        <h2 id="settings-general" className="card__title">
          {s.general}
        </h2>
        <ChoiceGroup
          name="startPage"
          legend={s.startPage}
          options={START_PAGES}
          labels={s.startPages}
        />
        <div className="settings-row">
          <span className="settings-row__label">{s.language}</span>
          <span>
            {s.languageValue} <span className="muted">· {s.languageLater}</span>
          </span>
        </div>
      </section>

      <button
        type="button"
        className="btn btn--secondary"
        onClick={() => {
          resetPreferences();
          toast.show(s.resetDone);
        }}
      >
        {s.reset}
      </button>
    </>
  );
}
