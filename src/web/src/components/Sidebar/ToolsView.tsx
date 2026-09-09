import React, { useState, useMemo, memo } from "react";
import { Search, Code, ChevronRight, X, Filter } from "lucide-react";
import type { ToolInfo } from "../../types.ts";
import { jsonText } from "../../utils/formatters.ts";
import { CopyButton } from "../common/CopyButton.tsx";
import { highlightJson } from "../../utils/highlighter.ts";

interface ParsedParam {
	name: string;
	type: string;
	required: boolean;
	description: string;
	defaultVal?: string;
	enumValues?: string[];
}

function parseParameters(parameters: unknown): ParsedParam[] {
	if (!parameters || typeof parameters !== "object") return [];
	const p = parameters as Record<string, unknown>;
	const props = p.properties;
	if (!props || typeof props !== "object") return [];

	const requiredSet = new Set(Array.isArray(p.required) ? (p.required as string[]) : []);

	return Object.entries(props as Record<string, Record<string, unknown>>).map(([name, schema]) => {
		const s = schema && typeof schema === "object" ? schema : {};
		let typeStr = typeof s.type === "string" ? s.type : "";
		if (!typeStr && Array.isArray(s.anyOf)) {
			typeStr = (s.anyOf as { type?: string }[]).map((x) => x.type || "any").join(" | ");
		}
		if (!typeStr && Array.isArray(s.enum)) {
			typeStr = "enum";
		}
		return {
			name,
			type: typeStr || "any",
			required: requiredSet.has(name),
			description: typeof s.description === "string" ? s.description : "",
			defaultVal: s.default !== undefined ? String(s.default) : undefined,
			enumValues: Array.isArray(s.enum) ? (s.enum as unknown[]).map(String) : undefined,
		};
	});
}

interface ToolRowProps {
	tool: ToolInfo;
	isActive: boolean;
	searchQuery?: string;
}

