import { useMemo } from "react";
import type {
	SessionSnapshot,
	SessionEntry,
	TreeNodeData,
	FlatTreeNode,
	NormalizedRole,
	SessionMessageEntry,
	ToolResultMessage,
	BashExecutionMessage,
	ToolCall,
} from "../types.ts";
import { entrySummary, roleOf } from "../utils/formatters.ts";
import {
	buildToolPairIndex,
	findPairedToolCall,
	formatToolCallSummary,
} from "../utils/toolPairing.ts";

function cloneTree(nodes: TreeNodeData[]): TreeNodeData[] {
	return nodes.map((node) => ({
		entry: node.entry,
		children: node.children ? cloneTree(node.children) : [],
	}));
}

function sortTree(nodes: TreeNodeData[]): TreeNodeData[] {
	const sorted = nodes.toSorted(
		(a, b) => new Date(a.entry.timestamp).getTime() - new Date(b.entry.timestamp).getTime(),
	);
	for (const n of sorted) {
		if (n.children && n.children.length > 0) {
			n.children = sortTree(n.children);
		}
	}
	return sorted;
}

export function getActivePathIds(snapshot: SessionSnapshot | null): Set<string> {
	const ids = new Set<string>();
	if (!snapshot?.leafId) return ids;

	const byId = new Map((snapshot.entries || []).map((e) => [e.id, e]));
	let cur = byId.get(snapshot.leafId);
	while (cur) {
		ids.add(cur.id);
		if (!cur.parentId || cur.parentId === cur.id) break;
		cur = byId.get(cur.parentId);
	}
	return ids;
}

interface FlattenStackItem {
	node: TreeNodeData;
	indent: number;
	justBranched: boolean;
	showConnector: boolean;
	isLast: boolean;
	gutters: { position: number; show: boolean }[];
	isVirtualRootChild: boolean;
}

function buildTreeCells(
	indent: number,
	showConnector: boolean,
	isLast: boolean,
	gutters: { position: number; show: boolean }[],
	isVirtualRootChild: boolean,
	multipleRoots: boolean,
): string[] {
	const displayIndent = multipleRoots ? Math.max(0, indent - 1) : indent;
	const connector = showConnector && !isVirtualRootChild;
	const connectorPosition = connector ? displayIndent - 1 : -1;

	const cells: string[] = [];
	for (let level = 0; level < displayIndent; level++) {
		const gutter = gutters.find((g) => g.position === level);
		if (gutter) {
			cells.push(gutter.show ? "v" : "");
		} else if (connector && level === connectorPosition) {
			cells.push(isLast ? "vh h" : "v h");
		} else {
			cells.push("");
		}
	}
	return cells;
}

export function entryHasError(e: SessionEntry): boolean {
	if (e.type === "message") {
		const msg = (e as SessionMessageEntry).message;
		if (msg.role === "toolResult" && msg.isError) {
			return true;
		}
		if (msg.role === "bashExecution" && msg.exitCode !== undefined && msg.exitCode !== 0) {
			return true;
		}
		if (msg.role === "assistant" && Boolean(msg.errorMessage)) {
			return true;
		}
	} else if ((e as { type: string }).type === "session_compact_failed") {
		return true;
	}
	return false;
}

