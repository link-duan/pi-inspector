import React from "react";

interface ResizerProps {
	direction: "col" | "row";
	onMouseDown: (e: React.MouseEvent) => void;
	className?: string;
}

export const Resizer: React.FC<ResizerProps> = ({ direction, onMouseDown, className = "" }) => {
	const isCol = direction === "col";
	return (
		<div
			className={`${isCol ? "vresizer" : "hresizer"} ${className}`}
			onMouseDown={onMouseDown}
			title={isCol ? "Drag to resize sidebar width" : "Drag to resize detail height"}
		/>
	);
};
