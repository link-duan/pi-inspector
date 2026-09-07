import { Search, CheckSquare, Square, AlertCircle } from "lucide-react";
import type { NormalizedRole } from "../../types.ts";

interface TreeToolbarProps {
	filterRole: "all" | NormalizedRole | "error";
	onSelectFilterRole: (role: "all" | NormalizedRole | "error") => void;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	follow: boolean;
	onFollowChange: (follow: boolean) => void;
	matchCount: number;
	totalCount: number;
}

export const TreeToolbar: React.FC<TreeToolbarProps> = ({
	filterRole,
	onSelectFilterRole,
	searchQuery,
	onSearchQueryChange,
	follow,
	onFollowChange,
	matchCount,
	totalCount,
}) => {
	const filters: { id: "all" | NormalizedRole | "error"; label: string }[] = [
		{ id: "all", label: "All" },
		{ id: "user", label: "User" },
		{ id: "assistant", label: "Assistant" },
		{ id: "tool", label: "Tools" },
		{ id: "error", label: "Errors" },
	];

	return (
		<div className="tree-toolbar">
			<div className="filter-chips">
				{filters.map((f) => {
					const isActive = filterRole === f.id;
					return (
						<button
							key={f.id}
							type="button"
							className={`filter-chip ${isActive ? "active" : ""}`}
							onClick={() => onSelectFilterRole(f.id)}
						>
							{f.id === "error" && <AlertCircle size={11} className="chip-icon" />}
							<span>{f.label}</span>
						</button>
					);
				})}
			</div>

			<div className="toolbar-search">
				<Search size={13} className="search-icon" />
				<input
					type="text"
					placeholder="Search entries..."
					value={searchQuery}
					onChange={(e) => onSearchQueryChange(e.target.value)}
					className="toolbar-search-input"
				/>
				{searchQuery && (
					<button
						type="button"
						onClick={() => onSearchQueryChange("")}
						className="search-clear-btn"
						title="Clear search"
					>
						×
					</button>
				)}
			</div>

			<div className="toolbar-right">
				<button
					type="button"
					className={`follow-toggle-btn ${follow ? "is-following" : ""}`}
					onClick={() => onFollowChange(!follow)}
					title="Auto-scroll to latest entry"
				>
					{follow ? <CheckSquare size={14} /> : <Square size={14} />}
					<span>Follow</span>
				</button>

				<span className="entry-counter mono">
					{matchCount}
					{matchCount !== totalCount ? `/${totalCount}` : ""}
				</span>
			</div>
		</div>
	);
};
