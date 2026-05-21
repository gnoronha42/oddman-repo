const STORAGE_KEY_VISITOR = 'oddman_newsletter_modal_seen_ever';
const STORAGE_KEY_SESSION = 'oddman_newsletter_modal_dismissed_session';
const STORAGE_KEY_DAY = 'oddman_newsletter_modal_dismissed_day';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function safeGet(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function hasSeenEver() {
  return safeGet(localStorage, STORAGE_KEY_VISITOR) === '1';
}

function markSeenEver() {
  safeSet(localStorage, STORAGE_KEY_VISITOR, '1');
}

function hasDismissedForDay() {
  return safeGet(localStorage, STORAGE_KEY_DAY) === getTodayKey();
}

function setDismissedForDay() {
  safeSet(localStorage, STORAGE_KEY_DAY, getTodayKey());
}

function hasDismissedForSession() {
  return safeGet(sessionStorage, STORAGE_KEY_SESSION) === '1';
}

function setDismissedForSession() {
  safeSet(sessionStorage, STORAGE_KEY_SESSION, '1');
}

function shouldAutoOpen(modalEl) {
  if (!modalEl) return false;
  if (modalEl.dataset.disableAutoOpen === 'true') return false;

  const frequency = modalEl.dataset.frequency || 'once_per_visitor';
  if (frequency === 'every_visit') return true;
  if (frequency === 'once_per_visitor') return !hasSeenEver();
  if (frequency === 'once_per_day') return !hasDismissedForDay();
  return !hasDismissedForSession(); // once_per_session
}

function markSeenNow(modalEl) {
  const frequency = modalEl?.dataset.frequency || 'once_per_visitor';
  if (frequency === 'every_visit') return;
  if (frequency === 'once_per_visitor') markSeenEver();
  else if (frequency === 'once_per_day') setDismissedForDay();
  else setDismissedForSession();
}

async function openModalWhenReady(modalEl) {
  try {
    if (window.customElements && typeof customElements.whenDefined === 'function') {
      await customElements.whenDefined('dialog-component');
    }
  } catch {
    /* ignore */
  }

  const tryOpen = (attempt = 0) => {
    try {
      if (typeof modalEl.showDialog === 'function') {
        modalEl.showDialog();
        markSeenNow(modalEl);
        return;
      }
    } catch {
      /* ignore */
    }

    if (attempt < 20) {
      setTimeout(() => tryOpen(attempt + 1), 150);
    }
  };

  tryOpen();
}

function initNewsletterModal() {
  const modalEl = document.querySelector('#newsletter-modal');
  if (!modalEl) return;

  if (!shouldAutoOpen(modalEl)) return;

  setTimeout(() => openModalWhenReady(modalEl), 400);

  modalEl.addEventListener('dialog:close', () => markSeenNow(modalEl));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNewsletterModal);
} else {
  initNewsletterModal();
}
