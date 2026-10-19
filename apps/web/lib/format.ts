export function kwh(value: number, digits = 0): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: digits })} kWh`;
}

export function kw(value: number, digits = 2): string {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: digits })} kW`;
}

export function usd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function deg(value: number): string {
  return `${Math.round(value)}°`;
}

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
