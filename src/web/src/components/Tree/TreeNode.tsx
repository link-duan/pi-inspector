import React from "react";
import type { FlatTreeNode } from "../../types.ts";
import { RoleBadge } from "../common/RoleBadge.tsx";
import { formatTime } from "../../utils/formatters.ts";

interface TreeNodeProps {
	item: FlatTreeNode;
	isSelected: boolean;
	onSelect: (id: string) => void;
}

export const TreeNode: React.FC<TreeNodeProps> = React.memo(({ item, isSelected, onSelect }) => {
	const { node, cells, onPath, role, summary } = item;
	const entry = node.entry;

	return (
		<div
			className={`tree-node ${isSelected ? "selected" : ""} ${onPath ? "on-path" : ""}`}
			onClick={() => onSelect(entry.id)}
			data-id={entry.id}
			role="button"
			tabIndex={0}
		>
			{cells.map((c, i) => (
				<span key={i} className={`tcell ${c}`} />
			))}

			<RoleBadge role={role} size="sm" />

			<span className="node-id mono" title={entry.id}>
				{entry.id.slice(0, 8)}
			</span>

			<span className="node-time mono">{formatTime(entry.timestamp)}</span>

			<span className="node-summary" title={summary}>
				{summary}
			</span>
		</div>
	);
});
