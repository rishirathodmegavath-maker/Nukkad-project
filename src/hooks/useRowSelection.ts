import { useCallback, useState } from 'react'
import {
  applyRowClick,
  applySelectAllVisible,
  emptySelection,
  removeIds,
  type SelectionModifiers,
} from '@/lib/rowSelection'

/**
 * Browser/file-explorer-style row selection for an admin list: plain click selects one row,
 * shift+click selects the whole range from the last-clicked row, ctrl/cmd+click toggles one row
 * without touching the rest, and ctrl/cmd+shift+click adds a range without clearing anything. The
 * selection persists across server-side pages — only shift's range is limited to whichever page is
 * currently loaded. See rowSelection.ts for the exact rules this follows.
 */
export function useRowSelection() {
  const [state, setState] = useState(emptySelection)

  const handleRowClick = useCallback((id: string, visibleIds: readonly string[], modifiers: SelectionModifiers) => {
    setState((prev) => applyRowClick(prev, id, visibleIds, modifiers))
  }, [])

  const toggleSelectAllVisible = useCallback((visibleIds: readonly string[]) => {
    setState((prev) => ({ ...prev, selectedIds: applySelectAllVisible(prev.selectedIds, visibleIds) }))
  }, [])

  const clearSelection = useCallback(() => setState(emptySelection()), [])

  /** Drops exactly these ids from the selection, e.g. after a bulk delete — leaves anything else
   *  selected (on this page or another) untouched. */
  const removeFromSelection = useCallback((ids: Iterable<string>) => {
    setState((prev) => ({ ...prev, selectedIds: removeIds(prev.selectedIds, ids) }))
  }, [])

  const clearAnchor = useCallback(() => setState((prev) => ({ ...prev, anchorId: null })), [])

  return {
    selectedIds: state.selectedIds,
    handleRowClick,
    toggleSelectAllVisible,
    clearSelection,
    removeFromSelection,
    clearAnchor,
  }
}
