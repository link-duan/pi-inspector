import { useState, useEffect, useCallback, useRef } from "react";

export function useResizable() {
	const [leftW, setLeftW] = useState<number>(() => {
		const saved = localStorage.getItem("inspect.leftW");
		return saved ? Math.min(60, Math.max(15, parseFloat(saved))) : 34;
	});

	const [detailH, setDetailH] = useState<number>(() => {
		const saved = localStorage.getItem("inspect.detailH");
		return saved ? Math.max(120, parseFloat(saved)) : 280;
	});

	const [isResizingCol, setIsResizingCol] = useState(false);
	const [isResizingRow, setIsResizingRow] = useState(false);

	const containerRef = useRef<HTMLElement | null>(null);
	const rightPaneRef = useRef<HTMLElement | null>(null);

	const startColResize = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizingCol(true);

		const onMouseMove = (moveEvent: MouseEvent) => {
			if (!containerRef.current) return;
			const rect = containerRef.current.getBoundingClientRect();
			const pct = ((moveEvent.clientX - rect.left) / rect.width) * 100;
			const clamped = Math.min(65, Math.max(18, pct));
			setLeftW(clamped);
			localStorage.setItem("inspect.leftW", String(clamped));
		};

		const onMouseUp = () => {
			setIsResizingCol(false);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}, []);

	const startRowResize = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizingRow(true);

		const onMouseMove = (moveEvent: MouseEvent) => {
			if (!rightPaneRef.current) return;
			const rect = rightPaneRef.current.getBoundingClientRect();
			const newH = rect.bottom - moveEvent.clientY;
			const clamped = Math.min(rect.height * 0.85, Math.max(120, newH));
			setDetailH(clamped);
			localStorage.setItem("inspect.detailH", String(clamped));
		};

		const onMouseUp = () => {
			setIsResizingRow(false);
			window.removeEventListener("mousemove", onMouseMove);
			window.removeEventListener("mouseup", onMouseUp);
		};

		window.addEventListener("mousemove", onMouseMove);
		window.addEventListener("mouseup", onMouseUp);
	}, []);

	useEffect(() => {
		if (isResizingCol) {
			document.body.classList.add("resizing-col");
		} else {
			document.body.classList.remove("resizing-col");
		}
	}, [isResizingCol]);

	useEffect(() => {
		if (isResizingRow) {
			document.body.classList.add("resizing-row");
		} else {
			document.body.classList.remove("resizing-row");
		}
	}, [isResizingRow]);

	const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
		return localStorage.getItem("inspect.sidebarCollapsed") === "true";
	});

	const toggleSidebarCollapse = useCallback(() => {
		setSidebarCollapsed((prev) => {
			const next = !prev;
			localStorage.setItem("inspect.sidebarCollapsed", String(next));
			return next;
		});
	}, []);

	return {
		leftW,
		detailH,
		containerRef,
		rightPaneRef,
		startColResize,
		startRowResize,
		isResizingCol,
		isResizingRow,
		sidebarCollapsed,
		setSidebarCollapsed,
		toggleSidebarCollapse,
	};
}
