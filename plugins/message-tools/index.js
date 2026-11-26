/* Char Counter - community plugin.
   Adds a live character counter in the message composer. */

(() => {
  if (window.__messageToolsStarted) return;
  window.__messageToolsStarted = true;

  const COMPOSER_SELECTOR = '[contenteditable="true"][role="textbox"]';
  const COUNTER_ATTRIBUTE = "data-message-tools-counter";
  const ANCHOR_CLASS = "message-tools-counter-anchor";
  const SCROLL_PROPERTY = "--message-tools-counter-scroll";

  let composer = null;
  let counter = null;
  let counterParent = null;
  let previousScrollValue = "";
  let previousScrollPriority = "";

  function syncScroll() {
    if (!composer || !counterParent) return;
    const value = `${composer.scrollTop}px`;
    if (counterParent.style.getPropertyValue(SCROLL_PROPERTY) !== value) {
      counterParent.style.setProperty(SCROLL_PROPERTY, value);
    }
  }

  function render() {
    if (!composer || !counter) return;
    const text = composer.textContent ? composer.innerText : "";
    const length = text.replace(/\r?\n/g, " ").length;
    const next = String(length);
    if (counter.textContent !== next) counter.textContent = next;
    counter.hidden = length === 0;
    counterParent.classList.toggle(ANCHOR_CLASS, length > 0);
    syncScroll();
    // Only Messenger's explicit maximum is authoritative, not a plugin default.
    const limit = Number(composer.getAttribute("maxlength"));
    const state =
      Number.isSafeInteger(limit) && limit > 0 && length >= limit
        ? "over"
        : "ok";
    if (counter.dataset.state !== state) counter.dataset.state = state;
  }

  function detach() {
    composer?.removeEventListener("input", render);
    composer?.removeEventListener("scroll", syncScroll);
    counterParent?.classList.remove(ANCHOR_CLASS);
    if (counterParent) {
      if (previousScrollValue) {
        counterParent.style.setProperty(
          SCROLL_PROPERTY,
          previousScrollValue,
          previousScrollPriority,
        );
      } else {
        counterParent.style.removeProperty(SCROLL_PROPERTY);
      }
    }
    counter?.remove();
    composer = null;
    counter = null;
    counterParent = null;
    previousScrollValue = "";
    previousScrollPriority = "";
  }

  function poll() {
    const element = document.querySelector(COMPOSER_SELECTOR);
    if (!element?.parentElement) {
      detach();
      return;
    }
    if (element === composer && counter?.isConnected) {
      render();
      return;
    }

    detach();
    composer = element;
    counterParent = element.parentElement;
    previousScrollValue = counterParent.style.getPropertyValue(SCROLL_PROPERTY);
    previousScrollPriority =
      counterParent.style.getPropertyPriority(SCROLL_PROPERTY);
    counter = document.createElement("div");
    counter.setAttribute(COUNTER_ATTRIBUTE, "");
    counter.className = "message-tools-counter";
    counterParent.append(counter);
    composer.addEventListener("input", render);
    composer.addEventListener("scroll", syncScroll, { passive: true });
    render();
  }

  // shortcut: polls the composer every 500ms instead of observing the document, replace with a scoped observer on the thread container when Messenger exposes a stable hook.
  window.setInterval(poll, 500);
  poll();
})();
