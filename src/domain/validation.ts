export interface BaseRecord {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Stored data is not a valid record.');
  return value as Record<string, unknown>;
}
export function text(
  value: unknown,
  label: string,
  max = 200,
  allowEmpty = false,
): string {
  if (
    typeof value !== 'string' ||
    (!allowEmpty && !value.trim()) ||
    value.length > max
  )
    throw new Error(
      `${label} must be ${allowEmpty ? 'at most' : 'between 1 and'} ${max} characters.`,
    );
  return value.trim();
}
export function integer(
  value: unknown,
  label: string,
  min = 0,
  max = 999999,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new Error(`${label} must be a whole number from ${min} to ${max}.`);
  return value;
}
export function choice<T extends string>(
  value: unknown,
  choices: readonly T[],
): T {
  if (typeof value !== 'string' || !choices.includes(value as T))
    throw new Error('Stored data contains an unsupported value.');
  return value as T;
}
export function timestamp(value: unknown): string {
  const result = text(value, 'Date', 40);
  if (!Number.isFinite(Date.parse(result))) throw new Error('Invalid date.');
  return result;
}
export function base(value: Record<string, unknown>): BaseRecord {
  return {
    id: text(value.id, 'ID', 100),
    revision: integer(value.revision, 'Revision', 1),
    createdAt: timestamp(value.createdAt),
    updatedAt: timestamp(value.updatedAt),
  };
}
export function array<T>(
  value: unknown,
  parse: (item: unknown) => T,
  max = 500,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error('Invalid list.');
  return value.map(parse);
}
export function message(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';
}
