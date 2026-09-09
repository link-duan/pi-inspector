import React, { useMemo } from "react";
import {
	User,
	Bot,
	Terminal,
	FileText,
	FileEdit,
	Search,
	Wrench,
	GitBranch,
	Layers,
	Cpu,
	Brain,
	Tag,
	AlertCircle,
	Check,
} from "lucide-react";
import type {
	FlatTreeNode,
	SessionMessageEntry,
	ToolResultMessage,
	BashExecutionMessage,
	ContentBlock,
	ToolCall,
} from "../../types.ts";
import { formatTime, textOf } from "../../utils/formatters.ts";
import { formatToolCallSummary } from "../../utils/toolPairing.ts";

interface TreeNodeProps {
	item: FlatTreeNode;
	isSelected: boolean;
	onSelect: (id: string) => void;
	searchQuery?: string;
}

function highlightText(text: string, query: string): React.ReactNode {
	if (!query.trim() || !text) return text;
	const q = query.trim().toLowerCase();
	const lower = text.toLowerCase();
	const parts: React.ReactNode[] = [];
	let lastIdx = 0;
	let idx = lower.indexOf(q);

	while (idx !== -1) {
		if (idx > lastIdx) {
			parts.push(text.slice(lastIdx, idx));
		}
		parts.push(
			<mark key={idx} className="search-highlight">
				{text.slice(idx, idx + q.length)}
			</mark>,
		);
		lastIdx = idx + q.length;
		idx = lower.indexOf(q, lastIdx);
	}

	if (lastIdx < text.length) {
		parts.push(text.slice(lastIdx));
	}

	return parts;
}

function getToolIcon(name: string) {
	switch (name) {
		case "read":
			return <FileText size={11} className="node-badge-icon" />;
		case "write":
		case "edit":
			return <FileEdit size={11} className="node-badge-icon" />;
		case "bash":
			return <Terminal size={11} className="node-badge-icon" />;
		case "grep":
		case "find":
			return <Search size={11} className="node-badge-icon" />;
		default:
			return <Wrench size={11} className="node-badge-icon" />;
	}
}

