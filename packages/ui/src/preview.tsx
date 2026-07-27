import { i18n, supportedLocales, type SupportedLocale } from "@rulivo/i18n";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { I18nextProvider, useTranslation } from "react-i18next";
import { Badge, Button, Card, EmptyState, Input, Metric, Modal, Sheet } from "./components.js";
import { DEFAULT_THEME, type ThemeName } from "./tokens.js";
import "./preview.css";

function Preview() {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<ThemeName>(DEFAULT_THEME);
  const [locale, setLocale] = useState<SupportedLocale>("zh-CN");

  function selectTheme(nextTheme: ThemeName) {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  }

  function selectLocale(nextLocale: SupportedLocale) {
    void i18n.changeLanguage(nextLocale).then(() => {
      document.documentElement.lang = nextLocale;
      setLocale(nextLocale);
    });
  }

  return (
    <main className="preview">
      <header className="preview__header">
        <div>
          <div className="preview__eyebrow">{t("preview.eyebrow")}</div>
          <h1>{t("preview.headline")}</h1>
          <p className="preview__subtitle">{t("preview.subtitle")}</p>
        </div>
        <div className="preview__controls">
          <div aria-label={t("common.language")} className="preview__theme">
            {supportedLocales.map((supportedLocale) => (
              <Button
                aria-pressed={locale === supportedLocale}
                key={supportedLocale}
                onClick={() => {
                  selectLocale(supportedLocale);
                }}
                variant={locale === supportedLocale ? "primary" : "ghost"}
              >
                {supportedLocale}
              </Button>
            ))}
          </div>
          <div aria-label={t("common.theme")} className="preview__theme">
            <Button
              aria-pressed={theme === "dark"}
              onClick={() => {
                selectTheme("dark");
              }}
              variant={theme === "dark" ? "primary" : "ghost"}
            >
              {t("common.dark")}
            </Button>
            <Button
              aria-pressed={theme === "light"}
              onClick={() => {
                selectTheme("light");
              }}
              variant={theme === "light" ? "primary" : "ghost"}
            >
              {t("common.light")}
            </Button>
          </div>
        </div>
      </header>

      <div className="preview__grid">
        <Card className="preview__section">
          <h2>{t("preview.button")}</h2>
          <div className="preview__row">
            <Button>{t("preview.primary")}</Button>
            <Button variant="secondary">{t("preview.secondary")}</Button>
            <Button variant="danger">{t("preview.danger")}</Button>
            <Button variant="ghost">{t("preview.ghost")}</Button>
            <Button disabled>{t("preview.disabled")}</Button>
          </div>
        </Card>

        <Card className="preview__section" elevated>
          <h2>{t("preview.badge")}</h2>
          <div className="preview__row">
            <Badge>{t("preview.unknown")}</Badge>
            <Badge tone="positive">{t("preview.ruleFollowed")}</Badge>
            <Badge tone="negative">{t("preview.ruleBroken")}</Badge>
            <Badge tone="caution">{t("preview.needsReview")}</Badge>
            <Badge tone="evidence">{t("preview.evidenceCount", { count: 12 })}</Badge>
          </div>
        </Card>

        <Card className="preview__section preview__wide">
          <h2>{t("preview.metric")}</h2>
          <div className="preview__metrics">
            <Metric label={t("preview.discipline")} trend={t("preview.stable")} value="82" />
            <Metric
              label={t("preview.execution")}
              tone="positive"
              trend={t("preview.weekChange", { count: 6 })}
              value="91%"
            />
            <Metric label={t("preview.mistakeCost")} tone="negative" trend="-1.8R" value="3.2R" />
            <Metric
              label={t("preview.sample")}
              tone="caution"
              trend={t("preview.lowConfidence")}
              value="7"
            />
          </div>
        </Card>

        <Card className="preview__section preview__wide">
          <h2>{t("preview.input")}</h2>
          <div className="preview__inputs">
            <Input hint={t("preview.optionalNote")} id="normal" label={t("preview.reviewNote")} />
            <Input
              error={t("preview.evidenceRequired")}
              id="error"
              label={t("preview.evidenceId")}
            />
            <Input
              disabled
              id="disabled"
              label={t("preview.lockedField")}
              value={t("preview.readOnly")}
            />
          </div>
        </Card>

        <Card className="preview__section preview__wide">
          <h2>{t("preview.overlays")}</h2>
          <div className="preview__overlays">
            <Sheet
              description={t("preview.sheetDescription")}
              open
              title={t("preview.addEvidence")}
            >
              <Button>{t("common.continue")}</Button>
            </Sheet>
            <Modal
              description={t("preview.deleteDescription")}
              open
              title={t("preview.deleteNote")}
            >
              <div className="preview__row">
                <Button variant="ghost">{t("common.cancel")}</Button>
                <Button variant="danger">{t("common.delete")}</Button>
              </div>
            </Modal>
          </div>
        </Card>

        <Card className="preview__section preview__wide">
          <h2>{t("preview.emptyState")}</h2>
          <EmptyState
            action={<Button variant="secondary">{t("preview.importTrades")}</Button>}
            description={t("preview.emptyDescription")}
            title={t("preview.noEvidence")}
          />
        </Card>
      </div>
    </main>
  );
}

const root = document.querySelector("#root");
if (root === null) throw new Error("Preview root was not found");
createRoot(root).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <Preview />
    </I18nextProvider>
  </StrictMode>
);
