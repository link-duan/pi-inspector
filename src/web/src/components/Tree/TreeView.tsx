import React, { useEffect, useRef, useCallback } from "react";
import type { FlatTreeNode } from "../../types.ts";
import { TreeNode } from "./TreeNode.tsx";

interface TreeViewProps {
	flatNodes: FlatTreeNode[];
	selectedId: string | null;
	onSelectId: (id: string) => void;
	follow: boolean;
	totalCount: number;
}

export const TreeView: React.FC<TreeViewProps> = ({
	flatNodes,
	selectedId,
	onSelectId,
	follow,
	totalCount,
}) => {
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Auto-scroll to bottom when follow is active
	useEffect(() => {
		if (follow && containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight;
		}
	}, [flatNodes.length, follow]);

	// Keyboard navigation: arrow up/down
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (flatNodes.length === 0) return;
			const currentIndex = flatNodes.findIndex((fn) => fn.node.entry.id === selectedId);

			if (e.key === "ArrowDown") {
				e.preventDefault();
				const nextIndex = Math.min(flatNodes.length - 1, currentIndex + 1);
				onSelectId(flatNodes[nextIndex]!.node.entry.id);
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				const prevIndex = Math.max(
					0,
					currentIndex === -1 ? flatNodes.length - 1 : currentIndex - 1,
				);
				onSelectId(flatNodes[prevIndex]!.node.entry.id);
			}
		},
		[flatNodes, selectedId, onSelectId],
	);

	if (totalCount === 0) {
		return (
			<div className="tree-container empty" ref={containerRef}>
				<div className="tree-empty-message">Waiting for session data…</div>
			</div>
		);
	}

	if (flatNodes.length === 0) {
		return (
			<div className="tree-container empty" ref={containerRef}>
				<div className="tree-empty-message">No entries match your search/filter</div>
			</div>
		);
	}

	return (
		<div
			className="tree-container"
			ref={containerRef}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			role="tree"
		>
			{flatNodes.map((item) => (
				<TreeNode
					key={item.node.entry.id}
					item={item}
					isSelected={item.node.entry.id === selectedId}
					onSelect={onSelectId}
				/>
			))}
		</div>
	);
};
