import React, { useMemo } from "react";
import hljs from "highlight.js/lib/core";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import type { SessionEntry } from "../../types.ts";

hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);

interface RawTabProps {
	entry: SessionEntry | null;
}

export const RawTab: React.FC<RawTabProps> = ({ entry }) => {
	const highlighted = useMemo(() => {
		if (!entry) return "";
		try {
			const jsonStr = JSON.stringify(entry, null, 2);
			return hljs.highlight(jsonStr, { language: "json" }).value;
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
