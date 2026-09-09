import type {
	SessionEntry,
	SessionMessageEntry,
	NormalizedRole,
	ContentBlock,
	CustomMessage,
	BashExecutionMessage,
	ToolResultMessage,
} from "../types.ts";

export function textOf(content: unknown): string {
	if (content === null || content === undefined) return "";
	if (typeof content === "string") return content;
	if (Array.isArray(content)) {
		return (content as (ContentBlock | Record<string, unknown>)[])
			.map((b) => {
				if (!b || typeof b !== "object") return String(b ?? "");
				switch (b.type) {
					case "text":
						return typeof b.text === "string" ? b.text : "";
					case "thinking":
						return "";
					case "toolCall":
						return (b as { name?: string }).name || "tool";
					default:
						return "";
				}
			})
			.filter(Boolean)
			.join("\n");
	}
	return "";
}

export function entrySummary(entry: SessionEntry): string {
	if (entry.type !== "message") {
		switch (entry.type) {
			case "compaction": {
				const summary =
					typeof (entry as { summary?: unknown }).summary === "string"
						? (entry as { summary: string }).summary
						: "";
				return summary.slice(0, 90) || "Compaction";
			}
			case "branch_summary": {
				const summary =
					typeof (entry as { summary?: unknown }).summary === "string"
						? (entry as { summary: string }).summary
						: "";
				return summary.slice(0, 90) || "Branch Summary";
			}
			case "model_change": {
				const mc = entry as { provider?: string; modelId?: string };
				return `${mc.provider || ""}/${mc.modelId || ""}`;
			}
			case "thinking_level_change": {
				const tlc = entry as { thinkingLevel?: string };
				return `level: ${tlc.thinkingLevel || ""}`;
			}
			case "custom":
				return (entry as { customType?: string }).customType || "custom";
			case "custom_message":
				return textOf((entry as { content?: unknown }).content).slice(0, 80);
			case "label": {
				const le = entry as { label?: string; targetId?: string };
				return `${le.label || ""}: ${le.targetId || ""}`;
			}
			case "session_info": {
				const se = entry as { name?: string };
				return se.name || "session";
			}
			default:
				return (entry as { type?: string }).type || "unknown";
		}
	}

	const m = (entry as SessionMessageEntry).message;
	switch (m.role) {
		case "user":
			return textOf(m.content);
		case "assistant":
			return textOf(m.content).slice(0, 140);
		case "toolResult": {
			const tr = m as ToolResultMessage;
			return `${tr.toolName} ${textOf(tr.content).slice(0, 70)}`;
		}
		case "bashExecution": {
			const bm = m as BashExecutionMessage;
			return bm.command ? `$ ${bm.command}` : "$ command";
		}
		case "custom": {
			const cm = m as CustomMessage;
			return textOf(cm.content).slice(0, 90);
		}
		default:
			return (m as { role?: string }).role || "message";
	}
}

export function roleOf(entry: SessionEntry): NormalizedRole {
	if (entry.type !== "message") return "other";
	const r = (entry as SessionMessageEntry).message.role;
	if (r === "user" || r === "assistant") return r;
	return "tool";
}

export function formatTime(iso?: string | number): string {
	if (!iso) return "";
	const d = new Date(iso);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleTimeString();
}

export function jsonText(value: unknown): string {
	if (typeof value === "string") return value;
	try {
		return JSON.stringify(value, null, 2) ?? String(value);
	} catch {
		return String(value);
	}
}
