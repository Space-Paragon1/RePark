// Plate text helpers. The backend stores plates uppercase with no spaces or
// hyphens, 2–10 characters (backend/app/schemas/vehicles.py). Same as web/lib/plate.ts.

/** What the plate input shows: uppercase letters and numbers, at most one space. */
export function formatPlateInput(raw: string): string {
  let v = raw.toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/^ +/, '').replace(/ +/g, ' ');
  const space = v.indexOf(' ');
  if (space !== -1) v = v.slice(0, space + 1) + v.slice(space + 1).replace(/ /g, '');
  return v.slice(0, 11);
}

/** What gets sent: no spaces. */
export function plateForSubmit(value: string): string {
  return value.replace(/\s/g, '');
}

export function isPlateValid(value: string): boolean {
  const plate = plateForSubmit(value);
  return plate.length >= 2 && plate.length <= 10;
}
