import React, { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
	text: string;
	label?: string;
	className?: string;
	title?: string;
	iconOnly?: boolean;
}

export const CopyButton: React.FC<CopyButtonProps> = ({
	text,
	label = "Copy",
	className = "",
	title = "Copy to clipboard",
	iconOnly = false,
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!text) return;
			navigator.clipboard
				.writeText(text)
				.then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1800);
				})
				.catch(() => {
					// Fallback
					try {
						const textarea = document.createElement("textarea");
						textarea.value = text;
						document.body.appendChild(textarea);
						textarea.select();
						document.execCommand("copy");
						document.body.removeChild(textarea);
						setCopied(true);
						setTimeout(() => setCopied(false), 1800);
					} catch {
						// best effort
					}
				});
		},
		[text],
	);

	return (
		<button
			type="button"
			onClick={handleCopy}
			className={`action-btn ${iconOnly ? "action-btn-icon-only" : ""} ${copied ? "action-btn-success" : ""} ${className}`}
			title={copied ? "Copied!" : title}
		>
			{copied ? <Check size={12} className="btn-icon" /> : <Copy size={12} className="btn-icon" />}
			{!iconOnly && <span>{copied ? "Copied" : label}</span>}
		</button>
	);
};
