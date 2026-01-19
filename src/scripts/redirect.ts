import { isoWeekKey } from '../lib/week';
import { mostRecentWeekAtOrBefore } from '../lib/academic';

type RedirectData = {
  classId: string;
  weeksAsc: string[];
};

function readData(): RedirectData | null {
  const el = document.getElementById('redirect-data');
  if (!el) return null;

  try {
    return JSON.parse(el.textContent || 'null') as RedirectData;
  } catch {
    return null;
  }
}

const data = readData();
if (data) {
  const today = isoWeekKey(new Date());
  const target = mostRecentWeekAtOrBefore(data.weeksAsc, today);

  if (target) {
    window.location.replace(`/class/${encodeURIComponent(data.classId)}/${encodeURIComponent(target)}/`);
  } else {
    const overlay = document.getElementById('messageOverlay');
    if (overlay) {
      overlay.textContent = 'No weeks configured for this class yet.';
      overlay.style.display = 'flex';
    }
  }
}
