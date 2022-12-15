import { dispose } from './control.js';
import Log from './log.js';
import { createSelectorMatcher } from './utilities.js';

const log = Log.common.module('observer');

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Reactions} reactions
 * @returns {Tacocat.Internal.SafeObserver}
 */
const Observe = (control, { listeners, mutations }) => (consumer, { scope, selector }) => {
  /** @type {Map<Element, (() => void)[]>} */
  const listening = new Map();
  /** @type {Set<Element>} */
  const removed = new Set();
  /** @type {Set<Element>} */
  const updated = new Set();
  let timer;

  const matcher = createSelectorMatcher(selector);
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
      if (mutations.subtree) return element.closest(selector);
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

  const observer = new MutationObserver((records) => records.forEach((record) => {
    const { type } = record;
    if (type === 'attributes' || type === 'characterData') {
      const element = match(record.target);
      if (element) updated.add(element);
    } else if (type === 'childList') {
      const { addedNodes, removedNodes } = record;

      [...removedNodes].forEach((node) => {
        const element = match(node);
        if (element) {
          listening.get(element)?.forEach(dispose);
          removed.add(element);
          updated.delete(element);
        }
      });

      [...addedNodes].forEach((node) => {
        const element = match(node);
        if (element) {
          removed.delete(element);
          updated.add(element);

          if (listeners.length && !listening.has(element)) {
            const disposers = listeners.map((listener) => listener(element, () => {
              updated.add(element);
              produce();
            }));
            log.debug('Listening:', { element, listeners });
            listening.set(element, disposers);
          }
        }
      });
    }

    produce();
  }));

  if (!control.signal.aborted) {
    log.debug('Observing:', { listeners, mutations, scope, selector });

    const elements = [scope];
    elements.forEach((element) => {
      elements.push(...element.children);
      if (matcher(element)) updated.add(element);
    });
    produce();

    observer.observe(scope, mutations);
    control.dispose(() => observer.disconnect());
  }
};

export default Observe;
