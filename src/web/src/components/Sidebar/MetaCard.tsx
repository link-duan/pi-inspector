import React from "react";
import { Info } from "lucide-react";
import type { SessionSnapshot } from "../../types.ts";

interface MetaCardProps {
	snapshot: SessionSnapshot | null;
}

export const MetaCard: React.FC<MetaCardProps> = ({ snapshot }) => {
	if (!snapshot) return null;

	const metaItems: { label: string; value: string; isMono?: boolean }[] = [
		{ label: "session", value: snapshot.sessionId || "–", isMono: true },
		{ label: "name", value: snapshot.sessionName || "–" },
		{ label: "cwd", value: snapshot.cwd || "–", isMono: true },
		{ label: "file", value: snapshot.sessionFile || "(ephemeral)", isMono: true },
		{
			label: "model",
			value: snapshot.model ? `${snapshot.model.provider}/${snapshot.model.id}` : "–",
		},
		{ label: "thinking", value: snapshot.thinkingLevel || "–" },
		{ label: "leaf", value: snapshot.leafId ? snapshot.leafId.slice(0, 10) : "–", isMono: true },
		{ label: "entries", value: String(snapshot.entries ? snapshot.entries.length : 0) },
	];

	return (
		<div className="panel-card meta-card">
			<div className="card-header-bar">
				<div className="card-title">
					<Info size={13} className="title-icon" />
					<span>Session Info</span>
				</div>
			</div>
			<div className="meta-grid">
				{metaItems.map((item) => (
					<div key={item.label} className="meta-row">
						<span className="meta-key">{item.label}</span>
						<span className={`meta-val ${item.isMono ? "mono" : ""}`} title={item.value}>
							{item.value}
						</span>
					</div>
				))}
			</div>
		</div>
	);
};
