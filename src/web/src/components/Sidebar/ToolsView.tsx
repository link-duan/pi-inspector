import React, { useState, useMemo } from "react";
import {
	Search,
	Code,
	CheckCircle2,
	ChevronRight,
	X,
	UnfoldVertical,
	FoldVertical,
} from "lucide-react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import type { ToolInfo } from "../../types.ts";
import { jsonText } from "../../utils/formatters.ts";
import { CopyButton } from "../common/CopyButton.tsx";

hljs.registerLanguage("json", json);

interface ToolsViewProps {
	tools?: ToolInfo[];
	activeTools?: string[];
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools = [], activeTools }) => {
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState<"all" | "active">("all");
	const [expandedParams, setExpandedParams] = useState<Record<string, boolean>>({});

	const activeSet = useMemo(() => {
		if (!activeTools) return null;
		return new Set(activeTools);
	}, [activeTools]);

	const activeCount = useMemo(() => {
		if (!activeSet) return tools.length;
		return tools.filter((t) => activeSet.has(t.name)).length;
	}, [tools, activeSet]);

	const filteredTools = useMemo(() => {
		let result = tools;
		if (filter === "active" && activeSet) {
			result = result.filter((t) => activeSet.has(t.name));
		}
		const q = query.trim().toLowerCase();
		if (!q) return result;
		return result.filter(
			(t) =>
				t.name.toLowerCase().includes(q) ||
				(t.description && t.description.toLowerCase().includes(q)) ||
				(t.sourceInfo?.source && String(t.sourceInfo.source).toLowerCase().includes(q)),
		);
	}, [tools, query, filter, activeSet]);

	const allExpanded = useMemo(() => {
		if (filteredTools.length === 0) return false;
		return filteredTools.every((t) => expandedParams[t.name]);
	}, [filteredTools, expandedParams]);

	const toggleAllSchemas = () => {
		if (allExpanded) {
			setExpandedParams({});
		} else {
			const next: Record<string, boolean> = {};
			for (const t of filteredTools) {
				if (t.parameters && Object.keys(t.parameters).length > 0) {
					next[t.name] = true;
				}
			}
			setExpandedParams(next);
		}
	};

	const toggleToolParams = (name: string) => {
		setExpandedParams((prev) => ({ ...prev, [name]: !prev[name] }));
	};

	return (
		<div className="tools-view">
			<div className="tools-toolbar">
				<div className="tools-search-wrap">
					<Search size={13} className="search-icon" />
					<input
						type="text"
						placeholder="Search tools by name, description..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="tools-search-input"
					/>
					{query && (
						<button
							type="button"
							onClick={() => setQuery("")}
							className="action-btn-icon"
							title="Clear search"
						>
							<X size={12} />
						</button>
					)}
				</div>

				<div className="tools-filter-row">
					<div className="tools-filter-chips">
						<button
							type="button"
							className={`tool-filter-chip ${filter === "all" ? "active" : ""}`}
							onClick={() => setFilter("all")}
						>
							<span>All</span>
							<span className="tool-chip-badge">{tools.length}</span>
						</button>
						<button
							type="button"
							className={`tool-filter-chip ${filter === "active" ? "active" : ""}`}
							onClick={() => setFilter("active")}
						>
							<span>Active</span>
							<span className="tool-chip-badge">{activeCount}</span>
						</button>
					</div>

					<button
						type="button"
						onClick={toggleAllSchemas}
						className="tools-expand-all-btn"
						title={allExpanded ? "Collapse all schemas" : "Expand all schemas"}
					>
						{allExpanded ? <FoldVertical size={12} /> : <UnfoldVertical size={12} />}
						<span>{allExpanded ? "Collapse All" : "Expand All"}</span>
					</button>
				</div>
			</div>

			<div className="tools-list-container">
				{filteredTools.length === 0 ? (
					<div className="empty-state-view">
						<span>No tools match your search/filter</span>
					</div>
				) : (
					filteredTools.map((t) => {
						const hasParams = t.parameters && Object.keys(t.parameters).length > 0;
						const isParamsOpen = Boolean(expandedParams[t.name]);
						const isActive = activeSet ? activeSet.has(t.name) : true;
						const schemaJson = hasParams ? jsonText(t.parameters) : "";

						const highlightedSchema = hasParams
							? (() => {
									try {
										return hljs.highlight(schemaJson, { language: "json" }).value;
									} catch {
										return schemaJson;
									}
								})()
							: "";

						const paramCount =
							t.parameters &&
							typeof t.parameters === "object" &&
							"properties" in t.parameters &&
							t.parameters.properties &&
							typeof t.parameters.properties === "object"
								? Object.keys(t.parameters.properties).length
								: null;

						return (
							<div key={t.name} className={`tool-card ${isActive ? "" : "tool-inactive"}`}>
								<div
									className="tool-card-head"
									onClick={() => hasParams && toggleToolParams(t.name)}
									role={hasParams ? "button" : undefined}
									tabIndex={hasParams ? 0 : undefined}
								>
									<div className="tool-head-left">
										{hasParams && (
											<ChevronRight
												size={13}
												className={`tool-chevron ${isParamsOpen ? "rotate-90" : ""}`}
											/>
										)}
										<span className="tool-card-name mono">{t.name}</span>
										{t.sourceInfo?.source && (
											<span className="tool-source-pill">{String(t.sourceInfo.source)}</span>
										)}
										{isActive && (
											<span className="tool-active-indicator" title="Active tool">
												<CheckCircle2 size={11} />
											</span>
										)}
									</div>

									<div className="tool-head-right" onClick={(e) => e.stopPropagation()}>
										{paramCount !== null && (
											<span className="tool-param-count-badge">
												{paramCount} {paramCount === 1 ? "param" : "params"}
											</span>
										)}
										{hasParams && (
											<button
												type="button"
												onClick={() => toggleToolParams(t.name)}
												className={`tool-schema-toggle-btn ${isParamsOpen ? "active" : ""}`}
												title={isParamsOpen ? "Hide schema" : "Show schema"}
											>
												<Code size={11} />
												<span>schema</span>
											</button>
										)}
									</div>
								</div>

								{t.description && <div className="tool-card-desc">{t.description}</div>}

								{isParamsOpen && hasParams && (
									<div className="tool-schema-section">
										<div className="tool-schema-header">
											<span className="schema-title">Parameter Schema</span>
											<CopyButton text={schemaJson} label="Copy schema" />
										</div>
										<pre
											className="hljs tool-schema-code mono"
											dangerouslySetInnerHTML={{ __html: highlightedSchema }}
										/>
									</div>
								)}
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};
