import { slideEmbedUrl, slideOpenUrl } from '../lib/slides';

type WeeklyPageData = {
  classId: string;
  weekKey: string;
  weekKeyParam: string;
  slideId: string | null;
  isSkipWeek: boolean;
};

function readData(): WeeklyPageData | null {
  const el = document.getElementById('weekly-data');
  if (!el) return null;

  const classId = el.getAttribute('data-class-id');
  const weekKey = el.getAttribute('data-week-key');
  const weekKeyParam = el.getAttribute('data-week-key-param');
  const slideId = el.getAttribute('data-slide-id');
  const isSkipWeek = el.getAttribute('data-is-skip-week') === 'true';

  if (!classId || !weekKey || !weekKeyParam) return null;

  return {
    classId,
    weekKey,
    weekKeyParam,
    slideId: slideId || null,
    isSkipWeek,
  };
}

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}

const data = readData();

const overlay = $('messageOverlay') as HTMLDivElement | null;
const slidesFrame = $('slidesFrame') as HTMLIFrameElement | null;
const openInNewTab = $('openInNewTab') as HTMLAnchorElement | null;
const copyLinkBtn = $('copyLinkBtn') as HTMLButtonElement | null;
const classSelect = $('classSelect') as HTMLSelectElement | null;
const weekSelect = $('weekSelect') as HTMLSelectElement | null;
const toggleFullBtn = $('toggleFullBtn') as HTMLButtonElement | null;
const exitFullscreenBtn = $('exitFullscreenBtn') as HTMLButtonElement | null;

const CLASS_ORDER = [
  'cs-1-pathway',
  'cs-2',
  'cs-3',
  'cs-4',
  'mythology',
  'cs-1-semester',
];

function ensureWeekVisible() {
  const container = document.querySelector('.week-nav') as HTMLElement | null;
  const active = document.querySelector('.week-chip.active') as HTMLElement | null;
  if (!container || !active) return;

  const cRect = container.getBoundingClientRect();
  const aRect = active.getBoundingClientRect();

  if (aRect.right > cRect.right - 4) {
    container.scrollLeft += aRect.right - cRect.right + 4;
  } else if (aRect.left < cRect.left + 4) {
    container.scrollLeft -= cRect.left - aRect.left + 4;
  }
}

requestAnimationFrame(() => {
  ensureWeekVisible();
});

if (data) {
  // If the user hits an unpadded week URL (e.g. 2026-W2), redirect to the canonical 2026-W02.
  if (data.weekKeyParam !== data.weekKey) {
    const url = new URL(window.location.href);
    url.pathname = `/class/${encodeURIComponent(data.classId)}/${encodeURIComponent(data.weekKey)}/`;
    window.location.replace(url.toString());
  }

  classSelect?.addEventListener('change', () => {
    const nextClass = classSelect.value;
    window.location.href = `/class/${encodeURIComponent(nextClass)}/`;
  });

  weekSelect?.addEventListener('change', () => {
    const nextWeek = weekSelect.value;
    window.location.href = `/class/${encodeURIComponent(data.classId)}/${encodeURIComponent(nextWeek)}/`;
  });

  if (data.slideId && !data.isSkipWeek) {
    if (slidesFrame) slidesFrame.src = slideEmbedUrl(data.slideId);
    if (openInNewTab) openInNewTab.href = slideOpenUrl(data.slideId);
    if (overlay) overlay.style.display = 'none';
  } else {
    if (openInNewTab) {
      openInNewTab.removeAttribute('href');
      openInNewTab.setAttribute('aria-disabled', 'true');
      openInNewTab.setAttribute('tabindex', '-1');
    }

    if (slidesFrame) slidesFrame.removeAttribute('src');
    if (overlay) overlay.style.display = 'flex';
  }
}

copyLinkBtn?.addEventListener('click', async () => {
  const text = window.location.href;
  try {
    await navigator.clipboard.writeText(text);
    const oldContent = copyLinkBtn.innerHTML;
    const oldTitle = copyLinkBtn.getAttribute('title');
    copyLinkBtn.innerHTML = '✓';
    copyLinkBtn.setAttribute('title', 'Copied!');
    window.setTimeout(() => {
      copyLinkBtn!.innerHTML = oldContent;
      if (oldTitle) copyLinkBtn!.setAttribute('title', oldTitle);
    }, 1200);
  } catch {
    // Clipboard may be blocked; no-op.
  }
});

function setFullscreen(on: boolean) {
  document.body.classList.toggle('slides-full', on);
  toggleFullBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (exitFullscreenBtn) exitFullscreenBtn.style.display = on ? 'inline-flex' : 'none';

  // Update URL to persist fullscreen state
  if (on) {
    const url = new URL(window.location.href);
    url.searchParams.set('fullscreen', 'true');
    window.history.replaceState({}, '', url);
  } else {
    const url = new URL(window.location.href);
    url.searchParams.delete('fullscreen');
    window.history.replaceState({}, '', url);
  }
}

// Check URL for fullscreen param on load
if (new URLSearchParams(window.location.search).get('fullscreen') === 'true') {
  setFullscreen(true);
}

toggleFullBtn?.addEventListener('click', () => {
  const on = !document.body.classList.contains('slides-full');
  setFullscreen(on);
});

exitFullscreenBtn?.addEventListener('click', () => setFullscreen(false));

function handleFullscreenKeys(e: KeyboardEvent) {
  if (!document.body.classList.contains('slides-full')) return;
  if (e.key === 'Escape') {
    e.preventDefault();
    setFullscreen(false);
    return;
  }

  const target = e.target as HTMLElement;
  if (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  ) {
    return;
  }

  const key = e.key;
  const idx = parseInt(key, 10);
  if (idx >= 1 && idx <= 6) {
    e.preventDefault();
    const classId = CLASS_ORDER[idx - 1];
    if (classId) {
      // Include fullscreen param to stay in fullscreen mode on new page
      const url = new URL(window.location.origin + `/class/${classId}/`);
      url.searchParams.set('fullscreen', 'true');
      window.location.href = url.toString();
    }
  }
}

// Use both window and document capture for iframe keyboard events
window.addEventListener('keydown', handleFullscreenKeys, true);
document.addEventListener('keydown', handleFullscreenKeys, true);
