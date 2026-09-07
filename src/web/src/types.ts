export interface SessionModel {
	provider: string;
	id: string;
	name?: string;
}

export interface ToolSourceInfo {
	source?: string;
	[key: string]: unknown;
}

export interface ToolInfo {
	name: string;
	description?: string;
	sourceInfo?: ToolSourceInfo;
	parameters?: Record<string, unknown>;
}

export interface ContentBlockText {
	type: "text";
	text: string;
}

export interface ContentBlockThinking {
	type: "thinking";
	thinking?: string;
	text?: string;
}

export interface ContentBlockToolCall {
	type: "toolCall";
	id?: string;
	name: string;
	arguments?: Record<string, unknown> | string;
}

export interface ContentBlockImage {
	type: "image";
	mimeType?: string;
	data?: string;
}

export interface ContentBlockGeneric {
	type: string;
	[key: string]: unknown;
}

export type ContentBlock =
	| ContentBlockText
	| ContentBlockThinking
	| ContentBlockToolCall
	| ContentBlockImage
	| ContentBlockGeneric;

export interface MessageUsage {
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
	cacheCreationInputTokens?: number;
	cacheReadInputTokens?: number;
	cost?: number;
}

export interface UserMessage {
	role: "user";
	content: string | ContentBlock[];
	timestamp?: string;
}

export interface AssistantMessage {
	role: "assistant";
	content: string | ContentBlock[];
	provider?: string;
	model?: string;
	api?: string;
	stopReason?: string;
	usage?: MessageUsage;
	errorMessage?: string;
}

export interface ToolResultMessage {
	role: "toolResult";
	toolCallId?: string;
	toolName: string;
	content: string | ContentBlock[];
	isError?: boolean;
	details?: unknown;
}

export interface BashExecutionMessage {
	role: "bashExecution";
	command?: string;
	output?: string;
	exitCode?: number;
	cancelled?: boolean;
}

export interface CustomMessage {
	role: "custom";
	customType: string;
	content?: string | ContentBlock[];
	[key: string]: unknown;
}

export interface GenericMessage {
	role: string;
	content?: string | ContentBlock[];
	[key: string]: unknown;
}

export type AgentMessage =
	| UserMessage
	| AssistantMessage
	| ToolResultMessage
	| BashExecutionMessage
	| CustomMessage
	| GenericMessage;

export interface BaseSessionEntry {
	id: string;
	parentId: string | null;
	timestamp: string;
}

export interface SessionMessageEntry extends BaseSessionEntry {
	type: "message";
	message: AgentMessage;
}

export interface CompactionEntry extends BaseSessionEntry {
	type: "compaction";
	summary?: string;
	tokensBefore?: number;
	firstKeptEntryId?: string;
	usage?: MessageUsage;
	details?: unknown;
}

export interface BranchSummaryEntry extends BaseSessionEntry {
	type: "branch_summary";
	summary?: string;
	fromId?: string;
	fromParentId?: string;
}

export interface ModelChangeEntry extends BaseSessionEntry {
	type: "model_change";
	provider: string;
	modelId: string;
}

export interface ThinkingLevelChangeEntry extends BaseSessionEntry {
	type: "thinking_level_change";
	thinkingLevel: string;
}

export interface CustomEntry extends BaseSessionEntry {
	type: "custom" | "custom_message";
	customType?: string;
	content?: string | ContentBlock[];
	[key: string]: unknown;
}

export interface LabelEntry extends BaseSessionEntry {
	type: "label";
	label?: string;
	targetId?: string;
}

export interface SessionInfoEntry extends BaseSessionEntry {
	type: "session_info";
	name?: string;
}

export interface GenericSessionEntry extends BaseSessionEntry {
	type: string;
	[key: string]: unknown;
}

export type SessionEntry =
	| SessionMessageEntry
	| CompactionEntry
	| BranchSummaryEntry
	| ModelChangeEntry
	| ThinkingLevelChangeEntry
	| CustomEntry
	| LabelEntry
	| SessionInfoEntry
	| GenericSessionEntry;

export interface TreeNodeData {
	entry: SessionEntry;
	children?: TreeNodeData[];
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
	tree?: TreeNodeData[];
	branch?: string[];
	leafId?: string;
	commands?: unknown[];
	tools?: ToolInfo[];
	activeTools?: string[];
	capturedAt: number;
}

export type NormalizedRole = "user" | "assistant" | "tool" | "other";

export interface FlatTreeNode {
	node: TreeNodeData;
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
}
