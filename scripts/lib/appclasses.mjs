// Brand-independent web-app component classes (.ds-app-*), built ONLY from the --app-* variables of a brand's tokens.
// They work with plain CSS (tokens.css) and, wrapped in @layer components, next to Tailwind utilities (tokens.tailwind.css).
// This covers every brand, including the ones whose DESIGN.md has no component tokens.

export const APP_CLASSES_CSS = `/* ===== Web-app kit: .ds-app-* classes, built only from the --app-* variables above (every brand) ===== */
.ds-app-page { background: var(--app-page); color: var(--app-text); font-family: var(--font-body, system-ui, sans-serif); line-height: 1.5; }

/* cards and KPI tiles */
.ds-app-card { background: var(--app-surface); color: var(--app-text); border: 1px solid var(--app-border); border-radius: var(--app-radius-card, 12px); padding: 16px; }
.ds-app-card-muted { background: var(--app-surface-muted); border-color: var(--app-border-subtle); }
.ds-app-stat-label { font-size: 0.875rem; color: var(--app-text-muted); }
.ds-app-stat-value { font-family: var(--font-display, inherit); font-size: 1.75rem; line-height: 1.2; font-weight: 600; color: var(--app-text); margin-top: 8px; }
.ds-app-stat-delta { font-size: 0.875rem; margin-top: 4px; color: var(--app-text-muted); }
.ds-app-stat-delta.is-up { color: var(--app-success); }
.ds-app-stat-delta.is-down { color: var(--app-danger); }

/* buttons: primary uses the accent-strong fill so small text stays readable */
.ds-app-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px; padding: 8px 16px; font: inherit; font-size: 0.875rem; font-weight: 600; text-decoration: none; border: 1px solid transparent; border-radius: var(--app-radius-control, 8px); cursor: pointer; transition: background-color 0.15s, border-color 0.15s, transform 0.1s; }
.ds-app-btn:active { transform: scale(0.98); }
.ds-app-btn:focus-visible { outline: 2px solid var(--app-focus); outline-offset: 2px; }
.ds-app-btn:disabled, .ds-app-btn[aria-disabled="true"] { cursor: not-allowed; }
.ds-app-btn-primary { background: var(--app-accent-strong); color: var(--app-on-accent); }
.ds-app-btn-primary:hover:not(:disabled) { background: color-mix(in srgb, var(--app-accent-strong) 88%, var(--app-text)); }
.ds-app-btn-primary:disabled { background: var(--app-accent-disabled); }
.ds-app-btn-secondary { background: var(--app-surface); color: var(--app-text); border-color: var(--app-border-strong); }
.ds-app-btn-secondary:hover:not(:disabled) { background: var(--app-surface-muted); }
.ds-app-btn-secondary:disabled { color: var(--app-text-subtle); }
.ds-app-btn-ghost { background: transparent; color: var(--app-text-muted); }
.ds-app-btn-ghost:hover:not(:disabled) { background: var(--app-surface-muted); color: var(--app-text); }
.ds-app-btn-danger { background: var(--app-danger-soft); color: var(--app-danger); border-color: var(--app-danger-border); }
.ds-app-btn-danger:hover:not(:disabled) { border-color: var(--app-danger); }

/* form fields */
.ds-app-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--app-text-muted); margin-bottom: 4px; }
.ds-app-input { width: 100%; box-sizing: border-box; min-height: 40px; padding: 8px 12px; font: inherit; font-size: 1rem; background: var(--app-surface); color: var(--app-text); border: 1px solid var(--app-border-strong); border-radius: var(--app-radius-control, 8px); }
.ds-app-input::placeholder { color: var(--app-text-subtle); }
.ds-app-input:focus-visible { outline: 2px solid var(--app-focus); outline-offset: 1px; }
.ds-app-input[aria-invalid="true"] { border-color: var(--app-danger); }
.ds-app-input:disabled { background: var(--app-surface-muted); color: var(--app-text-subtle); cursor: not-allowed; }
.ds-app-hint { font-size: 0.875rem; color: var(--app-text-muted); margin-top: 4px; }
.ds-app-error { font-size: 0.875rem; color: var(--app-danger); margin-top: 4px; }

/* table: add class is-selected (or aria-selected="true") on a row */
.ds-app-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; color: var(--app-text); }
.ds-app-table th { text-align: left; font-weight: 500; padding: 10px 16px; background: var(--app-surface-muted); color: var(--app-text-muted); border-bottom: 1px solid var(--app-border); }
.ds-app-table td { padding: 12px 16px; border-bottom: 1px solid var(--app-border-subtle); }
.ds-app-table tr.is-selected td, .ds-app-table tr[aria-selected="true"] td { background: var(--app-accent-soft); }
.ds-app-table tbody tr:hover td { background: var(--app-surface-muted); }

/* navigation: add is-active on the current item */
.ds-app-nav { display: grid; gap: 4px; }
.ds-app-nav-item { display: block; padding: 8px 12px; font-size: 0.875rem; text-decoration: none; color: var(--app-text-muted); border-radius: var(--app-radius-control, 8px); }
.ds-app-nav-item:hover { background: var(--app-surface-muted); color: var(--app-text); }
.ds-app-nav-item.is-active { background: var(--app-accent-soft); color: var(--app-accent-text); font-weight: 600; }

/* segmented control / tabs */
.ds-app-segmented { display: inline-flex; gap: 2px; padding: 4px; background: var(--app-surface-muted); border-radius: var(--app-radius-control, 8px); }
.ds-app-segmented-item { padding: 6px 14px; font: inherit; font-size: 0.875rem; color: var(--app-text-muted); background: transparent; border: 0; border-radius: calc(var(--app-radius-control, 8px) - 2px); cursor: pointer; }
.ds-app-segmented-item.is-active { background: var(--app-surface); color: var(--app-text); font-weight: 600; box-shadow: 0 1px 2px color-mix(in srgb, var(--app-overlay) 14%, transparent); }

/* selectable card + animated check (toggle is-selected / is-checked from your code) */
.ds-app-select-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--app-surface); border: 1px solid var(--app-border); border-radius: var(--app-radius-card, 12px); cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s; }
.ds-app-select-card:hover { border-color: var(--app-border-strong); }
.ds-app-select-card.is-selected { border-color: var(--app-accent); box-shadow: 0 0 0 1px var(--app-accent); background: var(--app-accent-soft); }
.ds-app-check { width: 24px; height: 24px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; border: 2px solid var(--app-border-strong); border-radius: 9999px; color: var(--app-on-accent); transition: background-color 0.2s, border-color 0.2s; }
.ds-app-check svg { width: 16px; height: 16px; }
.ds-app-check path { stroke-dasharray: 1; stroke-dashoffset: 1; }
.ds-app-check.is-checked { background: var(--app-accent-strong); border-color: var(--app-accent-strong); animation: ds-app-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.ds-app-check.is-checked path { animation: ds-app-draw 0.35s ease-out 0.1s forwards; }
@keyframes ds-app-pop { from { transform: scale(0.6); } to { transform: scale(1); } }
@keyframes ds-app-draw { to { stroke-dashoffset: 0; } }

/* callouts and badges: status colors mean status only */
.ds-app-callout { padding: 12px 14px; font-size: 0.875rem; border: 1px solid var(--app-border); border-radius: var(--app-radius-control, 8px); background: var(--app-surface-muted); color: var(--app-text); }
.ds-app-callout-danger { background: var(--app-danger-soft); border-color: var(--app-danger-border); color: var(--app-danger); }
.ds-app-callout-success { background: var(--app-success-soft); border-color: var(--app-success-border); color: var(--app-success); }
.ds-app-callout-warning { background: var(--app-warning-soft); border-color: var(--app-warning-border); color: var(--app-warning); }
.ds-app-callout-info { background: var(--app-info-soft); border-color: var(--app-info-border); color: var(--app-info); }
.ds-app-badge { display: inline-block; padding: 2px 10px; font-size: 0.75rem; font-weight: 600; border: 1px solid var(--app-border); border-radius: 9999px; background: var(--app-surface-muted); color: var(--app-text-muted); }
.ds-app-badge-accent { background: var(--app-accent-soft); border-color: var(--app-accent-border); color: var(--app-accent-text); }
.ds-app-badge-danger { background: var(--app-danger-soft); border-color: var(--app-danger-border); color: var(--app-danger); }
.ds-app-badge-success { background: var(--app-success-soft); border-color: var(--app-success-border); color: var(--app-success); }
.ds-app-badge-warning { background: var(--app-warning-soft); border-color: var(--app-warning-border); color: var(--app-warning); }
.ds-app-badge-info { background: var(--app-info-soft); border-color: var(--app-info-border); color: var(--app-info); }

/* empty state, progress, link, divider */
.ds-app-empty { padding: 32px 16px; text-align: center; background: var(--app-surface-muted); border: 1px dashed var(--app-border-strong); border-radius: var(--app-radius-card, 12px); }
.ds-app-empty-title { font-weight: 600; color: var(--app-text-muted); }
.ds-app-empty-hint { margin-top: 4px; font-size: 0.875rem; color: var(--app-text-muted); }
.ds-app-progress { height: 8px; background: var(--app-surface-muted); border-radius: 9999px; overflow: hidden; }
.ds-app-progress > span { display: block; height: 100%; background: var(--app-accent); border-radius: inherit; }
.ds-app-link { color: var(--app-link); text-decoration: none; }
.ds-app-link:hover { text-decoration: underline; }
.ds-app-divider { border: 0; border-top: 1px solid var(--app-border-subtle); margin: 16px 0; }

/* Thai content (<html lang="th">): taller lines, no letter-spacing */
:lang(th) [class*="ds-app-"] { line-height: 1.7; letter-spacing: normal; text-transform: none; }
:lang(th) .ds-app-stat-value { line-height: 1.4; }
@media (prefers-reduced-motion: reduce) {
  .ds-app-btn, .ds-app-select-card, .ds-app-check { transition: none; }
  .ds-app-check.is-checked, .ds-app-check.is-checked path { animation: none; }
  .ds-app-check.is-checked path { stroke-dashoffset: 0; }
}
`;
