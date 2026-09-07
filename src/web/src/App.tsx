import React, { useState, useEffect, useMemo } from "react";
import type { NormalizedRole } from "./types.ts";
import { useInspectEvents } from "./hooks/useInspectEvents.ts";
import { useResizable } from "./hooks/useResizable.ts";
import { useTreeLayout } from "./hooks/useTreeLayout.ts";
import { Header } from "./components/Header/Header.tsx";
import { Sidebar } from "./components/Sidebar/Sidebar.tsx";
import { TreeToolbar } from "./components/Tree/TreeToolbar.tsx";
import { TreeView } from "./components/Tree/TreeView.tsx";
import { DetailPanel } from "./components/Detail/DetailPanel.tsx";
import { Resizer } from "./components/common/Resizer.tsx";

export const App: React.FC = () => {
	const { snapshot, status, lastUpdated, refresh } = useInspectEvents();
	const { leftW, detailH, containerRef, rightPaneRef, startColResize, startRowResize } =
		useResizable();

	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [filterRole, setFilterRole] = useState<"all" | NormalizedRole | "error">("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [follow, setFollow] = useState(true);

	// When new snapshot comes in, auto-select leaf if nothing selected
	useEffect(() => {
		if (!snapshot) return;
		setSelectedId((prev) => {
			if (!prev) return snapshot.leafId ?? null;
			// Verify previous selection still exists
			const exists = (snapshot.entries || []).some((e) => e.id === prev);
			return exists ? prev : (snapshot.leafId ?? null);
		});
	}, [snapshot]);

	const { flatNodes, totalCount, matchCount } = useTreeLayout(snapshot, filterRole, searchQuery);

	const selectedEntry = useMemo(() => {
		if (!snapshot || !selectedId) return null;
		return (snapshot.entries || []).find((e) => e.id === selectedId) ?? null;
	}, [snapshot, selectedId]);

	return (
		<div className="app-layout">
			<Header snapshot={snapshot} status={status} lastUpdated={lastUpdated} onRefresh={refresh} />

			<main className="app-main" ref={containerRef}>
				<Sidebar snapshot={snapshot} widthPercent={leftW} />

				<Resizer direction="col" onMouseDown={startColResize} />

				<section className="app-right-pane" ref={rightPaneRef}>
					<TreeToolbar
						filterRole={filterRole}
						onSelectFilterRole={setFilterRole}
						searchQuery={searchQuery}
						onSearchQueryChange={setSearchQuery}
						follow={follow}
						onFollowChange={setFollow}
						matchCount={matchCount}
						totalCount={totalCount}
					/>

					<TreeView
						flatNodes={flatNodes}
						selectedId={selectedId}
						onSelectId={setSelectedId}
						follow={follow}
						totalCount={totalCount}
					/>

					<Resizer direction="row" onMouseDown={startRowResize} />

					<DetailPanel entry={selectedEntry} heightPx={detailH} />
				</section>
			</main>
		</div>
	);
};
