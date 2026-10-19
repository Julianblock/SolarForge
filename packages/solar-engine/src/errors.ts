export class SolarInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolarInputError";
  }
}

export function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new SolarInputError(`${label} must be a finite number.`);
  }
}

export function assertRange(value: number, label: string, min: number, max: number): void {
  assertFinite(value, label);
  if (value < min || value > max) {
    throw new SolarInputError(`${label} must be between ${min} and ${max}. Received ${value}.`);
  }
}
