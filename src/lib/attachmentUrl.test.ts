import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ATTACHMENT_URL_REFRESH_AFTER_MS, ATTACHMENT_URL_TTL_MS, isAttachmentUrlStale } from './attachmentUrl.ts'

const MINUTE = 60 * 1000
const ISSUED = 1_700_000_000_000

test('a URL minted moments ago is not stale', () => {
  assert.equal(isAttachmentUrlStale(ISSUED, ISSUED), false)
  assert.equal(isAttachmentUrlStale(ISSUED, ISSUED + 5 * MINUTE), false)
})

test('a URL becomes stale exactly when the refresh window opens, well before the real expiry', () => {
  assert.equal(isAttachmentUrlStale(ISSUED, ISSUED + ATTACHMENT_URL_REFRESH_AFTER_MS - 1), false)
  assert.equal(isAttachmentUrlStale(ISSUED, ISSUED + ATTACHMENT_URL_REFRESH_AFTER_MS), true)
  assert.ok(ATTACHMENT_URL_REFRESH_AFTER_MS < ATTACHMENT_URL_TTL_MS, 'must refresh before the URL actually expires')
})

test('a URL that is already past its real expiry is stale', () => {
  assert.equal(isAttachmentUrlStale(ISSUED, ISSUED + ATTACHMENT_URL_TTL_MS + MINUTE), true)
})

test('an unknown issue time is treated as stale rather than trusted', () => {
  assert.equal(isAttachmentUrlStale(undefined, ISSUED), true)
})

test('a clock that moved backwards does not make a fresh URL look stale', () => {
  assert.equal(isAttachmentUrlStale(ISSUED, ISSUED - 10 * MINUTE), false)
})
