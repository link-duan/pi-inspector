import { Cpu, Terminal, Clock, RefreshCw, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import type { SessionSnapshot } from "../../types.ts";
import type { ConnectionStatus } from "../../hooks/useInspectEvents.ts";

interface HeaderProps {
	snapshot: SessionSnapshot | null;
	status: ConnectionStatus;
	lastUpdated: Date | null;
	onRefresh?: () => void;
	sidebarCollapsed?: boolean;
	onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
	snapshot,
	status,
	lastUpdated,
	onRefresh,
	sidebarCollapsed,
	onToggleSidebar,
}) => {
	const isIdle = snapshot?.idle ?? true;

	const dotClass = (() => {
		if (status === "disconnected") return "dot dot-off";
		if (status === "connecting") return "dot dot-connecting";
		return isIdle ? "dot dot-live" : "dot dot-streaming";
	})();

	const statusLabel = (() => {
		if (status === "disconnected") return "Offline";
		if (status === "connecting") return "Connecting…";
		return isIdle ? "Idle" : "Running";
	})();

	const modelLabel = snapshot?.model
		? `${snapshot.model.provider}/${snapshot.model.name || snapshot.model.id}`
		: null;

	return (
		<header className="app-header">
			<div className="header-left">
				{onToggleSidebar && (
					<button
						type="button"
						onClick={onToggleSidebar}
						className={`header-icon-btn sidebar-toggle-btn ${sidebarCollapsed ? "is-collapsed" : ""}`}
						title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
					>
						{sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
					</button>
				)}

				<div className="brand">
					<span className={dotClass} title={`Connection: ${statusLabel}`} />
					<span className="brand-title">pi-inspector</span>
					<span className="brand-status-chip" data-status={statusLabel.toLowerCase()}>
						{statusLabel}
					</span>
				</div>

				{snapshot?.sessionId && (
					<div
						className="header-pill header-session mono"
						title={`Session ID: ${snapshot.sessionId}`}
					>
						<Terminal size={12} className="pill-icon" />
						<span>{snapshot.sessionId.slice(0, 8)}</span>
						{snapshot.sessionName && <span className="session-name">({snapshot.sessionName})</span>}
					</div>
				)}

				{modelLabel && (
					<div className="header-pill header-model" title={`Active Model: ${modelLabel}`}>
						<Cpu size={12} className="pill-icon" />
						<span>{modelLabel}</span>
						{snapshot?.thinkingLevel && (
							<span className="thinking-pill">{snapshot.thinkingLevel}</span>
						)}
					</div>
				)}
			</div>

			<div className="header-right">
				{lastUpdated && (
					<div className="header-time" title={lastUpdated.toISOString()}>
						<Clock size={11} className="pill-icon" />
						<span>{lastUpdated.toLocaleTimeString()}</span>
					</div>
				)}

				{onRefresh && (
					<button
						type="button"
						onClick={onRefresh}
						className="header-icon-btn"
						title="Refresh snapshot"
					>
						<RefreshCw size={13} className={status === "connecting" ? "spin" : ""} />
					</button>
				)}
			</div>
		</header>
	);
};
