import {
	createServer,
	type Server as HttpServer,
	type IncomingMessage,
	type ServerResponse,
} from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const webDir = join(dirname(fileURLToPath(import.meta.url)), "web");
const distDir = join(webDir, "dist");
const htmlPath = join(webDir, "index.html");

const MIME_TYPES: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".mjs": "application/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
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

		if (path.startsWith("/dist/")) {
			const rel = path.slice(6);
			const filePath = join(distDir, rel);
			if (existsSync(filePath)) {
				const ext = extname(filePath).toLowerCase();
				res.writeHead(200, {
					"Content-Type": MIME_TYPES[ext] ?? "application/octet-stream",
					"Cache-Control": "public, max-age=31536000, immutable",
				});
				res.end(readFileSync(filePath));
				return;
			}
		}

		if (existsSync(htmlPath)) {
			res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
			res.end(readFileSync(htmlPath, "utf8"));
			return;
		}

		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not Found");
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
