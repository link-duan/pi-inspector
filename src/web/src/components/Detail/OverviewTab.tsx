import React from "react";
import { Terminal, CheckCircle2, AlertTriangle, Cpu, Layers } from "lucide-react";
import type {
	SessionEntry,
	SessionMessageEntry,
	CompactionEntry,
	BranchSummaryEntry,
	ModelChangeEntry,
	ThinkingLevelChangeEntry,
	AssistantMessage,
	ToolResultMessage,
	BashExecutionMessage,
	ContentBlock,
} from "../../types.ts";
import { RoleBadge } from "../common/RoleBadge.tsx";
import { CopyButton } from "../common/CopyButton.tsx";
import { ContentBlocks } from "./ContentBlocks.tsx";
import { roleOf, formatTime, jsonText } from "../../utils/formatters.ts";

interface OverviewTabProps {
	entry: SessionEntry | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ entry }) => {
	if (!entry) {
		return (
			<div className="overview-empty">
				<span>Select an entry from the tree to view details</span>
			</div>
		);
	}

	const role = roleOf(entry);
	const entryTitle =
		entry.type === "message" ? (entry as SessionMessageEntry).message.role : entry.type;

	return (
		<div className="overview-container">
			<div className="overview-header">
				<div className="header-tags">
					<RoleBadge role={role} size="sm" />
					<span className="overview-title">{entryTitle}</span>
					<span className="overview-id mono" title={entry.id}>
						{entry.id}
					</span>
					{entry.parentId && (
						<span className="overview-parent mono" title={`Parent: ${entry.parentId}`}>
							parent: {entry.parentId.slice(0, 8)}
						</span>
					)}
				</div>
				<span className="overview-time mono">{formatTime(entry.timestamp)}</span>
			</div>

			<div className="overview-body">
				{entry.type === "message" ? (
					<MessageOverview entry={entry as SessionMessageEntry} />
				) : (
					<NonMessageOverview entry={entry} />
				)}
			</div>
		</div>
	);
};

