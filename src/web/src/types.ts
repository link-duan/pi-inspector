import type {
	SessionEntry,
	SessionEntryBase,
	SessionHeader,
	SessionInfo,
	SessionInfoEntry,
	SessionMessageEntry,
	ThinkingLevelChangeEntry,
	ModelChangeEntry,
	CompactionEntry,
	BranchSummaryEntry,
	CustomEntry,
	CustomMessageEntry,
	SessionTreeNode,
	ToolInfo,
	SlashCommandInfo,
} from "@earendil-works/pi-coding-agent";

import type {
	ToolCall,
	ToolResultMessage,
	AssistantMessage,
	UserMessage,
	TextContent,
	ThinkingContent,
	ImageContent,
	Usage,
} from "@earendil-works/pi-ai";

import type { AgentMessage } from "@earendil-works/pi-agent-core";

// Dynamically extract message and entry types from pi unions
export type LabelEntry = Extract<SessionEntry, { type: "label" }>;
export type BashExecutionMessage = Extract<AgentMessage, { role: "bashExecution" }>;
export type CustomMessage = Extract<AgentMessage, { role: "custom" }>;

// Re-export canonical pi types
export type {
	SessionEntry,
	SessionEntryBase,
	SessionHeader,
	SessionInfo,
	SessionInfoEntry,
	SessionMessageEntry,
	ThinkingLevelChangeEntry,
	ModelChangeEntry,
	CompactionEntry,
	BranchSummaryEntry,
	CustomEntry,
	CustomMessageEntry,
	SessionTreeNode,
	ToolInfo,
	SlashCommandInfo,
	ToolCall,
	ToolResultMessage,
	AssistantMessage,
	UserMessage,
	TextContent,
	ThinkingContent,
	ImageContent,
	Usage,
	AgentMessage,
};

// Aliases for backwards compatibility with inspector UI components
export type TreeNodeData = SessionTreeNode;
export type ContentBlockText = TextContent;
export type ContentBlockThinking = ThinkingContent;
export type ContentBlockToolCall = ToolCall;
export type ContentBlockImage = ImageContent;
export type MessageUsage = Usage;
export type ContentBlock =
	| TextContent
	| ThinkingContent
	| ToolCall
	| ImageContent
	| Record<string, unknown>;

// Inspector-specific UI models
export interface SessionModel {
	provider: string;
	id: string;
	name?: string;
}

export interface SessionSnapshot {
	sessionId?: string;
	sessionName?: string;
	cwd?: string;
	sessionFile?: string;
	header?: Record<string, unknown>;
	model?: SessionModel;
	thinkingLevel?: string;
	idle?: boolean;
	systemPrompt?: string;
	entries?: SessionEntry[];
	tree?: SessionTreeNode[];
	branch?: string[];
	leafId?: string;
	commands?: (SlashCommandInfo | { name?: string; description?: string })[];
	tools?: ToolInfo[];
	activeTools?: string[];
	capturedAt: number;
}

export type NormalizedRole = "user" | "assistant" | "tool" | "other";

export interface FlatTreeNode {
	node: SessionTreeNode;
	indent: number;
	showConnector: boolean;
	isLast: boolean;
	gutters: { position: number; show: boolean }[];
	isVirtualRootChild: boolean;
	multipleRoots: boolean;
	cells: string[];
	onPath: boolean;
	role: NormalizedRole;
	summary: string;
	isCurrentLeaf: boolean;
	hasError: boolean;
	childCount: number;
	toolArgs?: string;
}
