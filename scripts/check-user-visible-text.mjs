import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const scanRoots = [resolve(root, "apps"), resolve(root, "packages")];
const visibleAttributes = new Set([
  "aria-label",
  "description",
  "error",
  "hint",
  "label",
  "placeholder",
  "title"
]);
const violations = [];

function visitDirectory(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (["dist", "node_modules", "preview-dist", ".turbo"].includes(name)) continue;
    if (statSync(path).isDirectory()) {
      visitDirectory(path);
    } else if (extname(path) === ".tsx" && !path.endsWith(".test.tsx")) {
      inspectFile(path);
    }
  }
}

function inspectFile(path) {
  const source = ts.createSourceFile(
    path,
    readFileSync(path, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  function report(node, text) {
    const position = source.getLineAndCharacterOfPosition(node.getStart(source));
    violations.push(`${relative(root, path)}:${position.line + 1} hardcoded visible text: ${text}`);
  }

  function visit(node) {
    if (ts.isJsxText(node) && node.text.trim() !== "") {
      report(node, JSON.stringify(node.text.trim()));
    }
    if (
      ts.isJsxAttribute(node) &&
      visibleAttributes.has(node.name.getText(source)) &&
      node.initializer !== undefined &&
      ts.isStringLiteral(node.initializer)
    ) {
      report(node, JSON.stringify(node.initializer.text));
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
}

for (const directory of scanRoots) {
  visitDirectory(directory);
}

if (violations.length > 0) {
  throw new Error(`User-visible text must use @rulivo/i18n:\n${violations.join("\n")}`);
}
