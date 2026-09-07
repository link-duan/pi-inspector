import React, { useState, useMemo } from "react";
import { ChevronRight, Wrench, Search, Code } from "lucide-react";
import type { ToolInfo } from "../../types.ts";
import { jsonText } from "../../utils/formatters.ts";

interface ToolsBoxProps {
	tools?: ToolInfo[];
	activeTools?: string[];
}

export const ToolsBox: React.FC<ToolsBoxProps> = ({ tools = [], activeTools }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});

	const toggleParams = (name: string, e: React.MouseEvent) => {
		e.stopPropagation();
		setExpandedParams((prev) => ({ ...prev, [name]: !prev[name] }));
	};

	const filteredTools = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return tools;
		return tools.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				(t.description && t.description.toLowerCase().includes(q)) ||
				(t.sourceInfo?.source && String(t.sourceInfo.source).toLowerCase().includes(q)),
		);
	}, [tools, query]);

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
					<Wrench size={13} className="title-icon" />
					<span>Tools</span>
					<span className="badge-subtle">{tools.length}</span>
				</div>
			</div>

			{isOpen && (
				<div className="tools-body">
					{tools.length > 5 && (
						<div className="tools-search-box" onClick={(e) => e.stopPropagation()}>
							<Search size={12} className="search-icon" />
							<input
								type="text"
								placeholder="Filter tools..."
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								className="search-input"
							/>
						</div>
					)}

					<div className="tools-list">
						{filteredTools.length === 0 ? (
							<div className="empty-state-text">No tools match filter</div>
						) : (
							filteredTools.map((t) => {
								const hasParams = t.parameters && Object.keys(t.parameters).length > 0;
								const isParamsOpen = Boolean(expandedParams[t.name]);
								const isActive = activeTools ? activeTools.includes(t.name) : true;

								return (
									<div key={t.name} className={`tool-item ${isActive ? "" : "tool-inactive"}`}>
										<div className="tool-head">
											<span className="tool-name mono">{t.name}</span>
											{t.sourceInfo?.source && (
												<span className="tool-source-badge">{String(t.sourceInfo.source)}</span>
											)}
											{hasParams && (
												<button
													type="button"
													onClick={(e) => toggleParams(t.name, e)}
													className="tool-params-btn"
													title="Toggle parameter schema"
												>
													<Code size={11} />
													<span>schema</span>
												</button>
											)}
										</div>

										{t.description && <div className="tool-desc">{t.description}</div>}

										{isParamsOpen && hasParams && (
											<pre className="tool-schema-pre mono">{jsonText(t.parameters)}</pre>
										)}
									</div>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
};
