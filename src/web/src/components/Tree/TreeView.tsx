import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import type { FlatTreeNode } from "../../types.ts";
import { TreeNode } from "./TreeNode.tsx";

export interface TreeViewHandle {
	scrollToEntry: (id: string, behavior?: ScrollBehavior) => void;
}

interface TreeViewProps {
	flatNodes: FlatTreeNode[];
	selectedId: string | null;
	onSelectId: (id: string) => void;
	follow: boolean;
	totalCount: number;
}

export const TreeView = forwardRef<TreeViewHandle, TreeViewProps>(
	({ flatNodes, selectedId, onSelectId, follow, totalCount }, ref) => {
		const containerRef = useRef<HTMLDivElement | null>(null);

		// Expose imperative DOM scroll method for explicit user navigation events
		useImperativeHandle(
			ref,
			() => ({
				scrollToEntry: (id: string, behavior: ScrollBehavior = "smooth") => {
					const container = containerRef.current;
					if (!container) return;
					const target = container.querySelector<HTMLElement>(`[data-id="${id}"]`);
					if (!target) return;

					const cRect = container.getBoundingClientRect();
					const tRect = target.getBoundingClientRect();

					// Only scroll if target is outside visible container boundaries
					if (tRect.top < cRect.top || tRect.bottom > cRect.bottom) {
						const offsetDiff =
							tRect.top < cRect.top ? tRect.top - cRect.top - 8 : tRect.bottom - cRect.bottom + 8;
						container.scrollBy({ top: offsetDiff, behavior });
					}
				},
			}),
			[],
		);

		// Auto-scroll to bottom when follow is active
		useEffect(() => {
			if (follow && containerRef.current) {
				containerRef.current.scrollTop = containerRef.current.scrollHeight;
			}
		}, [flatNodes.length, follow]);

		// Keyboard navigation: arrow up/down directly handles selection and DOM scroll in the event
		const handleKeyDown = useCallback(
			(e: React.KeyboardEvent) => {
				if (flatNodes.length === 0) return;
				const currentIndex = flatNodes.findIndex((fn) => fn.node.entry.id === selectedId);

				let nextIndex = currentIndex;
				if (e.key === "ArrowDown") {
					e.preventDefault();
					nextIndex = Math.min(flatNodes.length - 1, currentIndex + 1);
				} else if (e.key === "ArrowUp") {
					e.preventDefault();
					nextIndex = Math.max(0, currentIndex === -1 ? flatNodes.length - 1 : currentIndex - 1);
				}

				if (nextIndex !== currentIndex && nextIndex >= 0) {
					const nextId = flatNodes[nextIndex]!.node.entry.id;
					onSelectId(nextId);

					// Directly align DOM row within the keyboard event handler
					const target = containerRef.current?.querySelector<HTMLElement>(`[data-id="${nextId}"]`);
					target?.scrollIntoView({ block: "nearest", behavior: "auto" });
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
	},
);

TreeView.displayName = "TreeView";
