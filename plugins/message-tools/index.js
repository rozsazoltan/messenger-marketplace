/* Char Counter - community plugin.
   Adds a live character counter in the message composer. */

(() => {
  if (window.__messageToolsStarted) return;
  window.__messageToolsStarted = true;

  const COMPOSER_SELECTOR = '[contenteditable="true"][role="textbox"]';
  const COUNTER_ATTRIBUTE = "data-message-tools-counter";
  const ANCHOR_CLASS = "message-tools-counter-anchor";

  let composer = null;
  let counter = null;
  let counterParent = null;

  function render() {
    if (!composer || !counter) return;
    const text = composer.textContent ? composer.innerText : "";
    const length = text.replace(/\r?\n/g, " ").length;
    const next = String(length);
    if (counter.textContent !== next) counter.textContent = next;
    const visible = length > 0;
    if (counterParent.classList.contains(ANCHOR_CLASS) !== visible) {
      counterParent.classList.toggle(ANCHOR_CLASS, visible);
    }
    if (!visible) {
      if (!counter.hidden) counter.hidden = true;
      return;
    }

    let firstControl = null;
    for (const child of counterParent.children) {
      if (child.contains(composer)) break;
      firstControl = [...child.querySelectorAll('[role="button"]')].find(
        (control) => {
          const rect = control.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            getComputedStyle(control).visibility !== "hidden"
          );
        },
      );
      if (firstControl) break;
    }
    if (!firstControl) {
      if (!counter.hidden) counter.hidden = true;
      return;
    }
    const controlRect = firstControl.getBoundingClientRect();
    const parentRect = counterParent.getBoundingClientRect();
    const left = (controlRect.left + controlRect.right) / 2 - parentRect.left;
    const blockEnd = parentRect.bottom - controlRect.top + 2;
    if (counter.style.left !== `${left}px`) {
      counter.style.left = `${left}px`;
    }
    if (counter.style.insetBlockEnd !== `${blockEnd}px`) {
      counter.style.insetBlockEnd = `${blockEnd}px`;
    }
    if (counter.hidden) counter.hidden = false;

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
    counterParent?.classList.remove(ANCHOR_CLASS);
    counter?.remove();
    composer = null;
    counter = null;
    counterParent = null;
  }

  function poll() {
    const element = document.querySelector(COMPOSER_SELECTOR);
    const toolbar = element?.closest('[role="region"]');
    if (!toolbar) {
      detach();
      return;
    }
    if (element === composer && counter?.isConnected) {
      render();
      return;
    }

    detach();
    composer = element;
    counterParent = toolbar;
    counter = document.createElement("div");
    counter.setAttribute(COUNTER_ATTRIBUTE, "");
    counter.className = "message-tools-counter";
    counterParent.append(counter);
    composer.addEventListener("input", render);
    render();
  }

  // shortcut: polls the composer every 500ms instead of observing the document, replace with a scoped observer on the thread container when Messenger exposes a stable hook.
  window.setInterval(poll, 500);
  poll();
})();
