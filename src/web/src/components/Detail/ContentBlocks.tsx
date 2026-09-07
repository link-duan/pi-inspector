import React, { useState } from "react";
import {
	Brain,
	Terminal,
	ChevronRight,
	Image as ImageIcon,
	CheckCircle2,
	AlertTriangle,
	ArrowUpRight,
} from "lucide-react";
import type { ContentBlock, ToolCall } from "../../types.ts";
import { jsonText } from "../../utils/formatters.ts";
import { CopyButton } from "../common/CopyButton.tsx";
import {
	type ToolPairIndex,
	findPairedToolResult,
	extractResultText,
} from "../../utils/toolPairing.ts";
import { HighlightedTextBlock, HighlightedCodeBlock } from "./HighlightedBlock.tsx";

interface ContentBlockItemProps {
	block: ContentBlock | string;
	index: number;
	toolPairIndex?: ToolPairIndex;
	onNavigateToEntry?: (id: string) => void;
	currentEntryId?: string;
	syntaxHighlight?: boolean;
	searchQuery?: string;
}

export const ContentBlockItem: React.FC<ContentBlockItemProps> = ({
	block,
	toolPairIndex,
	onNavigateToEntry,
	currentEntryId,
	syntaxHighlight = true,
	searchQuery = "",
}) => {
	const [thinkingOpen, setThinkingOpen] = useState(false);
	const [argsOpen, setArgsOpen] = useState(true);

	if (typeof block === "string") {
		return (
			<HighlightedTextBlock
				text={block}
				syntaxHighlight={syntaxHighlight}
				searchQuery={searchQuery}
			/>
		);
	}

	if (!block || typeof block !== "object") {
		return (
			<HighlightedTextBlock
				text={String(block ?? "")}
				syntaxHighlight={syntaxHighlight}
				searchQuery={searchQuery}
			/>
		);
	}

	switch (block.type) {
		case "text": {
			const textVal =
				typeof (block as { text?: unknown }).text === "string"
					? (block as { text: string }).text
					: "";
			return (
				<HighlightedTextBlock
					text={textVal}
					syntaxHighlight={syntaxHighlight}
					searchQuery={searchQuery}
				/>
			);
		}

		case "thinking": {
			const b = block as { thinking?: unknown; text?: unknown };
			const thinkingText =
				typeof b.thinking === "string" ? b.thinking : typeof b.text === "string" ? b.text : "";
			return (
				<div className={`thinking-card ${thinkingOpen ? "is-open" : ""}`}>
					<div
						className="card-header-bar cursor-pointer"
						onClick={() => setThinkingOpen((v) => !v)}
						role="button"
						tabIndex={0}
					>
						<div className="card-title">
							<ChevronRight
								size={13}
								className={`chevron-icon ${thinkingOpen ? "rotate-90" : ""}`}
							/>
							<Brain size={12} className="thinking-icon" />
							<span>Thought process</span>
							<span className="badge-subtle">{thinkingText.length} chars</span>
						</div>
						<div className="card-actions" onClick={(e) => e.stopPropagation()}>
							<CopyButton text={thinkingText} label="Copy" />
						</div>
					</div>
					{thinkingOpen && (
						<HighlightedCodeBlock
							code={thinkingText}
							language="prompt"
							emptyFallback="Empty thinking trace"
							className="thinking-content mono"
							syntaxHighlight={syntaxHighlight}
							searchQuery={searchQuery}
						/>
					)}
				</div>
			);
		}

		case "toolCall": {
			const b = block as ToolCall;
			const toolCallId = b.id;
			const toolName = typeof b.name === "string" ? b.name : "unknown";
			const argsStr = jsonText(b.arguments ?? {});
			const pairedResult = findPairedToolResult(
				toolCallId,
				toolName,
				currentEntryId,
				toolPairIndex,
			);
			const hasResult = pairedResult !== null;
			const isError = pairedResult?.resultMessage?.isError === true;
			const resultText = hasResult ? extractResultText(pairedResult.resultMessage.content) : "";

			return (
				<div
					className={`detail-card tool-call-card ${
						hasResult ? (isError ? "tool-call-has-error" : "tool-call-has-success") : ""
					}`}
				>
					<div
						className="card-header-bar cursor-pointer"
						onClick={() => setArgsOpen((v) => !v)}
						role="button"
						tabIndex={0}
					>
						<div className="card-title">
							<ChevronRight size={13} className={`chevron-icon ${argsOpen ? "rotate-90" : ""}`} />
							<Terminal size={12} className="tool-icon" />
							<span>Tool Call:</span>
							<span className="mono tool-call-name">{toolName}</span>

							{hasResult ? (
								<span
									className={`tool-exec-badge ${
										isError ? "tool-badge-error" : "tool-badge-success"
									}`}
								>
									{isError ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
									<span>{isError ? "Error" : "Success"}</span>
								</span>
							) : (
								<span className="tool-exec-badge tool-badge-pending">
									<span>Pending</span>
								</span>
							)}
						</div>
						<div className="card-actions" onClick={(e) => e.stopPropagation()}>
							{hasResult && onNavigateToEntry && (
								<button
									type="button"
									className="card-action-btn tool-jump-btn"
									title={`Jump to tool result entry (${pairedResult.resultEntry.id})`}
									onClick={() => onNavigateToEntry(pairedResult.resultEntry.id)}
								>
									<span>Result</span>
									<ArrowUpRight size={12} />
								</button>
							)}
							<CopyButton text={argsStr} label="Copy args" />
						</div>
					</div>

					{argsOpen && (
						<div className="tool-call-body">
							<div className="tool-subcard-header">
								<span className="tool-subcard-title">Arguments</span>
							</div>
							<HighlightedCodeBlock
								code={argsStr}
								language="json"
								syntaxHighlight={syntaxHighlight}
								searchQuery={searchQuery}
							/>

							{hasResult && (
								<div className="tool-inline-result">
									<div className="tool-inline-result-header">
										<div className="result-header-label">
											{isError ? (
												<AlertTriangle size={12} className="error-icon" />
											) : (
												<CheckCircle2 size={12} className="success-icon" />
											)}
											<span>Execution Result</span>
											{pairedResult.resultEntry.id && (
												<span
													className="result-entry-pill mono"
													title={pairedResult.resultEntry.id}
												>
													entry: {pairedResult.resultEntry.id.slice(0, 8)}
												</span>
											)}
										</div>
										<div className="result-header-actions">
											<CopyButton text={resultText} label="Copy output" />
										</div>
									</div>
									<HighlightedCodeBlock
										code={resultText}
										language="auto"
										emptyFallback="(empty result)"
										className={`code-block mono tool-output-block ${
											isError ? "tool-output-error" : "tool-output-success"
										}`}
										syntaxHighlight={syntaxHighlight}
										searchQuery={searchQuery}
									/>
								</div>
							)}
						</div>
					)}
				</div>
			);
		}

		case "image": {
			const b = block as { mimeType?: string; data?: string };
			return (
				<div className="detail-card image-card">
					<div className="card-header-bar">
						<div className="card-title">
							<ImageIcon size={12} />
							<span>Image {b.mimeType ? `(${b.mimeType})` : ""}</span>
						</div>
					</div>
					{b.data && (
						<div className="image-preview">
							<img
								src={`data:${b.mimeType || "image/png"};base64,${b.data}`}
								alt="Message attachment"
							/>
						</div>
					)}
				</div>
			);
		}

		default:
			return (
				<HighlightedCodeBlock
					code={jsonText(block)}
					language="json"
					syntaxHighlight={syntaxHighlight}
					searchQuery={searchQuery}
				/>
			);
	}
};

interface ContentBlocksProps {
	content: string | ContentBlock[] | null | undefined;
	toolPairIndex?: ToolPairIndex;
	onNavigateToEntry?: (id: string) => void;
	currentEntryId?: string;
	syntaxHighlight?: boolean;
	searchQuery?: string;
}

export const ContentBlocks: React.FC<ContentBlocksProps> = ({
	content,
	toolPairIndex,
	onNavigateToEntry,
	currentEntryId,
	syntaxHighlight = true,
	searchQuery = "",
}) => {
	if (content === null || content === undefined || content === "") {
		return null;
	}

	if (typeof content === "string") {
		return (
			<HighlightedTextBlock
				text={content}
				syntaxHighlight={syntaxHighlight}
				searchQuery={searchQuery}
			/>
		);
	}

	if (Array.isArray(content)) {
		if (content.length === 0) return null;
		return (
			<div className="content-blocks-list">
				{content.map((block, i) => (
					<ContentBlockItem
						key={i}
						block={block}
						index={i}
						toolPairIndex={toolPairIndex}
						onNavigateToEntry={onNavigateToEntry}
						currentEntryId={currentEntryId}
						syntaxHighlight={syntaxHighlight}
						searchQuery={searchQuery}
					/>
				))}
			</div>
		);
	}

	return (
		<HighlightedCodeBlock
			code={jsonText(content)}
			language="json"
			syntaxHighlight={syntaxHighlight}
			searchQuery={searchQuery}
		/>
	);
};
