import React, { useState, useMemo } from "react";
import { Search, WrapText, X, Code } from "lucide-react";
import { CopyButton } from "../common/CopyButton.tsx";
import {
	highlightMarkdownAndXml,
	highlightSearchInHtml,
	escapeHtml,
} from "../../utils/highlighter.ts";

interface PromptViewProps {
	prompt?: string;
}

export const PromptView: React.FC<PromptViewProps> = ({ prompt = "" }) => {
	const [wrap, setWrap] = useState(true);
	const [syntaxHighlight, setSyntaxHighlight] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);

	const charCount = prompt.length;
	const tokenEst = Math.round(charCount / 4);
	const lineCount = useMemo(() => (prompt ? prompt.split("\n").length : 0), [prompt]);

	const matchCount = useMemo(() => {
		const q = searchQuery.trim().toLowerCase();
		if (!q || !prompt) return 0;
		let count = 0;
		let pos = 0;
		const lower = prompt.toLowerCase();
		while ((pos = lower.indexOf(q, pos)) !== -1) {
			count++;
			pos += q.length;
		}
		return count;
	}, [prompt, searchQuery]);

	const baseHtml = useMemo(() => {
		if (!prompt) return "";
		if (syntaxHighlight) {
			return highlightMarkdownAndXml(prompt);
		}
		return escapeHtml(prompt);
	}, [prompt, syntaxHighlight]);

	const renderedHtml = useMemo(() => {
		if (!baseHtml) return "";
		return highlightSearchInHtml(baseHtml, searchQuery);
	}, [baseHtml, searchQuery]);

	return (
		<div className="prompt-view">
			<div className="view-sub-bar">
				<div className="view-stats">
					<span className="stat-badge mono">{lineCount.toLocaleString()} lines</span>
					<span className="stat-badge mono">{charCount.toLocaleString()} chars</span>
					<span className="stat-badge mono highlight-badge">~{tokenEst.toLocaleString()} tok</span>
				</div>

				<div className="view-actions">
					<button
						type="button"
						onClick={() => setSyntaxHighlight((s) => !s)}
						className={`action-btn-icon ${syntaxHighlight ? "active" : ""}`}
						title={syntaxHighlight ? "Disable syntax highlighting" : "Enable syntax highlighting"}
					>
						<Code size={13} />
					</button>

					<button
						type="button"
						onClick={() => {
							setIsSearchOpen((prev) => !prev);
							if (isSearchOpen) setSearchQuery("");
						}}
						className={`action-btn-icon ${isSearchOpen || searchQuery ? "active" : ""}`}
						title={isSearchOpen ? "Close search" : "Search in prompt"}
					>
						<Search size={13} />
					</button>

					<button
						type="button"
						onClick={() => setWrap((w) => !w)}
						className={`action-btn-icon ${wrap ? "active" : ""}`}
						title={wrap ? "Disable word wrap" : "Enable word wrap"}
					>
						<WrapText size={13} />
					</button>

					<CopyButton text={prompt} label="Copy" />
				</div>
			</div>

			{isSearchOpen && (
				<div className="prompt-search-bar">
					<Search size={13} className="search-icon" />
					<input
						type="text"
						placeholder="Search in prompt..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="prompt-search-input"
						autoFocus
					/>
					{searchQuery && (
						<span className="search-match-count mono">
							{matchCount} {matchCount === 1 ? "match" : "matches"}
						</span>
					)}
					<button
						type="button"
						onClick={() => {
							setSearchQuery("");
							setIsSearchOpen(false);
						}}
						className="action-btn-icon"
						title="Close search"
					>
						<X size={13} />
					</button>
				</div>
			)}

			<div className="prompt-content-area">
				{prompt ? (
					<pre
						className={`prompt-pre ${syntaxHighlight ? "hljs" : ""} mono ${wrap ? "wrap" : "nowrap"}`}
						dangerouslySetInnerHTML={{ __html: renderedHtml }}
					/>
				) : (
					<div className="empty-state-view">
						<span>No system prompt recorded for this session</span>
					</div>
				)}
			</div>
		</div>
	);
};
