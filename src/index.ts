import { spawn } from "node:child_process";
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { createInspectServer, type InspectServer } from "./server.ts";

const REFRESH_EVENTS = [
	"session_start",
	"session_info_changed",
	"session_tree",
	"session_compact",
	"session_compact_failed",
	"message_start",
	"message_end",
	"turn_start",
	"turn_end",
	"tool_execution_start",
	"tool_execution_end",
	"agent_start",
	"agent_end",
	"agent_settled",
	"model_select",
	"thinking_level_select",
] as const;

let server: InspectServer | undefined;
let lastSystemPrompt: string | undefined;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pendingBuilder: (() => unknown) | undefined;

function buildSnapshot(ctx: ExtensionContext, pi: ExtensionAPI): unknown {
	const sm = ctx.sessionManager;
	return {
		sessionId: sm.getSessionId(),
		sessionName: sm.getSessionName(),
		cwd: sm.getCwd(),
		sessionFile: sm.getSessionFile(),
		header: sm.getHeader(),
		model: ctx.model
			? { provider: ctx.model.provider, id: ctx.model.id, name: ctx.model.name }
			: undefined,
		thinkingLevel: ctx.thinkingLevel,
		idle: ctx.isIdle(),
		systemPrompt: lastSystemPrompt ?? ctx.getSystemPrompt(),
		entries: sm.getEntries(),
		tree: sm.getTree(),
		branch: sm.getBranch(),
		leafId: sm.getLeafId(),
		commands: pi.getCommands(),
		tools: pi.getAllTools(),
		activeTools: pi.getActiveTools(),
		capturedAt: Date.now(),
	};
}

/** Throttled push: coalesce bursts (e.g. streaming deltas) into one broadcast. */
function schedulePush(builder: () => unknown): void {
	if (!server?.isRunning()) return;
	pendingBuilder = builder;
	if (pushTimer) return;
	pushTimer = setTimeout(() => {
		pushTimer = undefined;
		const builder = pendingBuilder;
		pendingBuilder = undefined;
		if (server?.isRunning() && builder) server.push(builder());
	}, 100);
}

function openBrowser(url: string): void {
	const platform = process.platform;
	const cmd =
		platform === "darwin"
			? ["open", url]
			: platform === "win32"
				? ["cmd", "/c", "start", "", url]
				: ["xdg-open", url];
	try {
		spawn(cmd[0]!, cmd.slice(1), { stdio: "ignore", detached: true }).unref();
	} catch {
		// Best effort; the URL is still shown in the footer.
	}
}

function stopServer(ctx: ExtensionContext): void {
	server?.stop().catch(() => undefined);
	server = undefined;
	lastSystemPrompt = undefined;
	ctx.ui.setStatus("inspect", undefined);
	ctx.ui.notify("pi-inspector stopped", "info");
}

export default function inspectExtension(pi: ExtensionAPI): void {
	// Register listeners for every event that can change the visible session state.
	for (const event of REFRESH_EVENTS) {
		(pi.on as (event: string, handler: (event: unknown, ctx: ExtensionContext) => void) => void)(
			event,
			(_event, ctx) => schedulePush(() => buildSnapshot(ctx, pi)),
		);
	}
	pi.on("message_update", (_event, ctx) => schedulePush(() => buildSnapshot(ctx, pi)));

	// Capture the fully-assembled system prompt each turn.
	pi.on("before_agent_start", (event, ctx) => {
		lastSystemPrompt = event.systemPrompt;
		schedulePush(() => buildSnapshot(ctx, pi));
	});
	pi.on("session_start", (_event, ctx) => {
		lastSystemPrompt = ctx.getSystemPrompt();
	});

	// Lifecycle: stop the local server when the session runtime is torn down.
	pi.on("session_shutdown", (_event, ctx) => {
		server?.stop().catch(() => undefined);
		server = undefined;
		lastSystemPrompt = undefined;
		ctx.ui.setStatus("inspect", undefined);
	});

	pi.registerCommand("inspect", {
		description:
			"Inspect current session: start local dashboard and open browser (subcommands: stop | status | open)",
		handler: async (args, ctx) => {
			const sub = args.trim().toLowerCase();

			if (sub === "stop") {
				stopServer(ctx);
				return;
			}

			if (sub === "status") {
				if (server?.isRunning()) {
					ctx.ui.notify(`pi-inspector running: ${server.getUrl()}`, "info");
				} else {
					ctx.ui.notify("pi-inspector not running. Use /inspect to start.", "info");
				}
				return;
			}

			if (!server?.isRunning()) {
				server = createInspectServer();
				const url = await server.start();
				server.push(buildSnapshot(ctx, pi));
				ctx.ui.setStatus("inspect", url);
				ctx.ui.notify(`pi-inspector: ${url}`, "info");
			} else if (sub === "open") {
				openBrowser(server.getUrl()!);
				ctx.ui.notify(`pi-inspector: ${server.getUrl()}`, "info");
				return;
			}

			// Bare `/inspect` starts (or restarts the view) and opens the browser.
			if (server.isRunning()) {
				server.push(buildSnapshot(ctx, pi));
				openBrowser(server.getUrl()!);
			}
		},
	});
}
