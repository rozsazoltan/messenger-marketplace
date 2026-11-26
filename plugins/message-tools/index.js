/* Char Counter - community plugin.
   Adds a live character counter in the message composer. */

(() => {
  if (window.__messageToolsStarted) return;
  window.__messageToolsStarted = true;

  const COMPOSER_SELECTOR = '[contenteditable="true"][role="textbox"]';
  const COUNTER_ATTRIBUTE = "data-message-tools-counter";
  const ANCHOR_CLASS = "message-tools-counter-anchor";
  const CLEAR_CLASS = "message-tools-counter-anchor--clear";
  const CLEARANCE_PROPERTY = "--message-tools-counter-clearance";

  let composer = null;
  let counter = null;
  let counterParent = null;
  let measuredKey = "";
  let firstLineLeft = Infinity;
  let firstLineRight = 0;
  let clearanceValue = "";
  let previousClearance = "";
  let previousClearancePriority = "";

  // Only the first line matters: it is the line the count sits in.
  function measureFirstLine(key, top, lineHeight) {
    if (!composer) return;
    if (key === measuredKey) return;
    measuredKey = key;
    firstLineLeft = Infinity;
    firstLineRight = 0;
    const doc = composer.ownerDocument;
    const walker = doc.createTreeWalker(
      composer,
      doc.defaultView.NodeFilter.SHOW_TEXT,
    );
    const range = doc.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.length) continue;
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (Math.abs(rect.top - top) > lineHeight / 2) continue;
        firstLineLeft = Math.min(firstLineLeft, rect.left);
        firstLineRight = Math.max(firstLineRight, rect.right);
      }
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
    if (length === 0) {
      counterParent.classList.remove(CLEAR_CLASS);
      return;
    }

    const counterWidth = counter.offsetWidth;
    const counterHeight = counter.offsetHeight;

    // Decide the clearance from the state without it, so the float cannot feed
    // its own measurement.
    counterParent.classList.remove(CLEAR_CLASS);
    const editorRect = composer.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(composer).lineHeight);
    measureFirstLine(`${editorRect.width}|${text}`, editorRect.top, lineHeight);

    const direction = getComputedStyle(counterParent).direction;
    const clearance = Math.ceil(counterWidth + 4);
    const collides =
      direction === "rtl"
        ? firstLineLeft - clearance < editorRect.left
        : firstLineRight + clearance > editorRect.right;
    counterParent.classList.toggle(CLEAR_CLASS, collides);
    if (clearanceValue !== `${clearance}px`) {
      clearanceValue = `${clearance}px`;
      counterParent.style.setProperty(CLEARANCE_PROPERTY, clearanceValue);
    }

    // The count always sits at the input's end edge, centred on the first line.
    const parentRect = counterParent.getBoundingClientRect();
    const physicalLeft =
      direction === "rtl"
        ? editorRect.left + 2
        : editorRect.right - counterWidth - 2;
    const physicalTop = editorRect.top + (lineHeight - counterHeight) / 2;
    counter.style.insetInlineStart = `${
      direction === "rtl"
        ? parentRect.right - physicalLeft - counterWidth
        : physicalLeft - parentRect.left
    }px`;
    counter.style.insetBlockStart = `${physicalTop - parentRect.top}px`;

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
    counterParent?.classList.remove(ANCHOR_CLASS, CLEAR_CLASS);
    if (counterParent) {
      if (previousClearance) {
        counterParent.style.setProperty(
          CLEARANCE_PROPERTY,
          previousClearance,
          previousClearancePriority,
        );
      } else {
        counterParent.style.removeProperty(CLEARANCE_PROPERTY);
      }
    }
    counter?.remove();
    composer = null;
    counter = null;
    counterParent = null;
    measuredKey = "";
    firstLineLeft = Infinity;
    firstLineRight = 0;
    clearanceValue = "";
    previousClearance = "";
    previousClearancePriority = "";
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
    previousClearance =
      counterParent.style.getPropertyValue(CLEARANCE_PROPERTY);
    previousClearancePriority =
      counterParent.style.getPropertyPriority(CLEARANCE_PROPERTY);
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
