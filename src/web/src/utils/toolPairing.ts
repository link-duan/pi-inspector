import type { SessionEntry, SessionMessageEntry, ToolCall, ToolResultMessage } from "../types.ts";

export interface PairedToolCallInfo {
	callerEntry: SessionMessageEntry;
	toolCall: ToolCall;
}

export interface PairedToolResultInfo {
	resultEntry: SessionMessageEntry;
	resultMessage: ToolResultMessage;
}

export interface ToolPairIndex {
	/** Maps toolCall.id -> caller entry and toolCall block */
	callsById: Map<string, PairedToolCallInfo>;
	/** Maps toolResult.toolCallId -> result entry and result message */
	resultsByCallId: Map<string, PairedToolResultInfo>;
	/** Fallback lookup: callerEntryId:toolName -> result */
	resultsByParentAndName: Map<string, PairedToolResultInfo>;
	/** Fallback lookup: resultEntry.parentId:toolName -> call */
	callsByParentAndName: Map<string, PairedToolCallInfo>;
}

/**
 * Builds O(1) bi-directional tool call <-> tool result pair lookup maps
 * referencing pi-coding-agent's export-html pairing pattern.
 */
export function buildToolPairIndex(entries: SessionEntry[] = []): ToolPairIndex {
	const callsById = new Map<string, PairedToolCallInfo>();
	const resultsByCallId = new Map<string, PairedToolResultInfo>();
	const resultsByParentAndName = new Map<string, PairedToolResultInfo>();
	const callsByParentAndName = new Map<string, PairedToolCallInfo>();

	for (const entry of entries) {
		if (entry.type !== "message") continue;
		const msg = entry.message;

		if (msg.role === "assistant" && Array.isArray(msg.content)) {
			for (const block of msg.content) {
				if (block.type === "toolCall") {
					const toolCall = block as ToolCall;
					const info: PairedToolCallInfo = { callerEntry: entry, toolCall };
					if (toolCall.id) {
						callsById.set(toolCall.id, info);
					}
					if (entry.id && toolCall.name) {
						callsByParentAndName.set(`${entry.id}:${toolCall.name}`, info);
					}
				}
			}
		} else if (msg.role === "toolResult") {
			const tr = msg as ToolResultMessage;
			const info: PairedToolResultInfo = { resultEntry: entry, resultMessage: tr };
			if (tr.toolCallId) {
				resultsByCallId.set(tr.toolCallId, info);
			}
			if (entry.parentId && tr.toolName) {
				resultsByParentAndName.set(`${entry.parentId}:${tr.toolName}`, info);
			}
		}
	}

	return { callsById, resultsByCallId, resultsByParentAndName, callsByParentAndName };
}

export function findPairedToolCall(
	toolCallId?: string,
	toolName?: string,
	parentId?: string | null,
	index?: ToolPairIndex | null,
): PairedToolCallInfo | null {
	if (!index) return null;
	if (toolCallId && index.callsById.has(toolCallId)) {
		return index.callsById.get(toolCallId)!;
	}
	if (parentId && toolName) {
		const key = `${parentId}:${toolName}`;
		if (index.callsByParentAndName.has(key)) {
			return index.callsByParentAndName.get(key)!;
		}
	}
	return null;
}

export function findPairedToolResult(
	toolCallId?: string,
	toolName?: string,
	callerEntryId?: string,
	index?: ToolPairIndex | null,
): PairedToolResultInfo | null {
	if (!index) return null;
	if (toolCallId && index.resultsByCallId.has(toolCallId)) {
		return index.resultsByCallId.get(toolCallId)!;
	}
	if (callerEntryId && toolName) {
		const key = `${callerEntryId}:${toolName}`;
		if (index.resultsByParentAndName.has(key)) {
			return index.resultsByParentAndName.get(key)!;
		}
	}
	return null;
}

/**
 * Human-readable tool call preview helper from pi-coding-agent template.js
 */
export function formatToolCallSummary(name: string, rawArgs?: unknown): string {
	if (!rawArgs || typeof rawArgs !== "object") {
		return "";
	}
	const args = rawArgs as Record<string, unknown>;
	switch (name) {
		case "read": {
			const p = String(args.path || args.file_path || "");
			const offset = args.offset;
			const limit = args.limit;
			if (!p) return "";
			return `${p}${offset !== undefined || limit !== undefined ? `:${offset ?? 1}` : ""}`;
		}
		case "write":
		case "edit":
			return String(args.path || args.file_path || "");
		case "bash": {
			const cmd = String(args.command || "")
				.replace(/[\n\t]/g, " ")
				.trim();
			return cmd.length > 45 ? `${cmd.slice(0, 45)}…` : cmd;
		}
		case "grep":
		case "find":
			return `${String(args.pattern || "")} in ${String(args.path || ".")}`;
		default: {
			try {
				const str = JSON.stringify(args);
				return str.length > 35 ? `${str.slice(0, 35)}…` : str;
			} catch {
				return "";
			}
		}
	}
}

/**
 * Extract text output from tool result content
 */
export function extractResultText(content: unknown): string {
	if (content === null || content === undefined) return "";
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return content
			.map((item) => {
				if (!item || typeof item !== "object") return String(item ?? "");
				if ("text" in item && typeof item.text === "string") return item.text;
				if ("data" in item && typeof item.data === "string") return "[Image Attachment]";
				return "";
			})
			.filter(Boolean)
			.join("\n");
	}
	return String(content);
}
