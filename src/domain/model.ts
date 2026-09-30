import {
  array,
  base,
  choice,
  integer,
  object,
  text,
  timestamp,
  type BaseRecord,
} from './validation';
export interface Line {
  barcode: string;
  name: string;
  expected: number;
  observed: number;
  unexpected: boolean;
}
export interface AppRecord extends BaseRecord {
  title: string;
  status: 'draft' | 'closed';
  closedAt: string | null;
  lines: Line[];
}
export function isEan13(code: string): boolean {
  return (
    /^\d{13}$/.test(code) &&
    [...code].reduce(
      (sum, c, i) => sum + Number(c) * (i % 2 === 0 ? 1 : 3),
      0,
    ) %
      10 ===
      0
  );
}
export function barcode(value: string): string {
  const result = value.trim();
  if (!isEan13(result))
    throw new Error(
      'Enter a valid 13-digit EAN barcode, including its check digit.',
    );
  return result;
}
function parseLine(value: unknown): Line {
  const v = object(value);
  if (typeof v.unexpected !== 'boolean') throw new Error('Invalid line type.');
  const line = {
    barcode: barcode(text(v.barcode, 'Barcode', 13)),
    name: text(v.name, 'Item name', 100),
    expected: integer(v.expected, 'Expected quantity'),
    observed: integer(v.observed, 'Counted quantity'),
    unexpected: v.unexpected,
  };
  if (line.unexpected && line.expected !== 0)
    throw new Error('Unexpected items must have zero expected quantity.');
  return line;
}
export function createCount(
  id: string,
  title: string,
  lines: Line[],
  now = new Date().toISOString(),
): AppRecord {
  const validated = lines.map(parseLine);
  if (!validated.length) throw new Error('Add at least one expected item.');
  if (validated.length > 500)
    throw new Error('Use at most 500 items per count.');
  if (new Set(validated.map((l) => l.barcode)).size !== validated.length)
    throw new Error('Each barcode can appear only once.');
  return {
    id,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    title: text(title, 'Count name', 100),
    status: 'draft',
    closedAt: null,
    lines: validated.map((l) => ({ ...l, observed: 0, unexpected: false })),
  };
}
export function scan(record: AppRecord, code: string): AppRecord {
  if (record.status !== 'draft')
    throw new Error('Closed counts are read-only.');
  const b = barcode(code);
  const existing = record.lines.find((l) => l.barcode === b);
  if (!existing && record.lines.length >= 500)
    throw new Error('This count has reached the 500-item limit.');
  return {
    ...record,
    lines: existing
      ? record.lines.map((l) =>
          l.barcode === b
            ? { ...l, observed: integer(l.observed + 1, 'Counted quantity') }
            : l,
        )
      : [
          ...record.lines,
          {
            barcode: b,
            name: 'Unlisted item',
            expected: 0,
            observed: 1,
            unexpected: true,
          },
        ],
  };
}
export function adjust(
  record: AppRecord,
  code: string,
  delta: number,
): AppRecord {
  if (record.status !== 'draft')
    throw new Error('Closed counts are read-only.');
  if (![-1, 1].includes(delta)) throw new Error('Invalid adjustment.');
  if (!record.lines.some((l) => l.barcode === code))
    throw new Error('Item not found.');
  return {
    ...record,
    lines: record.lines.map((l) =>
      l.barcode === code
        ? { ...l, observed: integer(l.observed + delta, 'Counted quantity') }
        : l,
    ),
  };
}
export function rename(
  record: AppRecord,
  code: string,
  name: string,
): AppRecord {
  if (record.status !== 'draft')
    throw new Error('Closed counts are read-only.');
  return {
    ...record,
    lines: record.lines.map((l) =>
      l.barcode === code ? { ...l, name: text(name, 'Item name', 100) } : l,
    ),
  };
}
export type LineStatus =
  'matched' | 'short' | 'over' | 'unexpected' | 'uncounted';

/** A line nobody has counted yet is not "short"; it is simply not counted. */
export function lineStatus(line: Line): LineStatus {
  if (line.unexpected) return 'unexpected';
  if (line.observed === line.expected) return 'matched';
  if (line.observed === 0) return 'uncounted';
  return line.observed < line.expected ? 'short' : 'over';
}

/** Words and a signed quantity, so a status never depends on color. */
export function difference(line: Line): string {
  const n = line.observed - line.expected;
  switch (lineStatus(line)) {
    case 'unexpected':
      return `Unexpected · ${line.observed} counted`;
    case 'matched':
      return 'Matched';
    case 'uncounted':
      return 'Not counted yet';
    case 'short':
      return `Short by ${-n}`;
    case 'over':
      return `Over by ${n}`;
  }
}

/** Lines that need a decision before closing: everything except a match. */
export function discrepancies(record: AppRecord): Line[] {
  return record.lines.filter((line) => lineStatus(line) !== 'matched');
}

/** Drafts first (most recently counted on top), then closed by close date. */
export function sessionOrder(records: AppRecord[]): AppRecord[] {
  const time = (r: AppRecord) =>
    r.status === 'draft' ? r.updatedAt : (r.closedAt ?? r.updatedAt);
  return [...records].sort((a, b) =>
    a.status === b.status
      ? time(b).localeCompare(time(a))
      : a.status === 'draft'
        ? -1
        : 1,
  );
}

export function totals(record: AppRecord) {
  return {
    expected: record.lines.reduce((n, l) => n + l.expected, 0),
    observed: record.lines.reduce((n, l) => n + l.observed, 0),
    short: record.lines.filter((l) => l.observed < l.expected).length,
    over: record.lines.filter((l) => !l.unexpected && l.observed > l.expected)
      .length,
    unexpected: record.lines.filter((l) => l.unexpected).length,
    matched: record.lines.filter(
      (l) => !l.unexpected && l.observed === l.expected,
    ).length,
  };
}
export function closeCount(
  record: AppRecord,
  now = new Date().toISOString(),
): AppRecord {
  if (record.status === 'closed')
    throw new Error('This count is already closed.');
  return { ...record, status: 'closed', closedAt: timestamp(now) };
}
export function parseRecord(value: unknown): AppRecord {
  const v = object(value);
  const lines = array(v.lines, parseLine);
  if (
    !lines.length ||
    new Set(lines.map((l) => l.barcode)).size !== lines.length
  )
    throw new Error('Invalid expected list.');
  const r: AppRecord = {
    ...base(v),
    title: text(v.title, 'Count name', 100),
    status: choice(v.status, ['draft', 'closed']),
    closedAt: v.closedAt === null ? null : timestamp(v.closedAt),
    lines,
  };
  if (r.status === 'closed' && !r.closedAt)
    throw new Error('Missing close date.');
  return r;
}
// Ref gate is synchronous: state updates alone cannot stop two native callbacks in one frame.
export class ScanGate {
  private armed = true;
  take() {
    if (!this.armed) return false;
    this.armed = false;
    return true;
  }
  rearm() {
    this.armed = true;
  }
}
