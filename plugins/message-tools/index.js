/* Char Counter - community plugin.
   Adds a live character counter in the message composer. */

(() => {
  if (window.__messageToolsStarted) return;
  window.__messageToolsStarted = true;

  const COMPOSER_SELECTOR = '[contenteditable="true"][role="textbox"]';
  const COUNTER_ATTRIBUTE = "data-message-tools-counter";
  const ANCHOR_CLASS = "message-tools-counter-anchor";
  const COMPACT_CLASS = "message-tools-counter-anchor--compact";
  const CLEAR_CLASS = "message-tools-counter-anchor--clear";
  const CLEARANCE_PROPERTY = "--message-tools-counter-clearance";

  let composer = null;
  let counter = null;
  let counterParent = null;
  let measuredKey = "";
  let inkLeft = Infinity;
  let inkRight = 0;
  let clearanceValue = "";
  let previousClearance = "";
  let previousClearancePriority = "";

  function measureText(key) {
    if (!composer) return;
    if (key === measuredKey) return;
    measuredKey = key;
    inkLeft = Infinity;
    inkRight = 0;
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
        inkLeft = Math.min(inkLeft, rect.left);
        inkRight = Math.max(inkRight, rect.right);
      }
    }
  }

  function emojiWrapper(capsule) {
    if (!capsule) return null;
    return (
      [...capsule.children].find(
        (child) =>
          child !== composer.parentElement &&
          child.querySelector('[role="button"] svg'),
      ) ?? null
    );
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
      counterParent.classList.remove(COMPACT_CLASS, CLEAR_CLASS);
      return;
    }

    counter.style.transform = "";
    const counterWidth = counter.offsetWidth;
    const counterHeight = counter.offsetHeight;

    // Decide the mode and the clearance from native geometry only. The
    // clearance pads the editor, so measuring with it applied would feed back.
    counterParent.classList.remove(COMPACT_CLASS, CLEAR_CLASS);
    const nativeRect = composer.getBoundingClientRect();
    const lineHeight = Number.parseFloat(getComputedStyle(composer).lineHeight);
    const compact = nativeRect.height <= lineHeight + 1;
    counterParent.classList.toggle(COMPACT_CLASS, compact);

    measureText(`${nativeRect.width}|${text}`);
    const direction = getComputedStyle(counterParent).direction;
    const clearance = Math.ceil(counterWidth + 4);
    const collides =
      direction === "rtl"
        ? inkLeft - clearance < nativeRect.left
        : inkRight + clearance > nativeRect.right;
    const clearText =
      compact && collides && nativeRect.width - clearance > clearance;
    counterParent.classList.toggle(CLEAR_CLASS, clearText);
    if (clearanceValue !== `${clearance}px`) {
      clearanceValue = `${clearance}px`;
      counterParent.style.setProperty(CLEARANCE_PROPERTY, clearanceValue);
    }

    // Place against what is actually rendered, including the compact pad.
    const parentRect = counterParent.getBoundingClientRect();
    const editorRect = composer.getBoundingClientRect();
    const emojiRect = emojiWrapper(
      composer.parentElement?.parentElement,
    )?.getBoundingClientRect();
    counter.hidden = true;

    if (compact) {
      const physicalLeft =
        direction === "rtl"
          ? editorRect.left + 2
          : editorRect.right - counterWidth - 2;
      const physicalTop =
        (emojiRect
          ? (emojiRect.top + emojiRect.bottom) / 2
          : editorRect.top + lineHeight / 2) -
        counterHeight / 2;
      counter.style.insetInlineStart = `${
        direction === "rtl"
          ? parentRect.right - physicalLeft - counterWidth
          : physicalLeft - parentRect.left
      }px`;
      counter.style.insetBlockStart = `${physicalTop - parentRect.top}px`;
    } else {
      const capsuleRect =
        composer.parentElement?.parentElement?.getBoundingClientRect();
      const top = emojiRect
        ? Math.max(emojiRect.top, capsuleRect?.top ?? emojiRect.top) -
          counterHeight -
          1
        : editorRect.top;
      const center = emojiRect
        ? (emojiRect.left + emojiRect.right) / 2
        : editorRect.right;
      if (emojiRect && counterWidth > emojiRect.width) {
        counter.style.transform = `scaleX(${emojiRect.width / counterWidth})`;
      }
      const physicalLeft = center - counterWidth / 2;
      counter.style.insetInlineStart = `${
        direction === "rtl"
          ? parentRect.right - physicalLeft - counterWidth
          : physicalLeft - parentRect.left
      }px`;
      counter.style.insetBlockStart = `${top - parentRect.top}px`;
    }
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
    counterParent?.classList.remove(ANCHOR_CLASS, COMPACT_CLASS, CLEAR_CLASS);
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
    inkLeft = Infinity;
    inkRight = 0;
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
