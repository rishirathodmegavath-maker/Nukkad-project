/**
 * Browser / file-explorer style multi-row selection (the model Chrome's History page, Windows
 * Explorer and macOS Finder all share) — pure, framework-free state transitions so the tricky part
 * (range math, modifier-key combinations) is testable without React or a DOM. See
 * useRowSelection.ts for the hook that wraps this for a page, and rowSelection.test.ts for the
 * behavior this is meant to guarantee.
 */

/** The modifier keys held during a row click. `metaKey` is Cmd on macOS — treated exactly like
 *  `ctrlKey` everywhere below, so the same interaction works on Windows/Linux and macOS. */
export interface SelectionModifiers {
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
}

export interface SelectionState {
  /** Every selected row id, across every server-side page visited so far — changing pages never
   *  drops a selection on its own; only an explicit click can. */
  selectedIds: Set<string>
  /** The fixed point a shift+click's range is measured from: the last row clicked without a
   *  modifier, or the last ctrl/cmd+click. Null once nothing has been clicked yet, or after the
   *  selection is cleared. */
  anchorId: string | null
}

export function emptySelection(): SelectionState {
  return { selectedIds: new Set(), anchorId: null }
}

/**
 * Applies one row click, exactly like a file manager:
 *
 * - Plain click: replaces the whole selection with just this row, which becomes the new anchor.
 * - Ctrl/Cmd+click: toggles just this row, leaving every other selected row (on this page or any
 *   other) untouched, and this row becomes the new anchor.
 * - Shift+click: selects every row between the anchor and this row, inclusive, in either
 *   direction — REPLACING whatever was selected before, matching Explorer rather than adding to
 *   it. The anchor itself does not move, so a second shift+click still measures from the same
 *   fixed point, not from the last shift-clicked row.
 * - Ctrl/Cmd+Shift+click: the same range, but added to the existing selection instead of
 *   replacing it. The anchor does not move here either.
 *
 * `visibleIds` is the order of rows actually rendered right now (one server-side page) — a range
 * is only ever computed across rows that are actually visible. If the stored anchor isn't among
 * them (nothing has been clicked on this page yet, or the anchor's page isn't loaded anymore),
 * there's no cross-page range to compute, so the click degrades to a plain click on `id` and a
 * fresh anchor is set here instead of pretending an unloaded page is part of the range.
 */
export function applyRowClick(
  state: SelectionState,
  id: string,
  visibleIds: readonly string[],
  modifiers: SelectionModifiers,
): SelectionState {
  const isToggle = modifiers.ctrlKey || modifiers.metaKey
  const isRange = modifiers.shiftKey

  if (isRange) {
    const anchorIndex = state.anchorId === null ? -1 : visibleIds.indexOf(state.anchorId)
    const clickedIndex = visibleIds.indexOf(id)
    if (anchorIndex === -1 || clickedIndex === -1) {
      const selectedIds = isToggle ? new Set(state.selectedIds) : new Set<string>()
      selectedIds.add(id)
      return { selectedIds, anchorId: id }
    }
    const start = Math.min(anchorIndex, clickedIndex)
    const end = Math.max(anchorIndex, clickedIndex)
    const selectedIds = isToggle ? new Set(state.selectedIds) : new Set<string>()
    for (const rid of visibleIds.slice(start, end + 1)) selectedIds.add(rid)
    return { selectedIds, anchorId: state.anchorId }
  }

  if (isToggle) {
    const selectedIds = new Set(state.selectedIds)
    if (selectedIds.has(id)) selectedIds.delete(id)
    else selectedIds.add(id)
    return { selectedIds, anchorId: id }
  }

  return { selectedIds: new Set([id]), anchorId: id }
}

/**
 * Select-all for the current page only: if every visible row is already selected, this clears
 * just those (leaving any selection made on other pages intact); otherwise it adds every visible
 * row to whatever is already selected. Never touches an id outside `visibleIds`.
 */
export function applySelectAllVisible(selectedIds: ReadonlySet<string>, visibleIds: readonly string[]): Set<string> {
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
  const next = new Set(selectedIds)
  for (const id of visibleIds) {
    if (allSelected) next.delete(id)
    else next.add(id)
  }
  return next
}

/** Removes exactly these ids from the selection — used after a successful bulk delete, where the
 *  deleted ids are whatever was selected at the moment the delete was confirmed (not necessarily
 *  every id currently selected, if the admin kept clicking while the request was in flight). */
export function removeIds(selectedIds: ReadonlySet<string>, ids: Iterable<string>): Set<string> {
  const next = new Set(selectedIds)
  for (const id of ids) next.delete(id)
  return next
}

export function isAllVisibleSelected(selectedIds: ReadonlySet<string>, visibleIds: readonly string[]): boolean {
  return visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
}

export function isAnyVisibleSelected(selectedIds: ReadonlySet<string>, visibleIds: readonly string[]): boolean {
  return visibleIds.some((id) => selectedIds.has(id))
}
