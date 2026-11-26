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
    counter.hidden = length === 0;
    counterParent.classList.toggle(ANCHOR_CLASS, length > 0);
    if (length === 0) return;

    counter.style.transform = "";
    const counterWidth = counter.offsetWidth;
    const counterHeight = counter.offsetHeight;
    counter.hidden = true;
    const parentRect = counterParent.getBoundingClientRect();
    const editorRect = composer.getBoundingClientRect();
    const capsule = composer.parentElement?.parentElement;
    const emoji = [...(capsule?.children ?? [])].find(
      (child) =>
        child !== composer.parentElement &&
        child.querySelector('[role="button"] svg'),
    );
    const emojiRect = emoji?.getBoundingClientRect();
    if (emojiRect && counterWidth > emojiRect.width) {
      counter.style.transform = `scaleX(${emojiRect.width / counterWidth})`;
    }
    const direction = getComputedStyle(counterParent).direction;
    let physicalLeft;
    let top;

    if (emojiRect) {
      const center = (emojiRect.left + emojiRect.right) / 2;
      physicalLeft = center - counterWidth / 2;
      top = emojiRect.top - parentRect.top - counterHeight - 1;
    } else if (direction === "rtl") {
      physicalLeft = (emojiRect?.right ?? editorRect.left) + 5;
      top = editorRect.top - parentRect.top + 1;
    } else {
      const right =
        Math.min(editorRect.right, emojiRect?.left ?? editorRect.right) - 5;
      physicalLeft = right - counterWidth;
      top = editorRect.top - parentRect.top + 1;
    }

    const left =
      direction === "rtl"
        ? parentRect.right - physicalLeft - counterWidth
        : physicalLeft - parentRect.left;
    counter.style.insetInlineStart = `${left}px`;
    counter.style.insetBlockStart = `${top}px`;
    counter.hidden = false;
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
