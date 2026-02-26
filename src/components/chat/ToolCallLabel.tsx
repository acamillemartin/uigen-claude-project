"use client";

import { Loader2 } from "lucide-react";

interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
  state: string;
  result?: any;
}

interface ToolCallLabelProps {
  toolInvocation: ToolInvocation;
}

export function getToolCallLabel(toolName: string, args: Record<string, any>): string {
  const path: string = args.path ?? "";
  const fileName = path.split("/").filter(Boolean).pop() ?? path;

  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create":
        return `Creating ${fileName}`;
      case "str_replace":
      case "insert":
        return `Editing ${fileName}`;
      case "view":
        return `Reading ${fileName}`;
      default:
        return `Processing ${fileName}`;
    }
  }

  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": {
        const newPath: string = args.new_path ?? "";
        const newFileName = newPath.split("/").filter(Boolean).pop() ?? newPath;
        return `Renaming ${fileName} to ${newFileName}`;
      }
      case "delete":
        return `Deleting ${fileName}`;
      default:
        return `Processing ${fileName}`;
    }
  }

  return toolName;
}

export function ToolCallLabel({ toolInvocation }: ToolCallLabelProps) {
  const { toolName, args, state, result } = toolInvocation;
  const isDone = state === "result" && result != null;
  const label = getToolCallLabel(toolName, args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isDone ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-green-600 flex-shrink-0" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
