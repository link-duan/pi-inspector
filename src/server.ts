import {
	createServer,
	type Server as HttpServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);

/** Resolve files inside the highlight.js package (exports map only allows lib/*, styles/*, package.json). */
const hljsRoot = dirname(require.resolve("highlight.js/package.json"));
const hljsFile = (rel: string): string => readFileSync(join(hljsRoot, rel), "utf8");

const HTML = readFileSync(
	join(dirname(fileURLToPath(import.meta.url)), "web", "index.html"),
	"utf8",
);

/** Vendor assets served to the browser (from node_modules, no build step).
 *  lib/core.js is CJS; wrap it in a shim so the browser ESM loader gets a default export. */
const VENDOR: Record<string, { type: string; body: string }> = {
	"/vendor/core.js": {
		type: "text/javascript",
		body:
			"var module = { exports: {} };\nvar exports = module.exports;\n" +
			hljsFile("lib/core.js") +
			"\nexport default module.exports;",
	},
	"/vendor/json.js": { type: "text/javascript", body: hljsFile("es/languages/json.js") },
	"/vendor/github-dark.css": { type: "text/css", body: hljsFile("styles/github-dark.css") },
};

export interface InspectServer {
	/** Start listening on 127.0.0.1 with an ephemeral port. Resolves to the base URL. */
	start(): Promise<string>;
	/** Stop the server and disconnect all SSE clients. */
	stop(): Promise<void>;
	/** Broadcast a snapshot to all connected clients and cache it for future connections. */
	push(snapshot: unknown): void;
	/** Whether the server is currently listening. */
	isRunning(): boolean;
	/** The base URL, if started. */
	getUrl(): string | undefined;
}

export function createInspectServer(): InspectServer {
	let httpServer: HttpServer | undefined;
	let url: string | undefined;
	let lastSnapshot: unknown;
	const clients = new Set<ServerResponse>();

	function broadcast(data: unknown): void {
		const body = `data: ${JSON.stringify(data)}\n\n`;
		for (const res of clients) {
			try {
				res.write(body);
			} catch {
				clients.delete(res);
			}
		}
	}

	const server: HttpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
		const path = (req.url ?? "/").split("?")[0] ?? "/";

		if (path === "/events") {
			res.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				Connection: "keep-alive",
			});
			if (lastSnapshot !== undefined) {
				res.write(`data: ${JSON.stringify(lastSnapshot)}\n\n`);
			}
			clients.add(res);
			req.on("close", () => clients.delete(res));
			return;
		}

		if (path === "/snapshot") {
			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(lastSnapshot === undefined ? "{}" : JSON.stringify(lastSnapshot));
			return;
		}

		const vendor = VENDOR[path];
		if (vendor) {
			res.writeHead(200, { "Content-Type": vendor.type });
			res.end(vendor.body);
			return;
		}

		res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
		res.end(HTML);
	});

	return {
		async start(): Promise<string> {
			if (httpServer) return url!;
			await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
			const addr = server.address();
			url = `http://127.0.0.1:${typeof addr === "object" && addr ? addr.port : 0}`;
			httpServer = server;
			return url;
		},
		async stop(): Promise<void> {
			if (!httpServer) return;
			for (const res of clients) res.end();
			clients.clear();
			await new Promise<void>((resolve) => server.close(() => resolve()));
			httpServer = undefined;
			url = undefined;
			lastSnapshot = undefined;
		},
		push(snapshot: unknown): void {
			lastSnapshot = snapshot;
			if (clients.size > 0) broadcast(snapshot);
		},
		isRunning(): boolean {
			return httpServer !== undefined;
		},
		getUrl(): string | undefined {
			return url;
		},
	};
}
