import React from "react";
import type { NormalizedRole } from "../../types.ts";

interface RoleBadgeProps {
	role: NormalizedRole | string;
	size?: "sm" | "md";
	className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = "sm", className = "" }) => {
	const normalizedRole = (() => {
		switch (role) {
			case "user":
				return "user";
			case "assistant":
				return "assistant";
			case "tool":
			case "toolResult":
			case "bashExecution":
				return "tool";
			default:
				return "other";
		}
	})();

	return (
		<span className={`role-badge role-${normalizedRole} role-size-${size} ${className}`}>
			{role}
		</span>
	);
};
