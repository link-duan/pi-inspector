import React from "react";

interface MiddleEllipsisProps {
	text?: string | null;
	endChars?: number;
	className?: string;
	title?: string;
	fallback?: string;
}

export const MiddleEllipsis: React.FC<MiddleEllipsisProps> = ({
	text,
	endChars = 12,
	className = "",
	title,
	fallback = "–",
}) => {
	const val = text || fallback;
	const tooltip = title ?? (text || undefined);

	// If text is short or fallback, render normally
	if (val.length <= 16) {
		return (
			<span className={`session-tile-val ${className}`} title={tooltip}>
				{val}
			</span>
		);
	}

	const tailLen = Math.min(endChars, Math.floor(val.length / 2));
	const startPart = val.slice(0, val.length - tailLen);
	const endPart = val.slice(val.length - tailLen);

	return (
		<span className={`middle-ellipsis-container ${className}`} title={tooltip}>
			<span className="middle-ellipsis-start">{startPart}</span>
			<span className="middle-ellipsis-end">{endPart}</span>
		</span>
	);
};