const ToolRow: React.FC<ToolRowProps> = memo(({ tool, isActive }) => {
	const [expanded, setExpanded] = useState(false);
	const [showRawSchema, setShowRawSchema] = useState(false);

	const hasParams = Boolean(
		tool.parameters &&
		typeof tool.parameters === "object" &&
		Object.keys(tool.parameters).length > 0,
	);

	const parsedParams = useMemo(() => {
		if (!hasParams) return [];
		return parseParameters(tool.parameters);
	}, [tool.parameters, hasParams]);

	// Raw schema string and syntax highlighting are computed strictly on-demand (lazy)
	const rawSchemaJson = useMemo(() => {
		if (!showRawSchema || !hasParams) return "";
		return jsonText(tool.parameters);
	}, [showRawSchema, hasParams, tool.parameters]);

	const highlightedSchema = useMemo(() => {
		if (!rawSchemaJson) return "";
		return highlightJson(rawSchemaJson);
	}, [rawSchemaJson]);

	const guidelines = tool.promptGuidelines;
	const isCustomSource = tool.sourceInfo?.source && tool.sourceInfo.source !== "builtin";

	return (
		<div className={`tool-item ${expanded ? "expanded" : ""} ${isActive ? "active" : "inactive"}`}>
			<div
				className="tool-item-header"
				onClick={() => setExpanded((prev) => !prev)}
				role="button"
				tabIndex={0}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						setExpanded((prev) => !prev);
					}
				}}
			>
				<ChevronRight size={13} className={`tool-item-chevron ${expanded ? "rotate-90" : ""}`} />

				<span className="tool-item-name mono">{tool.name}</span>

				{isCustomSource && (
					<span className="tool-source-tag">{String(tool.sourceInfo?.source)}</span>
				)}

				{!isActive && <span className="tool-disabled-tag mono">disabled</span>}

				<span className="tool-item-spacer" />

				<span className="tool-item-meta mono">
					{hasParams
						? `${parsedParams.length} ${parsedParams.length === 1 ? "param" : "params"}`
						: "no params"}
				</span>
			</div>

			{expanded && (
				<div className="tool-item-detail">
					{tool.description && <p className="tool-desc-text">{tool.description}</p>}

					{guidelines && guidelines.length > 0 && (
						<div className="tool-detail-section">
							<div className="tool-section-heading mono">GUIDELINES ({guidelines.length})</div>
							<div className="tool-guidelines-list">
								{guidelines.map((g, i) => (
									<div key={i} className="tool-guideline-item">
										{guidelines.length > 1 && <span className="guideline-bullet">•</span>}
										<span>{g}</span>
									</div>
								))}
							</div>
						</div>
					)}

					{parsedParams.length > 0 ? (
						<div className="tool-detail-section">
							<div className="tool-section-heading mono">PARAMETERS ({parsedParams.length})</div>

							<div className="tool-params-list">
								{parsedParams.map((p) => (
									<div key={p.name} className="param-item">
										<div className="param-sig">
											<span className="param-name mono">
												{p.name}
												{p.required ? "" : "?"}
											</span>
											<span className="param-colon">:</span>
											<span className="param-type mono">{p.type}</span>
											{p.required ? <span className="param-badge-req">required</span> : null}
											{p.defaultVal !== undefined && (
												<span className="param-badge-def mono">default: {p.defaultVal}</span>
											)}
										</div>

										{p.description && <div className="param-desc">{p.description}</div>}

										{p.enumValues && p.enumValues.length > 0 && (
											<div className="param-enum mono">
												values: {p.enumValues.map((v) => `"${v}"`).join(" | ")}
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					) : hasParams ? (
						<div className="tool-params-empty mono">Custom schema (no properties defined)</div>
					) : null}

					{hasParams && (
						<div className="tool-detail-footer">
							<button
								type="button"
								className={`tool-schema-toggle ${showRawSchema ? "active" : ""}`}
								onClick={() => setShowRawSchema((prev) => !prev)}
							>
								<Code size={11} />
								<span>{showRawSchema ? "Hide Schema" : "Raw JSON"}</span>
							</button>

							<CopyButton text={jsonText(tool.parameters)} label="Copy Schema" />
						</div>
					)}

					{showRawSchema && hasParams && (
						<pre
							className="hljs tool-raw-schema-code mono"
							dangerouslySetInnerHTML={{ __html: highlightedSchema }}
						/>
					)}
				</div>
			)}
		</div>
	);
});

ToolRow.displayName = "ToolRow";

interface ToolsViewProps {
	tools?: ToolInfo[];
	activeTools?: string[];
}

export const ToolsView: React.FC<ToolsViewProps> = ({ tools = [], activeTools }) => {
	const [query, setQuery] = useState("");
	const [isSearchOpen, setIsSearchOpen] = useState(false);
	const [filter, setFilter] = useState<"all" | "active">("all");
	const [disabledExpanded, setDisabledExpanded] = useState(false);

	const activeSet = useMemo(() => {
		if (!activeTools) return null;
		return new Set(activeTools);
	}, [activeTools]);

	const activeCount = useMemo(() => {
		if (!activeSet) return tools.length;
		return tools.filter((t) => activeSet.has(t.name)).length;
	}, [tools, activeSet]);

	const disabledCount = activeSet ? tools.length - activeCount : 0;

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

	const { activeList, disabledList } = useMemo(() => {
		if (!activeSet) {
			return { activeList: filteredTools, disabledList: [] };
		}
		const active: ToolInfo[] = [];
		const disabled: ToolInfo[] = [];
		for (const t of filteredTools) {
			if (activeSet.has(t.name)) {
				active.push(t);
			} else {
				disabled.push(t);
			}
		}
		return { activeList: active, disabledList: disabled };
	}, [filteredTools, activeSet]);

	// Auto-expand disabled group if user enters a search query that matches disabled tools
	const isGroupOpen = disabledExpanded || Boolean(query.trim());

	return (
		<div className="tools-view">
			<div className="view-sub-bar">
				<div className="view-stats">
					<span className="stat-badge mono">
						{tools.length} {tools.length === 1 ? "tool" : "tools"}
					</span>
					{activeSet && (
						<button
							type="button"
							className={`stat-badge mono filter-stat-badge ${filter === "active" ? "active" : ""}`}
							onClick={() => setFilter((f) => (f === "active" ? "all" : "active"))}
							title={
								filter === "active"
									? "Showing active tools only (click to show all)"
									: "Filter active tools only"
							}
						>
							<span className="filter-dot" />
							<span>{activeCount} active</span>
						</button>
					)}
					{activeSet && disabledCount > 0 && filter === "all" && (
						<span
							className="stat-badge mono disabled-stat-badge"
							title={`${disabledCount} tools currently disabled for the model`}
						>
							{disabledCount} disabled
						</span>
					)}
				</div>

				<div className="view-actions">
					<button
						type="button"
						onClick={() => setFilter((f) => (f === "active" ? "all" : "active"))}
						className={`action-btn-icon ${filter === "active" ? "active" : ""}`}
						title={
							filter === "active" ? "Showing active tools (click for all)" : "Filter active tools"
						}
					>
						<Filter size={13} />
					</button>

					<button
						type="button"
						onClick={() => {
							setIsSearchOpen((prev) => !prev);
							if (isSearchOpen) setQuery("");
						}}
						className={`action-btn-icon ${isSearchOpen || query ? "active" : ""}`}
						title={isSearchOpen ? "Close search" : "Search tools"}
					>
						<Search size={13} />
					</button>
				</div>
			</div>

			{isSearchOpen && (
				<div className="prompt-search-bar">
					<Search size={13} className="search-icon" />
					<input
						type="text"
						placeholder="Search tools, descriptions..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						className="prompt-search-input"
						autoFocus
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
			)}

			<div className="tools-list">
				{filteredTools.length === 0 ? (
					<div className="empty-state-view">
						<span>No tools match your filter</span>
					</div>
				) : (
					<>
						{activeList.map((t) => (
							<ToolRow key={t.name} tool={t} isActive={true} searchQuery={query} />
						))}

						{disabledList.length > 0 && (
							<div className="tools-disabled-section">
								<div
									className="tools-group-header"
									onClick={() => setDisabledExpanded((prev) => !prev)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											setDisabledExpanded((prev) => !prev);
										}
									}}
								>
									<ChevronRight
										size={12}
										className={`tools-group-chevron ${isGroupOpen ? "rotate-90" : ""}`}
									/>
									<span className="tools-group-title mono">DISABLED TOOLS</span>
									<span className="tools-group-badge mono">{disabledList.length}</span>
								</div>

								{isGroupOpen && (
									<div className="tools-disabled-group">
										{disabledList.map((t) => (
											<ToolRow key={t.name} tool={t} isActive={false} searchQuery={query} />
										))}
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
};
