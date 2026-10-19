/** Push a conversion event to dataLayer when a tag manager is present. */
export function track(event: string, props: Record<string, string | number> = {}): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...props });
  window.dispatchEvent(new CustomEvent("solarforge:track", { detail: { event, props } }));
}
