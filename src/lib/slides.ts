export function getCurrentDayOfWeek(date = new Date()): number {
  // Returns 0 for Monday, 1 for Tuesday, ..., 6 for Sunday
  const jsDay = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 6 : jsDay - 1;
}

export function slideEmbedUrl(id: string, date = new Date()): string {
  const enc = encodeURIComponent(id);
  const startSlide = getCurrentDayOfWeek(date);
  return `https://docs.google.com/presentation/d/${enc}/embed?start=false&loop=false&delayms=3000&slide=id.p${startSlide}`;
}

export function slideOpenUrl(id: string): string {
  const enc = encodeURIComponent(id);
  return `https://docs.google.com/presentation/d/${enc}/edit?usp=sharing`;
}
