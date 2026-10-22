export function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

/** Returns true for finite numbers strictly between the bounds; excludes both endpoints. */
export function isFiniteNumberBetween(value: number, minimum: number, maximum: number): boolean {
  return Number.isFinite(value) && value > minimum && value < maximum;
}
