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

  function render() {
    if (!composer || !counter) return;
    const text = composer.innerText || composer.textContent || '';
    const length = text.replace(/\r?\n/g, ' ').length;
    const next = `${length} / ${LIMIT}`;
    if (counter.textContent !== next) counter.textContent = next;
    const state = length > LIMIT ? 'over' : 'ok';
    if (counter.dataset.state !== state) counter.dataset.state = state;
  }

  function poll() {
    const element = document.querySelector(COMPOSER_SELECTOR);
    if (!element) {
      if (counter) counter.remove();
      composer = null;
      counter = null;
      return;
    }
    if (element === composer && counter?.isConnected) {
      render();
      return;
    }

    if (counter) counter.remove();
    composer = element;
    counter = document.createElement('div');
    counter.setAttribute(COUNTER_ATTRIBUTE, '');
    counter.className = 'message-tools-counter';
    const region = element.closest('[role="region"]') || element.parentElement;
    if (!region) {
      counter = null;
      return;
    }
    region.append(counter);
    render();
  }

  // shortcut: polls the composer every 500ms instead of observing the document, replace with a scoped observer on the thread container when Messenger exposes a stable hook.
  window.setInterval(poll, 500);
  poll();
})();
