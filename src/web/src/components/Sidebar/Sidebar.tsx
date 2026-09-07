import React from "react";
import type { SessionSnapshot } from "../../types.ts";
import { MetaCard } from "./MetaCard.tsx";
import { SystemPromptBox } from "./SystemPromptBox.tsx";
import { ToolsBox } from "./ToolsBox.tsx";

interface SidebarProps {
	snapshot: SessionSnapshot | null;
	widthPercent: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ snapshot, widthPercent }) => {
	return (
		<aside
			className="app-sidebar"
			style={{ flex: `0 0 ${widthPercent}%`, width: `${widthPercent}%` }}
		>
			<MetaCard snapshot={snapshot} />
			<SystemPromptBox prompt={snapshot?.systemPrompt} />
			<ToolsBox tools={snapshot?.tools} activeTools={snapshot?.activeTools} />
		</aside>
	);
};
