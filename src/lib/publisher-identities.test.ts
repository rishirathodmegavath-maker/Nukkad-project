import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PUBLISHER_IDENTITIES, publisherIdentityLabel } from './publisher-identities.ts'

test('the fixed list has exactly the six approved identities, BuildAdda first', () => {
  assert.deepEqual(
    PUBLISHER_IDENTITIES.map((i) => i.key),
    ['BUILDADDA', 'BUILDADDA_INSIGHTS', 'BUILDADDA_GRANTS', 'BUILDADDA_COMMUNITY', 'BUILDADDA_STARTUP_DESK', 'BUILDADDA_EDITORIAL'],
  )
  assert.equal(PUBLISHER_IDENTITIES[0].label, 'BuildAdda')
})

test('each key maps to its own readable label, matching the backend enum exactly', () => {
  assert.equal(publisherIdentityLabel('BUILDADDA_INSIGHTS'), 'BuildAdda Insights')
  assert.equal(publisherIdentityLabel('BUILDADDA_GRANTS'), 'BuildAdda Grants')
  assert.equal(publisherIdentityLabel('BUILDADDA_COMMUNITY'), 'BuildAdda Community')
  assert.equal(publisherIdentityLabel('BUILDADDA_STARTUP_DESK'), 'BuildAdda Startup Desk')
  assert.equal(publisherIdentityLabel('BUILDADDA_EDITORIAL'), 'BuildAdda Editorial')
})

test('a missing or unrecognized identity falls back to plain BuildAdda, never blank or raw', () => {
  assert.equal(publisherIdentityLabel(undefined), 'BuildAdda')
  // An out-of-range value can genuinely arrive at runtime — a historical row, or one written by a
  // backend that added a new identity this frontend build doesn't know about yet.
  assert.equal(publisherIdentityLabel('SOMETHING_UNKNOWN'), 'BuildAdda')
})
