import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallLabel, getToolCallLabel } from "../ToolCallLabel";

afterEach(() => {
  cleanup();
});

// ── getToolCallLabel unit tests ────────────────────────────────────────────

test("getToolCallLabel: str_replace_editor create", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolCallLabel: str_replace_editor str_replace", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "str_replace", path: "/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("getToolCallLabel: str_replace_editor insert", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "insert", path: "/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("getToolCallLabel: str_replace_editor view", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "view", path: "/App.jsx" })).toBe("Reading App.jsx");
});

test("getToolCallLabel: str_replace_editor unknown command", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "undo_edit", path: "/App.jsx" })).toBe("Processing App.jsx");
});

test("getToolCallLabel: file_manager rename", () => {
  expect(
    getToolCallLabel("file_manager", { command: "rename", path: "/old.jsx", new_path: "/new.jsx" })
  ).toBe("Renaming old.jsx to new.jsx");
});

test("getToolCallLabel: file_manager delete", () => {
  expect(getToolCallLabel("file_manager", { command: "delete", path: "/components/Old.tsx" })).toBe("Deleting Old.tsx");
});

test("getToolCallLabel: uses filename not full path", () => {
  expect(getToolCallLabel("str_replace_editor", { command: "create", path: "/src/components/Button.tsx" })).toBe("Creating Button.tsx");
});

test("getToolCallLabel: unknown tool falls back to toolName", () => {
  expect(getToolCallLabel("some_other_tool", { path: "/App.jsx" })).toBe("some_other_tool");
});

// ── ToolCallLabel component tests ──────────────────────────────────────────

test("ToolCallLabel shows spinner and label while in progress", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // spinner present (no green dot)
  expect(screen.queryByRole("status")).toBeNull();
});

test("ToolCallLabel shows green dot when done", () => {
  const { container } = render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "1",
        toolName: "str_replace_editor",
        args: { command: "create", path: "/App.jsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  // green dot div is present
  const dot = container.querySelector(".bg-emerald-500");
  expect(dot).toBeTruthy();
});

test("ToolCallLabel shows editing label for str_replace", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "2",
        toolName: "str_replace_editor",
        args: { command: "str_replace", path: "/components/Card.tsx" },
        state: "result",
        result: "ok",
      }}
    />
  );
  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
});

test("ToolCallLabel shows rename label for file_manager", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "3",
        toolName: "file_manager",
        args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
        state: "call",
      }}
    />
  );
  expect(screen.getByText("Renaming old.jsx to new.jsx")).toBeDefined();
});

test("ToolCallLabel shows delete label for file_manager", () => {
  render(
    <ToolCallLabel
      toolInvocation={{
        toolCallId: "4",
        toolName: "file_manager",
        args: { command: "delete", path: "/components/Old.tsx" },
        state: "result",
        result: { success: true },
      }}
    />
  );
  expect(screen.getByText("Deleting Old.tsx")).toBeDefined();
});
