const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Strict UUID v4-style check (any version actually), case-insensitive.
export const isValidUuid = (value: string): boolean => UUID_RE.test(value);