export const TreeNode: React.FC<TreeNodeProps> = React.memo(
	({ item, isSelected, onSelect, searchQuery = "" }) => {
		const { node, cells, onPath, summary, isCurrentLeaf, hasError, childCount } = item;
		const entry = node.entry;

		const parsed = useMemo(() => {
			if (entry.type === "message") {
				const msg = (entry as SessionMessageEntry).message;
				if (msg.role === "user") {
					return {
						badgeClass: "badge-user",
						badgeIcon: <User size={11} className="node-badge-icon" />,
						badgeLabel: "user",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: null,
						eventIcon: null,
						primaryText: textOf(msg.content),
					};
				}

				if (msg.role === "assistant") {
					const blocks = Array.isArray(msg.content)
						? (msg.content as (ContentBlock | Record<string, unknown>)[])
						: [];
					const hasThinking = blocks.some(
						(b) => b && typeof b === "object" && b.type === "thinking",
					);
					const toolInvocations: { name: string; args: string }[] = [];
					for (const b of blocks) {
						if (b && typeof b === "object" && b.type === "toolCall") {
							const tc = b as ToolCall;
							const name = tc.name || "tool";
							const args = tc.arguments ? formatToolCallSummary(name, tc.arguments) : "";
							toolInvocations.push({ name, args });
						}
					}

					let textContent = "";
					for (const b of blocks) {
						if (b && typeof b === "object" && b.type === "text" && typeof b.text === "string") {
							textContent += b.text;
						}
					}

					return {
						badgeClass: "badge-assistant",
						badgeIcon: <Bot size={11} className="node-badge-icon" />,
						badgeLabel: "assistant",
						toolTag: null,
						isError: Boolean(msg.errorMessage),
						toolStatus: msg.errorMessage ? (
							<span className="tool-status-icon error" title={msg.errorMessage}>
								<AlertCircle size={10} />
							</span>
						) : null,
						hasThinking,
						toolInvocations,
						eventTag: null,
						eventIcon: null,
						primaryText: textContent.trim(),
					};
				}

				if (msg.role === "toolResult") {
					const tr = msg as ToolResultMessage;
					const argsText = item.toolArgs || "";
					const primaryText = argsText || (tr.isError ? "Failed" : "Done");

					return {
						badgeClass: "badge-tool",
						badgeIcon: getToolIcon(tr.toolName),
						badgeLabel: "tool",
						toolTag: tr.toolName,
						isError: Boolean(tr.isError),
						toolStatus: tr.isError ? (
							<span className="tool-status-icon error" title="Failed">
								<AlertCircle size={10} />
							</span>
						) : (
							<span className="tool-status-icon success" title="Success">
								<Check size={10} />
							</span>
						),
						hasThinking: false,
						toolInvocations: [],
						eventTag: null,
						eventIcon: null,
						primaryText,
					};
				}

				if (msg.role === "bashExecution") {
					const bm = msg as BashExecutionMessage;
					const isErr = bm.exitCode !== undefined && bm.exitCode !== 0;
					const commandText = bm.command ? `$ ${bm.command}` : "$ command";

					return {
						badgeClass: "badge-tool",
						badgeIcon: <Terminal size={11} className="node-badge-icon" />,
						badgeLabel: "bash",
						toolTag: "bash",
						isError: isErr,
						toolStatus: isErr ? (
							<span className="tool-status-icon error" title={`Exit code ${bm.exitCode}`}>
								<AlertCircle size={10} />
							</span>
						) : (
							<span className="tool-status-icon success" title="Exit code 0">
								<Check size={10} />
							</span>
						),
						hasThinking: false,
						toolInvocations: [],
						eventTag: null,
						eventIcon: null,
						primaryText: commandText,
					};
				}

				if (msg.role === "custom") {
					const cm = msg as { customType?: string; content?: unknown };
					return {
						badgeClass: "badge-other",
						badgeIcon: <Tag size={11} className="node-badge-icon" />,
						badgeLabel: cm.customType || "custom",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: null,
						eventIcon: null,
						primaryText: textOf(cm.content) || summary,
					};
				}
			}

			// Non-message entries
			switch (entry.type) {
				case "compaction": {
					const se = entry as { summary?: string };
					return {
						badgeClass: "badge-other",
						badgeIcon: <Layers size={11} className="node-badge-icon" />,
						badgeLabel: "compact",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: "compaction",
						eventIcon: <Layers size={10} />,
						primaryText: se.summary || "Session Compaction",
					};
				}
				case "branch_summary": {
					const be = entry as { summary?: string };
					return {
						badgeClass: "badge-other",
						badgeIcon: <GitBranch size={11} className="node-badge-icon" />,
						badgeLabel: "branch",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: "branch",
						eventIcon: <GitBranch size={10} />,
						primaryText: be.summary || "Branch Summary",
					};
				}
				case "model_change": {
					const mc = entry as { provider?: string; modelId?: string };
					return {
						badgeClass: "badge-assistant",
						badgeIcon: <Cpu size={11} className="node-badge-icon" />,
						badgeLabel: "model",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: "model",
						eventIcon: <Cpu size={10} />,
						primaryText: `${mc.provider || ""}/${mc.modelId || ""}`,
					};
				}
				case "thinking_level_change": {
					const tlc = entry as { thinkingLevel?: string };
					return {
						badgeClass: "badge-assistant",
						badgeIcon: <Brain size={11} className="node-badge-icon" />,
						badgeLabel: "thinking",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: "thinking",
						eventIcon: <Brain size={10} />,
						primaryText: `level: ${tlc.thinkingLevel || ""}`,
					};
				}
				case "label": {
					const le = entry as { label?: string; targetId?: string };
					return {
						badgeClass: "badge-other",
						badgeIcon: <Tag size={11} className="node-badge-icon" />,
						badgeLabel: "label",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: "label",
						eventIcon: <Tag size={10} />,
						primaryText: `${le.label || ""}: ${le.targetId?.slice(0, 8) || ""}`,
					};
				}
				default:
					return {
						badgeClass: "badge-other",
						badgeIcon: <Layers size={11} className="node-badge-icon" />,
						badgeLabel: (entry as { type?: string }).type || "event",
						toolTag: null,
						isError: false,
						toolStatus: null,
						hasThinking: false,
						toolInvocations: [],
						eventTag: (entry as { type?: string }).type || "event",
						eventIcon: <Layers size={10} />,
						primaryText: summary,
					};
			}
		}, [entry, summary, item.toolArgs]);

		return (
			<div
				className={`tree-node ${isSelected ? "selected" : ""} ${onPath ? "on-path" : "off-path"} ${hasError ? "has-error" : ""} ${isCurrentLeaf ? "is-leaf" : ""}`}
				onClick={() => onSelect(entry.id)}
				data-id={entry.id}
				role="button"
				tabIndex={0}
			>
				<div className="tree-node-connectors">
					{cells.map((c, i) => (
						<span key={i} className={`tcell ${c}`} />
					))}
					<span className={`tree-node-dot ${isCurrentLeaf ? "is-leaf" : ""}`} />
				</div>

				<div className={`node-badge ${parsed.badgeClass}`}>
					{parsed.badgeIcon}
					<span className="node-badge-text">{parsed.badgeLabel}</span>
				</div>

				<div className="node-content-wrap">
					{parsed.eventTag && (
						<span className="node-event-tag">
							{parsed.eventIcon}
							<span>{parsed.eventTag}</span>
						</span>
					)}

					{parsed.toolTag && (
						<span className={`node-tool-tag mono ${parsed.isError ? "has-error" : ""}`}>
							{parsed.toolStatus}
							<span>{parsed.toolTag}</span>
						</span>
					)}

					{parsed.hasThinking && (
						<span className="node-thinking-tag">
							<Brain size={10} className="thinking-mini-icon" />
							<span>thinking</span>
						</span>
					)}

					{parsed.toolInvocations.length > 0 && (
						<div className="node-inline-tools">
							{parsed.toolInvocations.map((ti, idx) => (
								<span key={idx} className="node-inline-tool mono">
									{getToolIcon(ti.name)}
									<span className="inline-tool-name">{ti.name}</span>
									{ti.args && (
										<span className="inline-tool-args">{highlightText(ti.args, searchQuery)}</span>
									)}
								</span>
							))}
						</div>
					)}

					{parsed.primaryText ? (
						<span
							className={`node-summary ${parsed.toolTag ? "mono" : ""}`}
							title={parsed.primaryText}
						>
							{highlightText(parsed.primaryText, searchQuery)}
						</span>
					) : null}
				</div>

				<div className="node-trailing-meta">
					{isCurrentLeaf && (
						<span className="node-head-chip mono" title="Current active leaf">
							<span className="dot dot-live" />
							<span>HEAD</span>
						</span>
					)}

					{childCount > 1 && (
						<span
							className="node-branch-chip mono"
							title={`${childCount} branches diverged from this entry`}
						>
							<GitBranch size={10} />
							<span>{childCount}</span>
						</span>
					)}

					<span className="node-time mono">{formatTime(entry.timestamp)}</span>

					<span className="node-id-chip mono" title={entry.id}>
						{entry.id.slice(0, 8)}
					</span>
				</div>
			</div>
		);
	},
);

TreeNode.displayName = "TreeNode";
