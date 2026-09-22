import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  applyRowClick,
  applySelectAllVisible,
  emptySelection,
  isAllVisibleSelected,
  isAnyVisibleSelected,
  removeIds,
  type SelectionState,
} from './rowSelection.ts'

const PAGE_1 = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 'r8', 'r9', 'r10']
const PAGE_2 = ['r11', 'r12', 'r13', 'r14', 'r15']

const plain = { shiftKey: false, ctrlKey: false, metaKey: false }
const shift = { shiftKey: true, ctrlKey: false, metaKey: false }
const ctrl = { shiftKey: false, ctrlKey: true, metaKey: false }
const cmd = { shiftKey: false, ctrlKey: false, metaKey: true }
const ctrlShift = { shiftKey: true, ctrlKey: true, metaKey: false }

function ids(state: SelectionState): string[] {
  return [...state.selectedIds].sort()
}

test('a plain click on one row selects only that row and anchors it', () => {
  const state = applyRowClick(emptySelection(), 'r3', PAGE_1, plain)
  assert.deepEqual(ids(state), ['r3'])
  assert.equal(state.anchorId, 'r3')
})

test('a second plain click replaces the selection instead of adding to it', () => {
  let state = applyRowClick(emptySelection(), 'r3', PAGE_1, plain)
  state = applyRowClick(state, 'r7', PAGE_1, plain)
  assert.deepEqual(ids(state), ['r7'])
  assert.equal(state.anchorId, 'r7')
})

test('shift+click selects the whole forward range from the anchor, inclusive', () => {
  // click row 10 (well, r1 here) then shift+click a later row, mirroring the spec's "click row 10,
  // Shift+click row 50 -> rows 10-50 selected" example at this array's scale.
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift)
  assert.deepEqual(ids(state), ['r2', 'r3', 'r4', 'r5', 'r6'])
  // The anchor stays put so a further shift+click still measures from r2, not from r6.
  assert.equal(state.anchorId, 'r2')
})

test('shift+click in reverse selects the same range, direction-independent', () => {
  // click row 50, Shift+click row 10 -> rows 10-50 selected (same set either way).
  let state = applyRowClick(emptySelection(), 'r6', PAGE_1, plain)
  state = applyRowClick(state, 'r2', PAGE_1, shift)
  assert.deepEqual(ids(state), ['r2', 'r3', 'r4', 'r5', 'r6'])
  assert.equal(state.anchorId, 'r6')
})

test('a repeated shift+click re-measures from the original anchor, not the last shift target', () => {
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift) // r2..r6
  state = applyRowClick(state, 'r4', PAGE_1, shift) // now r2..r4, not r4..r6
  assert.deepEqual(ids(state), ['r2', 'r3', 'r4'])
})

test('ctrl+click toggles one row off without touching the rest of a range', () => {
  // select 10-50 (here r2..r6), then Ctrl+click the middle row -> that row alone is removed.
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift)
  state = applyRowClick(state, 'r4', PAGE_1, ctrl)
  assert.deepEqual(ids(state), ['r2', 'r3', 'r5', 'r6'])
})

test('ctrl+click toggles one row back on without touching the rest', () => {
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift)
  state = applyRowClick(state, 'r4', PAGE_1, ctrl) // remove r4
  state = applyRowClick(state, 'r4', PAGE_1, ctrl) // add it back
  assert.deepEqual(ids(state), ['r2', 'r3', 'r4', 'r5', 'r6'])
})

test('cmd+click (macOS) behaves exactly like ctrl+click', () => {
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift)
  state = applyRowClick(state, 'r4', PAGE_1, cmd)
  assert.deepEqual(ids(state), ['r2', 'r3', 'r5', 'r6'])
})

test('ctrl+click on an unselected row adds it without clearing anything else', () => {
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r9', PAGE_1, ctrl)
  assert.deepEqual(ids(state), ['r2', 'r9'])
})

test('ctrl+shift+click extends a range while preserving an unrelated existing selection', () => {
  // r9 is already selected on its own (say, from an earlier ctrl+click), with the anchor sitting
  // at r2 from a prior plain click. A ctrl+shift+click extending r2..r4 must add that range
  // without disturbing r9.
  const state: SelectionState = { selectedIds: new Set(['r9']), anchorId: 'r2' }
  const result = applyRowClick(state, 'r4', PAGE_1, ctrlShift)
  assert.deepEqual(ids(result), ['r2', 'r3', 'r4', 'r9'])
  // The anchor doesn't move for a ctrl+shift extension either.
  assert.equal(result.anchorId, 'r2')
})

test('select-all-visible selects every row on the current page only', () => {
  const selected = applySelectAllVisible(new Set(), PAGE_1)
  assert.deepEqual([...selected].sort(), [...PAGE_1].sort())
})

