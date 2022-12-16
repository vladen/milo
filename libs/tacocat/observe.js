import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction } from './utilities.js';

const log = Log.common.module('observer');

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Listener[]} listeners
 * @param {Tacocat.Internal.Mutations} mutations
 * @returns {Tacocat.Internal.SafeObserver}
 */
const Observe = (control, listeners, mutations) => (consumer, { matcher, scope, selector }) => {
  /** @type {Set<Element>} */
  const listening = new Set();
  /** @type {Set<Element>} */
  const removed = new Set();
  /** @type {Set<Element>} */
  const updated = new Set();
  let timer;
  /**
   * @param {Node} node
   * @returns {Element | undefined}
   */
  function match(node) {
    const element = node instanceof Element
      ? node
      : node.parentElement;
    if (element) {
      if (matcher(element)) return element;
      if (mutations.subtree) {
        const closest = element.closest(selector);
        if (closest?.compareDocumentPosition(scope) === Node.DOCUMENT_POSITION_CONTAINS) {
          return closest;
        }
      }
    }
    return undefined;
  }

  function produce() {
    if (!timer) {
      timer = setTimeout(() => {
        timer = 0;
        if (removed.size || updated.size) {
          const placeholders = [
            ...[...removed].map((element) => ({ context: null, element })),
            ...[...updated].map((element) => ({ context: {}, element })),
          ];
          if (removed.size) {
            log.debug('Removed:', { elements: [...removed] });
            removed.clear();
          }
          if (updated.size) {
            log.debug('Updated:', { elements: [...updated] });
            updated.clear();
          }
          consumer(placeholders);
        }
      }, 0);
    }
  }

  function remove(element) {
    if (!element) return;

    control.dismiss(element);
    removed.add(element);
    updated.delete(element);
  }

  function update(element) {
    if (!element) return;

    removed.delete(element);
    updated.add(element);

    if (listeners.length && !listening.has(element)) {
      const listen = () => {
        updated.add(element);
        produce();
      };
      listeners.forEach((listener) => {
        const disposer = safeSync(log, 'Listener callback error:', () => listener(element, listen));
        if (isFunction(disposer)) {
          control.dispose(disposer, element);
        } else {
          log.error('Listener callback must return a function:', { listener });
        }
      });
      log.debug('Listening:', { element, listeners });
      listening.add(element);
    }
  }

  const observer = new MutationObserver((records) => records.forEach((record) => {
    const { type } = record;
    if (type === 'attributes' || type === 'characterData') {
      const element = match(record.target);
      if (element) updated.add(element);
    } else if (type === 'childList') {
      const { addedNodes, removedNodes } = record;
      [...removedNodes].forEach((node) => {
        remove(match(node));
      });
      [...addedNodes].forEach((node) => {
        update(match(node));
      });
    }

    produce();
  }));

  if (!control.signal?.aborted) {
    const elements = [scope];
    let index = 0;
    while (index < elements.length) {
      const element = elements[index];
      if (mutations.childList) elements.push(...element.children);
      update(match(element));
      index += 1;
    }
    produce();

    observer.observe(scope, mutations);
    control.dispose(() => {
      observer.disconnect();
    });
    log.debug('Observing:', { listeners, mutations, scope, selector });
  }
};

export default Observe;
