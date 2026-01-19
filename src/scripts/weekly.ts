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

  try {
    return JSON.parse(el.textContent || 'null') as WeeklyPageData;
  } catch {
    return null;
  }
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

if (data) {
  // If the user hits an unpadded week URL (e.g. 2026-W2), redirect to the canonical 2026-W02.
  if (data.weekKeyParam !== data.weekKey) {
    window.location.replace(
      `/class/${encodeURIComponent(data.classId)}/${encodeURIComponent(data.weekKey)}/`,
    );
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
    const old = copyLinkBtn.textContent;
    copyLinkBtn.textContent = 'Copied!';
    window.setTimeout(() => {
      copyLinkBtn.textContent = old;
    }, 1200);
  } catch {
    // Clipboard may be blocked; no-op.
  }
});

function setFullscreen(on: boolean) {
  document.body.classList.toggle('slides-full', on);
  toggleFullBtn?.setAttribute('aria-pressed', on ? 'true' : 'false');
  if (exitFullscreenBtn) exitFullscreenBtn.style.display = on ? 'inline-flex' : 'none';
}

toggleFullBtn?.addEventListener('click', () => {
  const on = !document.body.classList.contains('slides-full');
  setFullscreen(on);
});

exitFullscreenBtn?.addEventListener('click', () => setFullscreen(false));
