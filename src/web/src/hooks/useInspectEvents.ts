import { useEffect, useState, useCallback } from "react";
import type { SessionSnapshot } from "../types.ts";

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useInspectEvents() {
	const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
	const [status, setStatus] = useState<ConnectionStatus>("connecting");
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	const fetchSnapshot = useCallback(async () => {
		try {
			const res = await fetch("/snapshot");
			if (res.ok) {
				const data = (await res.json()) as SessionSnapshot;
				if (data && Object.keys(data).length > 0) {
					setSnapshot(data);
					setLastUpdated(new Date(data.capturedAt || Date.now()));
				}
			}
		} catch {
			// Best effort fetch
		}
	}, []);

	useEffect(() => {
		let isMounted = true;
		setStatus("connecting");

		// Initial pull
		fetchSnapshot();

		const es = new EventSource("/events");

		const handleOpen = () => {
			if (!isMounted) return;
			setStatus("connected");
		};

		const handleError = () => {
			if (!isMounted) return;
			setStatus("disconnected");
		};

		const handleMessage = (ev: MessageEvent) => {
			if (!isMounted) return;
			try {
				const data = JSON.parse(ev.data) as SessionSnapshot;
				setStatus("connected");
				setSnapshot(data);
				setLastUpdated(new Date(data.capturedAt || Date.now()));
			} catch {
				// Ignore malformed snapshot chunk
			}
		};

		es.addEventListener("open", handleOpen);
		es.addEventListener("error", handleError);
		es.addEventListener("message", handleMessage);

		return () => {
			isMounted = false;
			es.removeEventListener("open", handleOpen);
			es.removeEventListener("error", handleError);
			es.removeEventListener("message", handleMessage);
			es.close();
		};
	}, [fetchSnapshot]);

	return {
		snapshot,
		status,
		lastUpdated,
		refresh: fetchSnapshot,
	};
}
