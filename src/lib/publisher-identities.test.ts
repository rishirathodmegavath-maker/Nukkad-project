import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PUBLISHER_IDENTITIES, publisherIdentityLabel } from './publisher-identities.ts'

test('the fixed list has exactly the five authorized identities, BuildAdda first', () => {
  assert.deepEqual(
    PUBLISHER_IDENTITIES.map((i) => i.key),
    ['BUILDADDA', 'ARJUN_MEHTA', 'KARAN_SHAH', 'NEEL_KAPOOR', 'VIKRAM_RAO'],
  )
  assert.equal(PUBLISHER_IDENTITIES[0].label, 'BuildAdda')
})

test('each key maps to its own readable label, matching the backend enum exactly', () => {
  assert.equal(publisherIdentityLabel('BUILDADDA'), 'BuildAdda')
  assert.equal(publisherIdentityLabel('ARJUN_MEHTA'), 'Arjun Mehta')
  assert.equal(publisherIdentityLabel('KARAN_SHAH'), 'Karan Shah')
  assert.equal(publisherIdentityLabel('NEEL_KAPOOR'), 'Neel Kapoor')
  assert.equal(publisherIdentityLabel('VIKRAM_RAO'), 'Vikram Rao')
})

test('a missing or unrecognized identity falls back to plain BuildAdda, never blank or raw', () => {
  assert.equal(publisherIdentityLabel(undefined), 'BuildAdda')
  // An out-of-range value can genuinely arrive at runtime — a historical row, or one written by a
  // backend that added a new identity this frontend build doesn't know about yet.
  assert.equal(publisherIdentityLabel('SOMETHING_UNKNOWN'), 'BuildAdda')
})
