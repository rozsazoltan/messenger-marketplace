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

  function readLength() {
    if (!composer) return 0;
    const text = composer.innerText || composer.textContent || '';
    return text.replace(/\r?\n/g, ' ').length;
  }

  function render() {
    if (!counter) return;
    const length = readLength();
    counter.textContent = `${length} / ${LIMIT}`;
    counter.dataset.state = length > LIMIT ? 'over' : 'ok';
  }

  function attach() {
    const element = document.querySelector(COMPOSER_SELECTOR);
    if (!element) return;
    if (element === composer) {
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

  const observer = new MutationObserver(() => attach());
  observer.observe(document.body, { childList: true, subtree: true });
  attach();
})();
