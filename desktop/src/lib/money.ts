export function koboToNaira(kobo: number): number {
  return Math.round(kobo / 100);
}

export function formatKobo(kobo: number): string {
  const naira = koboToNaira(kobo);
  return `₦${naira.toLocaleString('en-NG')}`;
}
