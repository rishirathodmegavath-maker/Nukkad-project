import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeHref } from './links.ts'

test('a plain http(s) URL is returned as-is', () => {
  assert.equal(safeHref('https://example.com'), 'https://example.com/')
  assert.equal(safeHref('http://example.com/path?x=1'), 'http://example.com/path?x=1')
})

test('a scheme is accepted case-insensitively (the URL class normalizes it)', () => {
  assert.equal(safeHref('HTTPS://Example.com'), 'https://example.com/')
})

test('a javascript: URI is rejected, not rendered inert', () => {
  assert.equal(safeHref('javascript:alert(1)'), null)
})

test('a data: URI is rejected', () => {
  assert.equal(safeHref('data:text/html,<script>alert(1)</script>'), null)
})

test('a vbscript: URI is rejected', () => {
  assert.equal(safeHref('vbscript:msgbox(1)'), null)
})

test('a protocol-relative URL has no scheme to trust and is rejected', () => {
  assert.equal(safeHref('//evil.example/x'), null)
})

test('malformed input is rejected rather than thrown', () => {
  assert.equal(safeHref('not a url'), null)
  assert.equal(safeHref(''), null)
})
