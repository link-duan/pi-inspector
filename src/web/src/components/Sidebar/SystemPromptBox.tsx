import React, { useState } from "react";
import { ChevronRight, FileCode, WrapText } from "lucide-react";
import { CopyButton } from "../common/CopyButton.tsx";

interface SystemPromptBoxProps {
	prompt?: string;
}

export const SystemPromptBox: React.FC<SystemPromptBoxProps> = ({ prompt = "" }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [wrap, setWrap] = useState(true);

	const charCount = prompt.length;
	const tokenEst = Math.round(charCount / 4);

	return (
		<div className={`panel-card collapsible-card ${isOpen ? "is-open" : ""}`}>
			<div
				className="card-header-bar cursor-pointer"
				onClick={() => setIsOpen((prev) => !prev)}
				role="button"
				tabIndex={0}
			>
				<div className="card-title">
					<ChevronRight size={14} className={`chevron-icon ${isOpen ? "rotate-90" : ""}`} />
					<FileCode size={13} className="title-icon" />
					<span>System Prompt</span>
					{charCount > 0 && (
						<span className="badge-subtle">
							{charCount.toLocaleString()} chars (~{tokenEst.toLocaleString()} tok)
						</span>
					)}
				</div>
				<div className="card-actions" onClick={(e) => e.stopPropagation()}>
					{isOpen && (
						<button
							type="button"
							onClick={() => setWrap((w) => !w)}
							className={`action-btn-icon ${wrap ? "active" : ""}`}
							title={wrap ? "Disable word wrap" : "Enable word wrap"}
						>
							<WrapText size={12} />
						</button>
					)}
					<CopyButton text={prompt} label="Copy" />
				</div>
			</div>

			{isOpen && (
				<div className="prompt-body">
					<pre className={`prompt-content mono ${wrap ? "wrap" : "nowrap"}`}>
						{prompt || <span className="empty-text">No system prompt recorded</span>}
					</pre>
				</div>
			)}
		</div>
	);
};
