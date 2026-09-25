import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isApplicationDeadlinePassed } from './opportunityDeadline.ts'

const at = (iso: string) => new Date(iso).getTime()

test('no deadline means applications never expire by date', () => {
  assert.equal(isApplicationDeadlinePassed(undefined), false)
  assert.equal(isApplicationDeadlinePassed(null), false)
  assert.equal(isApplicationDeadlinePassed(''), false)
})

test('the deadline day itself is still open, all the way to its last second', () => {
  const deadline = '2026-09-25T00:00:00.000Z'
  assert.equal(isApplicationDeadlinePassed(deadline, at('2026-09-25T00:00:00.000Z')), false)
  assert.equal(isApplicationDeadlinePassed(deadline, at('2026-09-25T23:59:59.999Z')), false)
})

test('applications close when the day after the deadline begins', () => {
  const deadline = '2026-09-25T00:00:00.000Z'
  assert.equal(isApplicationDeadlinePassed(deadline, at('2026-09-26T00:00:00.000Z')), true)
  assert.equal(isApplicationDeadlinePassed(deadline, at('2026-10-30T12:00:00.000Z')), true)
})

test('a deadline earlier than today is already over', () => {
  assert.equal(isApplicationDeadlinePassed('2026-09-01T00:00:00.000Z', at('2026-09-25T10:00:00.000Z')), true)
})

test('a deadline with a time of day still means the end of that UTC day', () => {
  const deadline = '2026-09-25T15:30:00.000Z'
  assert.equal(isApplicationDeadlinePassed(deadline, at('2026-09-25T23:00:00.000Z')), false)
  assert.equal(isApplicationDeadlinePassed(deadline, at('2026-09-26T00:00:00.000Z')), true)
})

test('an unreadable date is treated as no deadline rather than closing the posting', () => {
  assert.equal(isApplicationDeadlinePassed('not a date', at('2026-09-25T10:00:00.000Z')), false)
})
