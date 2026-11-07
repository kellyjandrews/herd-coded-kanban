"use client";

import { type DragEvent, type FormEvent, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "herd-kanban-issues";
const STATUSES = ["backlog", "in-progress", "done"] as const;

type Status = (typeof STATUSES)[number];
type Priority = "High" | "Medium" | "Low";

type Issue = {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
};

const columns: { id: Status; title: string; subtitle: string; accent: string }[] = [
  { id: "backlog", title: "Backlog", subtitle: "Ready to be picked up", accent: "blue" },
  { id: "in-progress", title: "In progress", subtitle: "Work in motion", accent: "violet" },
  { id: "done", title: "Done", subtitle: "Across the finish line", accent: "green" },
];

const initialIssues: Issue[] = [
  {
    id: "HC-104",
    title: "Set up the project workspace",
    description: "Create a welcoming home for the team to plan and track their work.",
    status: "backlog",
    priority: "High",
  },
  {
    id: "HC-105",
    title: "Polish the navigation",
    description: "Make it easy to find the board and get back to the work at hand.",
    status: "backlog",
    priority: "Medium",
  },
  {
    id: "HC-106",
    title: "Build the issue card",
    description: "Show the important details at a glance without crowding the board.",
    status: "in-progress",
    priority: "High",
  },
  {
    id: "HC-107",
    title: "Choose a color palette",
    description: "Give the workspace a calm, clear visual identity.",
    status: "done",
    priority: "Low",
  },
];

function isIssue(value: unknown): value is Issue {
  if (!value || typeof value !== "object") return false;
  const issue = value as Partial<Issue>;

  return (
    typeof issue.id === "string" &&
    typeof issue.title === "string" &&
    typeof issue.description === "string" &&
    STATUSES.includes(issue.status as Status) &&
    ["High", "Medium", "Low"].includes(issue.priority as string)
  );
}

function readIssues(): Issue[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialIssues;

    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) && parsed.every(isIssue) ? parsed : initialIssues;
  } catch {
    return initialIssues;
  }
}

