import React, { useState, useMemo } from "react";
import { FileCode, Wrench, Info, PanelLeftClose } from "lucide-react";
import type { SessionSnapshot } from "../../types.ts";
import { PromptView } from "./PromptView.tsx";
import { ToolsView } from "./ToolsView.tsx";
import { SessionView } from "./SessionView.tsx";

type SidebarTab = "prompt" | "tools" | "session";

interface SidebarProps {
	snapshot: SessionSnapshot | null;
	widthPercent: number;
	onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ snapshot, widthPercent, onToggleCollapse }) => {
	const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
		const saved = localStorage.getItem("inspect.sidebarTab");
		if (saved === "prompt" || saved === "tools" || saved === "session") {
			return saved;
		}
		return "prompt";
	});

	const selectTab = (tab: SidebarTab) => {
		setActiveTab(tab);
		localStorage.setItem("inspect.sidebarTab", tab);
	};

	const promptBadge = useMemo(() => {
		const len = snapshot?.systemPrompt?.length ?? 0;
		if (len === 0) return null;
		const tokens = Math.round(len / 4);
		return tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : String(tokens);
	}, [snapshot?.systemPrompt]);

	const toolsBadge = snapshot?.tools ? String(snapshot.tools.length) : "0";

	return (
		<aside
			className="app-sidebar"
			style={{ flex: `0 0 ${widthPercent}%`, width: `${widthPercent}%` }}
		>
			<div className="sidebar-toolbar">
				<div className="sidebar-tabs" role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "prompt"}
						className={`sidebar-tab-btn ${activeTab === "prompt" ? "active" : ""}`}
						onClick={() => selectTab("prompt")}
						title="System Prompt"
					>
						<FileCode size={13} />
						<span>Prompt</span>
						{promptBadge && <span className="sidebar-tab-badge mono">{promptBadge}</span>}
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "tools"}
						className={`sidebar-tab-btn ${activeTab === "tools" ? "active" : ""}`}
						onClick={() => selectTab("tools")}
						title="Tools & Schemas"
					>
						<Wrench size={13} />
						<span>Tools</span>
						<span className="sidebar-tab-badge mono">{toolsBadge}</span>
					</button>

					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "session"}
						className={`sidebar-tab-btn ${activeTab === "session" ? "active" : ""}`}
						onClick={() => selectTab("session")}
						title="Session Info"
					>
						<Info size={13} />
						<span>Session</span>
					</button>
				</div>

				<div className="sidebar-toolbar-actions">
					{onToggleCollapse && (
						<button
							type="button"
							onClick={onToggleCollapse}
							className="sidebar-icon-btn"
							title="Collapse sidebar"
						>
							<PanelLeftClose size={14} />
						</button>
					)}
				</div>
			</div>

			<div className="sidebar-tab-content">
				{activeTab === "prompt" && <PromptView prompt={snapshot?.systemPrompt} />}
				{activeTab === "tools" && (
					<ToolsView tools={snapshot?.tools} activeTools={snapshot?.activeTools} />
				)}
				{activeTab === "session" && <SessionView snapshot={snapshot} />}
			</div>
		</aside>
	);
};