export function useTreeLayout(
	snapshot: SessionSnapshot | null,
	filterRole: "all" | NormalizedRole | "error" = "all",
	searchQuery: string = "",
): {
	flatNodes: FlatTreeNode[];
	activeIds: Set<string>;
	totalCount: number;
	matchCount: number;
} {
	return useMemo(() => {
		if (!snapshot?.tree || snapshot.tree.length === 0) {
			return { flatNodes: [], activeIds: new Set(), totalCount: 0, matchCount: 0 };
		}

		const toolPairIndex = buildToolPairIndex(snapshot.entries || []);
		const cloned = cloneTree(snapshot.tree);
		const roots = sortTree(cloned);
		const activeIds = getActivePathIds(snapshot);
		const multipleRoots = roots.length > 1;

		const containsActive = new Map<TreeNodeData, boolean>();
		const markActive = (node: TreeNodeData): boolean => {
			let has = activeIds.has(node.entry.id);
			for (const child of node.children || []) {
				if (markActive(child)) has = true;
			}
			containsActive.set(node, has);
			return has;
		};
		roots.forEach(markActive);

		const stack: FlattenStackItem[] = [];
		const orderedRoots = roots.toSorted(
			(a, b) => Number(containsActive.get(b)) - Number(containsActive.get(a)),
		);

		for (let i = orderedRoots.length - 1; i >= 0; i--) {
			const isLast = i === orderedRoots.length - 1;
			stack.push({
				node: orderedRoots[i]!,
				indent: multipleRoots ? 1 : 0,
				justBranched: multipleRoots,
				showConnector: multipleRoots,
				isLast,
				gutters: [],
				isVirtualRootChild: multipleRoots,
			});
		}

		const result: FlatTreeNode[] = [];

		while (stack.length > 0) {
			const item = stack.pop()!;
			const { node, indent, justBranched, showConnector, isLast, gutters, isVirtualRootChild } =
				item;

			const cells = buildTreeCells(
				indent,
				showConnector,
				isLast,
				gutters,
				isVirtualRootChild,
				multipleRoots,
			);
			const role = roleOf(node.entry);
			const summary = entrySummary(node.entry);
			const onPath = activeIds.has(node.entry.id);
			const isCurrentLeaf = Boolean(snapshot?.leafId && node.entry.id === snapshot.leafId);
			const hasError = entryHasError(node.entry);
			const childCount = (node.children || []).length;

			let toolArgs: string | undefined;
			if (node.entry.type === "message") {
				const msg = (node.entry as SessionMessageEntry).message;
				if (msg.role === "toolResult") {
					const tr = msg as ToolResultMessage;
					const paired = findPairedToolCall(
						tr.toolCallId,
						tr.toolName,
						node.entry.parentId,
						toolPairIndex,
					);
					if (paired?.toolCall?.arguments) {
						toolArgs = formatToolCallSummary(tr.toolName, paired.toolCall.arguments);
					}
				} else if (msg.role === "bashExecution") {
					const bm = msg as BashExecutionMessage;
					if (bm.command) {
						toolArgs = bm.command;
					}
				} else if (msg.role === "assistant" && Array.isArray(msg.content)) {
					const calls: string[] = [];
					for (const block of msg.content) {
						if (block && typeof block === "object" && block.type === "toolCall") {
							const tc = block as ToolCall;
							if (tc.name && tc.arguments) {
								const argStr = formatToolCallSummary(tc.name, tc.arguments);
								if (argStr) calls.push(argStr);
							}
						}
					}
					if (calls.length > 0) {
						toolArgs = calls.join(", ");
					}
				}
			}

			result.push({
				node,
				indent,
				showConnector,
				isLast,
				gutters,
				isVirtualRootChild,
				multipleRoots,
				cells,
				onPath,
				role,
				summary,
				isCurrentLeaf,
				hasError,
				childCount,
				toolArgs,
			});

			const children = node.children || [];
			const multipleChildren = children.length > 1;
			const orderedChildren = children.toSorted(
				(a, b) => Number(containsActive.get(b)) - Number(containsActive.get(a)),
			);

			let childIndent: number;
			if (multipleChildren) childIndent = indent + 1;
			else if (justBranched && indent > 0) childIndent = indent + 1;
			else childIndent = indent;

			const connectorDisplayed = showConnector && !isVirtualRootChild;
			const currentDisplayIndent = multipleRoots ? Math.max(0, indent - 1) : indent;
			const connectorPosition = Math.max(0, currentDisplayIndent - 1);
			const childGutters = connectorDisplayed
				? [...gutters, { position: connectorPosition, show: !isLast }]
				: gutters;

			for (let i = orderedChildren.length - 1; i >= 0; i--) {
				const childIsLast = i === orderedChildren.length - 1;
				stack.push({
					node: orderedChildren[i]!,
					childIndent,
					justBranched: multipleChildren,
					showConnector: multipleChildren,
					isLast: childIsLast,
					gutters: childGutters,
					isVirtualRootChild: false,
				} as unknown as FlattenStackItem);
			}
		}

		const totalCount = result.length;

		const query = searchQuery.trim().toLowerCase();
		const filtered = result.filter((item) => {
			if (filterRole === "error") {
				if (!item.hasError) return false;
			} else if (filterRole !== "all" && item.role !== filterRole) {
				return false;
			}

			if (query) {
				const textMatch =
					item.summary.toLowerCase().includes(query) ||
					(Boolean(item.toolArgs) && item.toolArgs!.toLowerCase().includes(query)) ||
					item.node.entry.id.toLowerCase().includes(query) ||
					(item.node.entry.type === "message" &&
						typeof (item.node.entry as SessionMessageEntry).message.role === "string" &&
						(item.node.entry as SessionMessageEntry).message.role.toLowerCase().includes(query));
				if (!textMatch) return false;
			}

			return true;
		});

		return {
			flatNodes: filtered,
			activeIds,
			totalCount,
			matchCount: filtered.length,
		};
	}, [snapshot, filterRole, searchQuery]);
}
