import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge, Button, EmptyState, Input, Metric, Modal, Sheet } from "./components.js";
import { DEFAULT_THEME, tokens } from "./tokens.js";

describe("design tokens", () => {
  it("uses the approved brand palette and dark default", () => {
    expect(tokens.color.brand.disciplineTeal).toBe("#2ED7A2");
    expect(tokens.color.brand.evidenceBlue).toBe("#47B7E8");
    expect(tokens.font.numeric).toBe("tabular-nums");
    expect(DEFAULT_THEME).toBe("dark");
  });
});

describe("components", () => {
  it("renders button variants and disabled state", () => {
    const markup = renderToStaticMarkup(
      <>
        <Button variant="danger">Delete</Button>
        <Button disabled>Disabled</Button>
      </>
    );
    expect(markup).toContain("rl-button--danger");
    expect(markup).toContain("disabled");
  });

  it("renders metric and badge tones", () => {
    const markup = renderToStaticMarkup(
      <>
        <Metric label="Cost" tone="negative" trend="-1R" value="2R" />
        <Badge tone="evidence">Evidence</Badge>
      </>
    );
    expect(markup).toContain("rl-tone--negative");
    expect(markup).toContain("rl-badge--evidence");
  });

  it("associates input errors with the field", () => {
    const markup = renderToStaticMarkup(<Input error="Required" id="evidence" label="Evidence" />);
    expect(markup).toContain('aria-invalid="true"');
    expect(markup).toContain('aria-describedby="evidence-message"');
  });

  it("only renders open overlays", () => {
    expect(
      renderToStaticMarkup(
        <Sheet open={false} title="Closed">
          Hidden
        </Sheet>
      )
    ).toBe("");
    expect(
      renderToStaticMarkup(
        <Modal open title="Confirm">
          Visible
        </Modal>
      )
    ).toContain('role="dialog"');
  });

  it("renders empty state content and action", () => {
    const markup = renderToStaticMarkup(
      <EmptyState
        action={<Button>Import</Button>}
        description="Add the first item"
        title="No evidence"
      />
    );
    expect(markup).toContain("No evidence");
    expect(markup).toContain("Import");
  });
});