test('select-all-visible does not touch rows already selected on a different page', () => {
  const selected = applySelectAllVisible(new Set(['r11', 'r13']), PAGE_1)
  assert.deepEqual([...selected].sort(), [...PAGE_1, 'r11', 'r13'].sort())
})

test('select-all again, once every visible row is selected, deselects just the visible rows', () => {
  const allSelected = applySelectAllVisible(new Set(), PAGE_1)
  const toggledOff = applySelectAllVisible(allSelected, PAGE_1)
  assert.deepEqual([...toggledOff], [])
})

test('select-all only clears the current page, leaving other pages selected', () => {
  const selected = new Set([...PAGE_1, 'r11', 'r13'])
  const toggledOff = applySelectAllVisible(selected, PAGE_1)
  assert.deepEqual([...toggledOff].sort(), ['r11', 'r13'])
})

test('select-all on an empty page is a no-op', () => {
  const selected = applySelectAllVisible(new Set(['r11']), [])
  assert.deepEqual([...selected], ['r11'])
})

test('isAllVisibleSelected / isAnyVisibleSelected reflect partial and full selection', () => {
  const some = new Set(['r2', 'r4'])
  assert.equal(isAllVisibleSelected(some, PAGE_1), false)
  assert.equal(isAnyVisibleSelected(some, PAGE_1), true)
  assert.equal(isAllVisibleSelected(new Set(PAGE_1), PAGE_1), true)
  assert.equal(isAnyVisibleSelected(new Set(), PAGE_1), false)
})

test('a selection survives moving to another server-side page untouched', () => {
  // Select on page 1, "navigate" (nothing clears the Set on its own), then add more on page 2.
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift) // r2..r6 selected on page 1
  // Moving pages doesn't call anything here — the Set is simply carried into the next render with
  // page 2's rows. Selecting more there must not disturb page 1's rows.
  state = applyRowClick(state, 'r12', PAGE_2, ctrl)
  assert.deepEqual(ids(state), ['r12', 'r2', 'r3', 'r4', 'r5', 'r6'])
})

test('shift+click cannot draw a range into a page whose rows are not currently loaded', () => {
  // Anchor was set on page 1; the admin has since moved to page 2, where that anchor id isn't
  // among the visible rows. A shift+click here must not "reach back" into page 1's unloaded rows —
  // it degrades to a plain click on the row actually clicked, and anchors fresh on page 2.
  const state: SelectionState = { selectedIds: new Set(['r2', 'r3']), anchorId: 'r2' }
  const result = applyRowClick(state, 'r13', PAGE_2, shift)
  assert.deepEqual(ids(result), ['r13'])
  assert.equal(result.anchorId, 'r13')
})

test('ctrl+shift+click with a stale (unloaded-page) anchor still preserves the existing cross-page selection', () => {
  const state: SelectionState = { selectedIds: new Set(['r2', 'r3']), anchorId: 'r2' }
  const result = applyRowClick(state, 'r13', PAGE_2, ctrlShift)
  assert.deepEqual(ids(result), ['r13', 'r2', 'r3'].sort())
  assert.equal(result.anchorId, 'r13')
})

test('clearing the selection empties it and drops the anchor', () => {
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift)
  state = emptySelection()
  assert.deepEqual(ids(state), [])
  assert.equal(state.anchorId, null)
})

test('bulk delete after a range selection removes exactly the deleted ids, nothing else', () => {
  let state = applyRowClick(emptySelection(), 'r2', PAGE_1, plain)
  state = applyRowClick(state, 'r6', PAGE_1, shift) // r2..r6
  state = applyRowClick(state, 'r12', PAGE_2, ctrl) // plus one from another page
  const deletedIds = ['r2', 'r3', 'r4', 'r5', 'r6'] // what the confirm dialog sent to the API
  const afterDelete = removeIds(state.selectedIds, deletedIds)
  assert.deepEqual([...afterDelete], ['r12'])
})

test('bulk delete leaves ids selected after the snapshot was taken (mid-flight clicks) alone', () => {
  // The delete request is fired with a snapshot of the ids at confirm-time; if the admin selects
  // one more row while the request is in flight, that row must survive the response handler only
  // removing the ids that were actually sent.
  const selectedAtConfirmTime = ['r2', 'r3']
  let selectedIds = new Set(selectedAtConfirmTime)
  selectedIds.add('r9') // clicked while the request was pending
  const afterDelete = removeIds(selectedIds, selectedAtConfirmTime)
  assert.deepEqual([...afterDelete], ['r9'])
})

test('an empty selection has nothing to delete and select-all has nothing to toggle from', () => {
  const state = emptySelection()
  assert.equal(state.selectedIds.size, 0)
  assert.equal(isAnyVisibleSelected(state.selectedIds, PAGE_1), false)
  // Deleting an empty set is a safe no-op, not an error.
  assert.deepEqual([...removeIds(state.selectedIds, [])], [])
})
