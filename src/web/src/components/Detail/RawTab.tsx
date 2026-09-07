import React, { useMemo } from "react";
import type { SessionEntry } from "../../types.ts";
import { highlightJson } from "../../utils/highlighter.ts";

interface RawTabProps {
	entry: SessionEntry | null;
}

export const RawTab: React.FC<RawTabProps> = ({ entry }) => {
	const highlighted = useMemo(() => {
		if (!entry) return "";
		try {
			const jsonStr = JSON.stringify(entry, null, 2);
			return highlightJson(jsonStr);
		} catch {
			return String(entry);
		}
	}, [entry]);

	if (!entry) {
		return (
			<div className="overview-empty">
				<span>Select an entry to view raw JSON</span>
			</div>
		);
	}

	return (
		<div className="raw-tab-container">
			<pre className="hljs raw-pre mono" dangerouslySetInnerHTML={{ __html: highlighted }} />
		</div>
	);
};
