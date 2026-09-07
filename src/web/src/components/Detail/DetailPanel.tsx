import React, { useState, useMemo } from "react";
import type { SessionEntry } from "../../types.ts";
import { OverviewTab } from "./OverviewTab.tsx";
import { RawTab } from "./RawTab.tsx";
import { CopyButton } from "../common/CopyButton.tsx";
import { buildToolPairIndex } from "../../utils/toolPairing.ts";

interface DetailPanelProps {
	entry: SessionEntry | null;
	heightPx: number;
	entries?: SessionEntry[];
	onNavigateToEntry?: (id: string) => void;
	searchQuery?: string;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
	entry,
	heightPx,
	entries,
	onNavigateToEntry,
	searchQuery = "",
}) => {
	const [activeTab, setActiveTab] = useState<"overview" | "raw">("overview");

	const toolPairIndex = useMemo(() => buildToolPairIndex(entries ?? []), [entries]);

	const entryJson = entry ? JSON.stringify(entry, null, 2) : "";

	return (
		<section className="app-detail-panel" style={{ height: `${heightPx}px` }}>
			<div className="detail-header-bar">
				<div className="detail-title-group">
					<span className="detail-panel-title">Entry Detail</span>
					{entry && (
						<span className="detail-selected-id mono" title={entry.id}>
							{entry.id.slice(0, 12)}
						</span>
					)}
				</div>

				<div className="detail-tabs-group" role="tablist">
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "overview"}
						className={`detail-tab-btn ${activeTab === "overview" ? "active" : ""}`}
						onClick={() => setActiveTab("overview")}
					>
						Overview
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={activeTab === "raw"}
						className={`detail-tab-btn ${activeTab === "raw" ? "active" : ""}`}
						onClick={() => setActiveTab("raw")}
					>
						Raw JSON
					</button>
				</div>

				<div className="detail-header-actions">
					<CopyButton text={entryJson} label="Copy JSON" />
				</div>
			</div>
			<div className="detail-content-area">
				{activeTab === "overview" ? (
					<OverviewTab
						entry={entry}
						toolPairIndex={toolPairIndex}
						onNavigateToEntry={onNavigateToEntry}
						searchQuery={searchQuery}
					/>
				) : (
					<RawTab entry={entry} />
				)}
			</div>
		</section>
	);
};
