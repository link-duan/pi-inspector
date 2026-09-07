import React, { useState } from "react";
import { Brain, Terminal, ChevronRight, Image as ImageIcon } from "lucide-react";
import type { ContentBlock } from "../../types.ts";
import { jsonText } from "../../utils/formatters.ts";
import { CopyButton } from "../common/CopyButton.tsx";

interface ContentBlockItemProps {
	block: ContentBlock | string;
	index: number;
}

export const ContentBlockItem: React.FC<ContentBlockItemProps> = ({ block }) => {
	const [thinkingOpen, setThinkingOpen] = useState(false);
	const [argsOpen, setArgsOpen] = useState(true);

	if (typeof block === "string") {
		return <div className="detail-text-block">{block}</div>;
	}

	if (!block || typeof block !== "object") {
		return <div className="detail-text-block">{String(block ?? "")}</div>;
	}

	switch (block.type) {
		case "text": {
			const textVal =
				typeof (block as { text?: unknown }).text === "string"
					? (block as { text: string }).text
					: "";
			return <div className="detail-text-block">{textVal}</div>;
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
						<div className="thinking-content mono">
							{thinkingText || <span className="empty-text">Empty thinking trace</span>}
						</div>
					)}
				</div>
			);
		}

		case "toolCall": {
			const b = block as { name?: string; arguments?: unknown };
			const toolName = typeof b.name === "string" ? b.name : "unknown";
			const argsStr = jsonText(b.arguments ?? {});
			return (
				<div className="detail-card tool-call-card">
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
						</div>
						<div className="card-actions" onClick={(e) => e.stopPropagation()}>
							<CopyButton text={argsStr} label="Copy args" />
						</div>
					</div>
					{argsOpen && <pre className="code-block mono">{argsStr}</pre>}
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
			return <pre className="code-block mono">{jsonText(block)}</pre>;
	}
};

interface ContentBlocksProps {
	content: string | ContentBlock[] | null | undefined;
}

export const ContentBlocks: React.FC<ContentBlocksProps> = ({ content }) => {
	if (content === null || content === undefined || content === "") {
		return null;
	}

	if (typeof content === "string") {
		return <div className="detail-text-block">{content}</div>;
	}

	if (Array.isArray(content)) {
		if (content.length === 0) return null;
		return (
			<div className="content-blocks-list">
				{content.map((block, i) => (
					<ContentBlockItem key={i} block={block} index={i} />
				))}
			</div>
		);
	}

	return <pre className="code-block mono">{jsonText(content)}</pre>;
};
