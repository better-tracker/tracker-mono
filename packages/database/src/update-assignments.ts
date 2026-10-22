/** Column names come from repository-owned mappings; only values come from updates. */
export function buildUpdateAssignments<T extends object>(
  updates: T,
  columns: Readonly<Record<keyof T, string>>,
): { fields: string[]; values: unknown[] } {
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const key of Object.keys(columns) as (keyof T)[]) {
    const value = updates[key];
    if (value === undefined) continue;

    values.push(value);
    fields.push(`${columns[key]} = $${values.length}`);
  }

  return { fields, values };
}