const MessageOverview: React.FC<{ entry: SessionMessageEntry }> = ({ entry }) => {
	const m = entry.message;

	if (m.role === "bashExecution") {
		const bash = m as BashExecutionMessage;
		const isSuccess = bash.exitCode === undefined || bash.exitCode === 0;
		return (
			<div className="bash-overview">
				<div className="detail-card command-card">
					<div className="card-header-bar">
						<div className="card-title">
							<Terminal size={13} className="terminal-icon" />
							<span>Command</span>
						</div>
						<CopyButton text={bash.command || ""} label="Copy command" />
					</div>
					<pre className="code-block bash-block mono">{bash.command || ""}</pre>
				</div>

				{bash.output !== undefined && (
					<div
						className={`detail-card output-card ${isSuccess ? "output-success" : "output-error"}`}
					>
						<div className="card-header-bar">
							<div className="card-title">
								{isSuccess ? (
									<CheckCircle2 size={13} className="success-icon" />
								) : (
									<AlertTriangle size={13} className="error-icon" />
								)}
								<span>Output</span>
								{bash.exitCode !== undefined && (
									<span className={`exit-code-pill ${isSuccess ? "exit-0" : "exit-err"}`}>
										exit: {bash.exitCode}
									</span>
								)}
								{bash.cancelled && <span className="exit-code-pill exit-err">cancelled</span>}
							</div>
							<CopyButton text={bash.output || ""} label="Copy output" />
						</div>
						<pre className="code-block output-block mono">{bash.output || "(no output)"}</pre>
					</div>
				)}
			</div>
		);
	}

	const asst = m.role === "assistant" ? (m as AssistantMessage) : null;
	const tool = m.role === "toolResult" ? (m as ToolResultMessage) : null;
	const content = (m as { content?: string | ContentBlock[] }).content;

	return (
		<div className="message-overview-content">
			{/* Assistant Metadata / Token Usage */}
			{asst && (
				<div className="detail-card meta-chip-card">
					<div className="chip-row">
						{asst.model && (
							<div className="info-chip">
								<Cpu size={12} />
								<span>
									{asst.provider ? `${asst.provider}/` : ""}
									{asst.model}
								</span>
							</div>
						)}
						{asst.stopReason && (
							<div className="info-chip">
								<span>
									stop: <strong>{asst.stopReason}</strong>
								</span>
							</div>
						)}
						{asst.usage && (
							<div className="info-chip token-chip">
								<Layers size={12} />
								<span>
									tokens: in <strong>{asst.usage.inputTokens ?? 0}</strong> / out{" "}
									<strong>{asst.usage.outputTokens ?? 0}</strong>
									{asst.usage.cacheReadInputTokens
										? ` (cache: ${asst.usage.cacheReadInputTokens})`
										: ""}
								</span>
							</div>
						)}
					</div>
					{asst.errorMessage && (
						<div className="error-banner">
							<AlertTriangle size={13} />
							<span>{asst.errorMessage}</span>
						</div>
					)}
				</div>
			)}

			{/* Tool Result Metadata */}
			{tool && (
				<div className="detail-card meta-chip-card">
					<div className="chip-row">
						<div className="info-chip">
							<Terminal size={12} />
							<span>
								tool: <strong>{tool.toolName}</strong>
							</span>
						</div>
						<div className={`info-chip ${tool.isError ? "chip-error" : "chip-success"}`}>
							{tool.isError ? "Error" : "Success"}
						</div>
						{tool.toolCallId && (
							<div className="info-chip mono">
								<span>call: {tool.toolCallId.slice(0, 10)}</span>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Content blocks */}
			<ContentBlocks content={content} />

			{/* Tool details if present */}
			{tool && tool.details !== undefined && (
				<div className="detail-card">
					<div className="card-header-bar">
						<div className="card-title">
							<span>Tool Execution Details</span>
						</div>
						<CopyButton text={jsonText(tool.details)} label="Copy details" />
					</div>
					<pre className="code-block mono">{jsonText(tool.details)}</pre>
				</div>
			)}
		</div>
	);
};

const NonMessageOverview: React.FC<{ entry: SessionEntry }> = ({ entry }) => {
	switch (entry.type) {
		case "compaction": {
			const c = entry as CompactionEntry;
			return (
				<div className="non-message-grid">
					{c.summary && (
						<div className="detail-card">
							<div className="card-header-bar">
								<span className="card-title">Compaction Summary</span>
								<CopyButton text={c.summary} />
							</div>
							<div className="detail-text-block">{c.summary}</div>
						</div>
					)}
					<div className="detail-card">
						<div className="card-header-bar">
							<span className="card-title">Compaction Stats</span>
						</div>
						<div className="kv-grid">
							<span className="kv-key">tokensBefore:</span>
							<span className="kv-val mono">{c.tokensBefore?.toLocaleString() ?? "–"}</span>
							<span className="kv-key">firstKeptEntryId:</span>
							<span className="kv-val mono">{c.firstKeptEntryId ?? "–"}</span>
						</div>
					</div>
				</div>
			);
		}

		case "branch_summary": {
			const b = entry as BranchSummaryEntry;
			return (
				<div className="non-message-grid">
					{b.summary && (
						<div className="detail-card">
							<div className="card-header-bar">
								<span className="card-title">Branch Summary</span>
								<CopyButton text={b.summary} />
							</div>
							<div className="detail-text-block">{b.summary}</div>
						</div>
					)}
					<div className="detail-card">
						<div className="kv-grid">
							<span className="kv-key">fromId:</span>
							<span className="kv-val mono">{b.fromId ?? "–"}</span>
							<span className="kv-key">fromParentId:</span>
							<span className="kv-val mono">{b.fromParentId ?? "–"}</span>
						</div>
					</div>
				</div>
			);
		}

		case "model_change": {
			const mc = entry as ModelChangeEntry;
			return (
				<div className="detail-card">
					<div className="kv-grid">
						<span className="kv-key">provider:</span>
						<span className="kv-val">{mc.provider}</span>
						<span className="kv-key">model:</span>
						<span className="kv-val mono">{mc.modelId}</span>
					</div>
				</div>
			);
		}

		case "thinking_level_change": {
			const tc = entry as ThinkingLevelChangeEntry;
			return (
				<div className="detail-card">
					<div className="kv-grid">
						<span className="kv-key">thinkingLevel:</span>
						<span className="kv-val">{tc.thinkingLevel}</span>
					</div>
				</div>
			);
		}

		default:
			return (
				<div className="detail-card">
					<div className="card-header-bar">
						<span className="card-title">Raw Entry</span>
						<CopyButton text={jsonText(entry)} />
					</div>
					<pre className="code-block mono">{jsonText(entry)}</pre>
				</div>
			);
	}
};
