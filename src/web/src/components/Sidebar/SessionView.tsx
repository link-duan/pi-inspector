import React from "react";
import { Terminal, Folder, Cpu, Layers } from "lucide-react";
import type { SessionSnapshot } from "../../types.ts";
import { CopyButton } from "../common/CopyButton.tsx";

interface SessionViewProps {
	snapshot: SessionSnapshot | null;
}

export const SessionView: React.FC<SessionViewProps> = ({ snapshot }) => {
	if (!snapshot) {
		return (
			<div className="empty-state-view">
				<span>No active session data</span>
			</div>
		);
	}

	const modelStr = snapshot.model
		? `${snapshot.model.provider}/${snapshot.model.name || snapshot.model.id}`
		: null;

	const commandsList = Array.isArray(snapshot.commands)
		? (snapshot.commands as { name?: string; description?: string }[])
		: [];

	return (
		<div className="session-view">
			<div className="session-content-scroller">
				{/* Section 1: Session Identity */}
				<div className="session-section">
					<div className="session-section-title">
						<Terminal size={13} className="section-icon" />
						<span>Session Identity</span>
					</div>
					<div className="session-grid">
						<div className="session-tile">
							<span className="session-tile-label">Session ID</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono" title={snapshot.sessionId}>
									{snapshot.sessionId || "–"}
								</span>
								{snapshot.sessionId && <CopyButton text={snapshot.sessionId} label="Copy ID" />}
							</div>
						</div>

						<div className="session-tile">
							<span className="session-tile-label">Session Name</span>
							<div className="session-tile-row">
								<span className="session-tile-val" title={snapshot.sessionName || ""}>
									{snapshot.sessionName || "–"}
								</span>
							</div>
						</div>

						<div className="session-tile">
							<span className="session-tile-label">Current Leaf Entry</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono" title={snapshot.leafId}>
									{snapshot.leafId || "–"}
								</span>
								{snapshot.leafId && <CopyButton text={snapshot.leafId} label="Copy Leaf" />}
							</div>
						</div>

						<div className="session-tile">
							<span className="session-tile-label">Total Entries</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono highlight-val">
									{snapshot.entries ? snapshot.entries.length : 0}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Section 2: Environment & Workspace */}
				<div className="session-section">
					<div className="session-section-title">
						<Folder size={13} className="section-icon" />
						<span>Environment & Workspace</span>
					</div>
					<div className="session-grid">
						<div className="session-tile session-tile-full">
							<span className="session-tile-label">Working Directory (CWD)</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono" title={snapshot.cwd}>
									{snapshot.cwd || "–"}
								</span>
								{snapshot.cwd && <CopyButton text={snapshot.cwd} label="Copy CWD" />}
							</div>
						</div>

						<div className="session-tile session-tile-full">
							<span className="session-tile-label">Session Storage File</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono" title={snapshot.sessionFile}>
									{snapshot.sessionFile || "(in-memory ephemeral)"}
								</span>
								{snapshot.sessionFile && (
									<CopyButton text={snapshot.sessionFile} label="Copy path" />
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Section 3: Model & Runtime */}
				<div className="session-section">
					<div className="session-section-title">
						<Cpu size={13} className="section-icon" />
						<span>Model & Runtime</span>
					</div>
					<div className="session-grid">
						<div className="session-tile">
							<span className="session-tile-label">Active Model</span>
							<div className="session-tile-row">
								<span className="session-tile-val" title={modelStr || ""}>
									{modelStr || "–"}
								</span>
							</div>
						</div>

						<div className="session-tile">
							<span className="session-tile-label">Thinking Level</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono">
									{snapshot.thinkingLevel ? (
										<span className="session-badge-accent">{snapshot.thinkingLevel}</span>
									) : (
										"–"
									)}
								</span>
							</div>
						</div>

						<div className="session-tile">
							<span className="session-tile-label">Agent State</span>
							<div className="session-tile-row">
								<span className="session-tile-val">
									<span
										className={`session-status-tag ${snapshot.idle ? "status-idle" : "status-running"}`}
									>
										{snapshot.idle ? "Idle" : "Running"}
									</span>
								</span>
							</div>
						</div>

						<div className="session-tile">
							<span className="session-tile-label">Tools Registered</span>
							<div className="session-tile-row">
								<span className="session-tile-val mono">
									{snapshot.tools ? snapshot.tools.length : 0} tools
									{snapshot.activeTools && ` (${snapshot.activeTools.length} active)`}
								</span>
							</div>
						</div>
					</div>
				</div>

				{/* Section 4: Slash Commands (if available) */}
				{commandsList.length > 0 && (
					<div className="session-section">
						<div className="session-section-title">
							<Layers size={13} className="section-icon" />
							<span>Registered Commands ({commandsList.length})</span>
						</div>
						<div className="commands-list">
							{commandsList.map((cmd, idx) => (
								<div key={cmd.name || idx} className="command-item">
									<span className="command-name mono">{cmd.name}</span>
									{cmd.description && <span className="command-desc">{cmd.description}</span>}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
