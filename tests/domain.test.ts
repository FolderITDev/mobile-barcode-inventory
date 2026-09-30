import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isEan13,
  createCount,
  scan,
  adjust,
  closeCount,
  totals,
  ScanGate,
  difference,
  discrepancies,
  lineStatus,
  sessionOrder,
} from '../src/domain/model';
import { expectedLines } from './fixtures';
test('fixture barcodes have valid checksums; malformed codes are rejected', () => {
  for (const l of expectedLines) assert.ok(isEan13(l.barcode));
  assert.ok(!isEan13('123'));
  assert.ok(
    !isEan13(
      expectedLines[0].barcode.slice(0, 12) +
        ((Number(expectedLines[0].barcode[12]) + 1) % 10),
    ),
  );
});
test('counting preserves expectations, reconciles and enforces closure', () => {
  const r = createCount('test', 'Receiving', expectedLines);
  const next = scan(r, expectedLines[0].barcode);
  assert.equal(next.lines[0].observed, 1);
  assert.equal(r.lines[0].observed, 0);
  assert.equal(next.lines[0].expected, 5);
  assert.equal(totals(next).short, 6);
  assert.equal(adjust(next, expectedLines[0].barcode, -1).lines[0].observed, 0);
  assert.throws(() => adjust(r, expectedLines[0].barcode, -1));
  assert.throws(() => scan(closeCount(next), expectedLines[0].barcode));
});
test('unexpected items and duplicate expected codes', () => {
  const r = createCount('test', 'Receiving', expectedLines.slice(0, 1));
  const next = scan(r, expectedLines[1].barcode);
  assert.equal(next.lines[1].expected, 0);
  assert.equal(next.lines[1].unexpected, true);
  assert.equal(totals(next).unexpected, 1);
  assert.throws(() =>
    createCount('test', 'Receiving', [expectedLines[0], expectedLines[0]]),
  );
});
test('camera accepts exactly one event until explicitly rearmed', () => {
  const gate = new ScanGate();
  assert.equal(gate.take(), true);
  assert.equal(gate.take(), false);
  assert.equal(gate.take(), false);
  gate.rearm();
  assert.equal(gate.take(), true);
});
test('line status separates not-yet-counted from short, and words carry the sign', () => {
  const r = createCount('test', 'Receiving', expectedLines.slice(0, 2));
  const [gloves] = r.lines;
  assert.equal(lineStatus(gloves), 'uncounted');
  assert.equal(difference(gloves), 'Not counted yet');
  let next = scan(r, gloves.barcode);
  assert.equal(lineStatus(next.lines[0]), 'short');
  assert.equal(difference(next.lines[0]), `Short by ${gloves.expected - 1}`);
  for (let i = 1; i < gloves.expected + 1; i++)
    next = scan(next, gloves.barcode);
  assert.equal(difference(next.lines[0]), 'Over by 1');
  next = scan(next, expectedLines[4].barcode);
  assert.equal(difference(next.lines[2]), 'Unexpected · 1 counted');
  assert.equal(discrepancies(next).length, 3);
});
test('sessions list active counts first, newest activity on top', () => {
  const a = {
    ...createCount('a', 'A', expectedLines),
    updatedAt: '2026-09-01T00:00:00Z',
  };
  const b = {
    ...createCount('b', 'B', expectedLines),
    updatedAt: '2026-09-02T00:00:00Z',
  };
  const c = closeCount(
    createCount('c', 'C', expectedLines),
    '2026-09-03T00:00:00Z',
  );
  assert.deepEqual(
    sessionOrder([c, a, b]).map((r) => r.id),
    ['b', 'a', 'c'],
  );
});