export default function Board() {
  const [issues, setIssues] = useState(initialIssues);
  const [isReady, setIsReady] = useState(false);
  const [newIssueStatus, setNewIssueStatus] = useState<Status | null>(null);
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setIssues(readIssues());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(issues));
    } catch {
      return;
    }
  }, [issues, isReady]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (newIssueStatus && dialog && !dialog.open) dialog.showModal();
    if (!newIssueStatus && dialog?.open) dialog.close();
  }, [newIssueStatus]);

  function moveIssue(issueId: string, status: Status) {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue || issue.status === status) return;

    setIssues((current) =>
      current.map((item) => (item.id === issueId ? { ...item, status } : item)),
    );
    setAnnouncement(
      `${issue.title} moved to ${columns.find((column) => column.id === status)?.title}.`,
    );
  }

  function handleDrop(event: DragEvent<HTMLElement>, status: Status) {
    event.preventDefault();
    const issueId = event.dataTransfer.getData("text/plain") || draggedIssueId;
    if (issueId) moveIssue(issueId, status);
    setDraggedIssueId(null);
  }

  function createIssue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    if (!title) return;

    setIssues((current) => [
      {
        id: `HC-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
        title,
        description,
        status: newIssueStatus ?? "backlog",
        priority: "Medium",
      },
      ...current,
    ]);
    setAnnouncement(
      `${title} added to ${columns.find((column) => column.id === newIssueStatus)?.title}.`,
    );
    setNewIssueStatus(null);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Herd home">
          <span className="brand-mark" aria-hidden="true">
            h
          </span>
          <span>herd</span>
        </a>
        <div className="topbar-divider" />
        <span className="workspace-name">Workspace</span>
        <div className="topbar-spacer" />
        <span className="avatar" aria-hidden="true">
          K
        </span>
      </header>

      <div className="workspace">
        <aside className="sidebar" aria-label="Main navigation">
          <span className="sidebar-label">WORKSPACE</span>
          <a className="nav-item active" href="#board">
            <span className="nav-icon board-icon" aria-hidden="true">
              ▦
            </span>
            Board
          </a>
          <div className="sidebar-footer">
            <span className="team-dot" />
            <div>
              <span className="team-name">Herd workspace</span>
              <span className="team-plan">Saved in this browser</span>
            </div>
            <span className="more-icon" aria-hidden="true">
              ···
            </span>
          </div>
        </aside>

        <section className="board-area" id="board" aria-labelledby="board-title">
          <div className="board-heading">
            <div>
              <div className="breadcrumb">
                <span>Herd workspace</span>
                <span aria-hidden="true">/</span>
                <span>Projects</span>
              </div>
              <div className="title-line">
                <h1 id="board-title">Product board</h1>
                <span className="visibility-pill">
                  <span aria-hidden="true">●</span> Local board
                </span>
              </div>
              <p className="board-description">
                A little progress each day adds up to big results.
              </p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => setNewIssueStatus("backlog")}
            >
              <span aria-hidden="true">＋</span> New issue
            </button>
          </div>

          <div className="board-toolbar">
            <div className="view-tabs">
              <span className="view-tab selected" aria-current="page">
                <span aria-hidden="true">▦</span> Board
              </span>
            </div>
            <div className="toolbar-actions">
              <span className="issue-total">
                <strong>{issues.length}</strong> {issues.length === 1 ? "issue" : "issues"}
              </span>
            </div>
          </div>

          <div className="kanban-board">
            {columns.map((column) => {
              const columnIssues = issues.filter((issue) => issue.status === column.id);
              return (
                <section
                  className={`kanban-column column-${column.accent}`}
                  id={column.id}
                  key={column.id}
                  aria-label={column.title}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event, column.id)}
                >
                  <div className="column-heading">
                    <div className="column-title-wrap">
                      <span className={`status-dot ${column.accent}`} />
                      <h2>{column.title}</h2>
                      <span className="column-count">{columnIssues.length}</span>
                    </div>
                    <div className="column-controls">
                      <button
                        className="column-icon-button"
                        type="button"
                        aria-label={`Add issue to ${column.title}`}
                        onClick={() => setNewIssueStatus(column.id)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="column-subtitle">{column.subtitle}</p>
                  <div className="issue-list">
                    {columnIssues.map((issue) => (
                      <article
                        className={`issue-card${draggedIssueId === issue.id ? " dragging" : ""}`}
                        key={issue.id}
                        aria-label={`Issue: ${issue.title}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("text/plain", issue.id);
                          event.dataTransfer.effectAllowed = "move";
                          setDraggedIssueId(issue.id);
                        }}
                        onDragEnd={() => setDraggedIssueId(null)}
                      >
                        <div className="card-topline">
                          <span className="issue-id">{issue.id}</span>
                          <button
                            className="card-menu"
                            type="button"
                            aria-label={`Delete ${issue.title}`}
                            onClick={() => {
                              setIssues((current) =>
                                current.filter((item) => item.id !== issue.id),
                              );
                              setAnnouncement(`${issue.title} deleted.`);
                            }}
                          >
                            ×
                          </button>
                        </div>
                        <h3>{issue.title}</h3>
                        {issue.description && (
                          <p className="issue-description">{issue.description}</p>
                        )}
                        <div className="card-footer">
                          <span
                            className={`priority-pill priority-${issue.priority.toLowerCase()}`}
                          >
                            <span aria-hidden="true">◆</span> {issue.priority}
                          </span>
                          <div className="card-meta">
                            <label className="sr-only" htmlFor={`status-${issue.id}`}>
                              Move {issue.title}
                            </label>
                            <select
                              className="status-select"
                              id={`status-${issue.id}`}
                              value={issue.status}
                              onChange={(event) =>
                                moveIssue(issue.id, event.target.value as Status)
                              }
                            >
                              {columns.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.title}
                                </option>
                              ))}
                            </select>
                            <span className="assignee-avatar" aria-hidden="true">
                              K
                            </span>
                          </div>
                        </div>
                      </article>
                    ))}
                    {columnIssues.length === 0 && (
                      <p className="empty-column">Drop an issue here or add a new one.</p>
                    )}
                  </div>
                  <button
                    className="add-issue-button"
                    type="button"
                    onClick={() => setNewIssueStatus(column.id)}
                  >
                    <span aria-hidden="true">＋</span> Add issue
                  </button>
                </section>
              );
            })}
          </div>
          <p className="drag-hint">
            <span aria-hidden="true">⠿</span> Drag an issue to another column to update its status.
          </p>
        </section>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      {newIssueStatus && (
        <dialog
          ref={dialogRef}
          className="issue-dialog"
          aria-labelledby="dialog-title"
          onClose={() => setNewIssueStatus(null)}
        >
          <div className="dialog-heading">
            <div>
              <span className="dialog-eyebrow">
                {columns.find((column) => column.id === newIssueStatus)?.title.toUpperCase()}
              </span>
              <h2 id="dialog-title">Create an issue</h2>
            </div>
            <button
              className="dialog-close"
              type="button"
              aria-label="Close dialog"
              onClick={() => setNewIssueStatus(null)}
            >
              ×
            </button>
          </div>
          <form onSubmit={createIssue}>
            <label htmlFor="issue-title">Title</label>
            <input
              id="issue-title"
              name="title"
              placeholder="What needs to be done?"
              required
              maxLength={120}
            />
            <label htmlFor="issue-description">
              Description <span>(optional)</span>
            </label>
            <textarea
              id="issue-description"
              name="description"
              placeholder="Add a few details..."
              rows={4}
              maxLength={500}
            />
            <div className="dialog-footer">
              <button
                className="secondary-button"
                type="button"
                onClick={() => setNewIssueStatus(null)}
              >
                Cancel
              </button>
              <button className="primary-button" type="submit">
                Create issue <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        </dialog>
      )}
    </main>
  );
}
