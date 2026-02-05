import { isoWeekKey } from '../lib/week';
import { mostRecentWeekAtOrBefore } from '../lib/academic';

type RedirectData = {
  classId: string;
  weeksAsc: string[];
};

function readData(): RedirectData | null {
  const el = document.getElementById('redirect-data');
  if (!el) return null;

  const classId = el.getAttribute('data-class-id');
  const weeksAscStr = el.getAttribute('data-weeks-asc');

  if (!classId || !weeksAscStr) return null;

  try {
    return { classId, weeksAsc: JSON.parse(weeksAscStr) };
  } catch {
    return null;
  }
}

const data = readData();
if (data) {
  const today = isoWeekKey(new Date());
  const target = mostRecentWeekAtOrBefore(data.weeksAsc, today);

  if (target) {
    const url = new URL(window.location.href);
    url.pathname = `/class/${encodeURIComponent(data.classId)}/${encodeURIComponent(target)}/`;
    window.location.replace(url.toString());
  } else {
    const overlay = document.getElementById('messageOverlay');
    if (overlay) {
      overlay.textContent = 'No weeks configured for this class yet.';
      overlay.style.display = 'flex';
    }
  }
}
