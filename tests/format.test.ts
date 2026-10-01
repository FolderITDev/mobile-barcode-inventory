import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDateTime,
  formatRelative,
  formatTimeZone,
  ordinal,
  utcOffset,
} from '../src/lib/format';

test('offsets are computed from the recorded zone, including half hours', () => {
  const iso = '2026-09-30T12:00:00Z';
  assert.equal(utcOffset(iso, 'America/Argentina/Cordoba'), 'GMT-3');
  assert.equal(utcOffset(iso, 'Asia/Kolkata'), 'GMT+5:30');
  assert.equal(utcOffset(iso, 'UTC'), 'GMT');
  assert.equal(formatTimeZone(iso, 'Not/AZone'), 'Not/AZone');
});

test('seconds in the recorded moment do not skew the offset', () => {
  const iso = '2026-10-01T14:12:40.512Z';
  assert.equal(utcOffset(iso, 'America/Argentina/Cordoba'), 'GMT-3');
  assert.equal(utcOffset(iso, 'Asia/Kolkata'), 'GMT+5:30');
  assert.equal(utcOffset(iso, 'Pacific/Chatham'), 'GMT+13:45');
});

test('receipt times use the zone they were recorded in', () => {
  assert.equal(
    formatDateTime('2026-09-30T12:00:00Z', 'America/Chicago'),
    'Sep 30, 2026 at 7:00 AM',
  );
});

test('relative dates name today and yesterday', () => {
  const now = new Date(2026, 8, 30, 15, 0);
  assert.match(
    formatRelative(new Date(2026, 8, 30, 9, 5).toISOString(), now),
    /^Today, 9:05/,
  );
  assert.match(
    formatRelative(new Date(2026, 8, 29, 9, 5).toISOString(), now),
    /^Yesterday/,
  );
  assert.match(
    formatRelative(new Date(2025, 0, 2, 9, 5).toISOString(), now),
    /2025/,
  );
  assert.equal(ordinal(0), '01');
});
