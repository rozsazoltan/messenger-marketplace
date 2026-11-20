/* Message Tools - sample community plugin.
   Adds a live character counter under the message composer. */

(() => {
  if (window.__messageToolsStarted) return;
  window.__messageToolsStarted = true;

  const COMPOSER_SELECTOR = '[contenteditable="true"][role="textbox"]';
  const COUNTER_ATTRIBUTE = 'data-message-tools-counter';
  const LIMIT = 2000;

  let composer = null;
  let counter = null;
  let scheduled = false;

  function readLength() {
    if (!composer) return 0;
    const text = composer.innerText || composer.textContent || '';
    return text.replace(/\r?\n/g, ' ').length;
  }

  function render() {
    if (!counter) return;
    const length = readLength();
    // Only write when the value changes: assigning textContent replaces the
    // text node, which would otherwise feed the observer below forever.
    const next = `${length} / ${LIMIT}`;
    if (counter.textContent !== next) counter.textContent = next;
    const state = length > LIMIT ? 'over' : 'ok';
    if (counter.dataset.state !== state) counter.dataset.state = state;
  }

  function attach() {
    const element = document.querySelector(COMPOSER_SELECTOR);
    if (!element) {
      // The composer only exists while a thread is open. Nothing to do: the
      // observer re-runs attach() when one appears.
      if (composer && !composer.isConnected) {
        if (counter && counter.isConnected) counter.remove();
        composer = null;
        counter = null;
      }
      return;
    }
    if (element === composer && counter && counter.isConnected) {
      render();
      return;
    }

    if (composer) composer.removeEventListener('input', render);
    if (counter && counter.isConnected) counter.remove();

    composer = element;
    counter = document.createElement('div');
    counter.setAttribute(COUNTER_ATTRIBUTE, '');
    counter.className = 'message-tools-counter';

    const region = element.closest('[role="region"]') || element.parentElement;
    if (!region) return;

    region.append(counter);
    element.addEventListener('input', render);
    render();
  }

  // Coalesce bursts into one pass per animation frame, and ignore the mutations
  // this plugin causes itself.
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      attach();
    });
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (counter && record.target instanceof Node && counter.contains(record.target)) continue;
      schedule();
      return;
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  attach();
})();
