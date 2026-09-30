import { createCount, type AppRecord, type Line } from '../src/domain/model';

function withCheckDigit(base: string): string {
  const sum = [...base].reduce(
    (total, c, i) => total + Number(c) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return base + ((10 - (sum % 10)) % 10);
}

/** Six expected items with valid EAN-13 codes in the GS1 restricted range. */
export const expectedLines: Line[] = [
  'Safety gloves',
  'Packing tape',
  'Marker set',
  'Cable ties',
  'Protective eyewear',
  'Storage labels',
].map((name, i) => ({
  name,
  barcode: withCheckDigit(`20000000000${i}`),
  expected: [5, 3, 2, 8, 4, 6][i],
  observed: 0,
  unexpected: false,
}));

export function receivingCount(): AppRecord {
  return createCount('count-1', 'West dock · Receiving', expectedLines);
}
