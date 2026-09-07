import React, { useState, useMemo } from "react";
import { Search, WrapText, X } from "lucide-react";
import { CopyButton } from "../common/CopyButton.tsx";

interface PromptViewProps {
	prompt?: string;
}

export const PromptView: React.FC<PromptViewProps> = ({ prompt = "" }) => {
	const [wrap, setWrap] = useState(true);
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

	const renderedContent = useMemo(() => {
		if (!prompt) return null;
		const q = searchQuery.trim();
		if (!q) return prompt;

		const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		const regex = new RegExp(`(${escaped})`, "gi");
		const parts = prompt.split(regex);

		return parts.map((part, idx) => {
			if (part.toLowerCase() === q.toLowerCase()) {
				return (
					<mark key={idx} className="search-highlight">
						{part}
					</mark>
				);
			}
			return part;
		});
	}, [prompt, searchQuery]);

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
					<pre className={`prompt-pre mono ${wrap ? "wrap" : "nowrap"}`}>{renderedContent}</pre>
				) : (
					<div className="empty-state-view">
						<span>No system prompt recorded for this session</span>
					</div>
				)}
			</div>
		</div>
	);
};
