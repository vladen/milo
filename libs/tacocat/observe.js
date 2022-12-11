import Log from './log';
import { createSelectorMatcher } from './utilities';

const log = Log.common.module('observer');

/**
 * @param {MutationObserverInit[]} mutations
 */
const mergeMutations = (mutations) => mutations
  .reduce(
    (options, {
      attributeFilter,
      attributes,
      characterData,
      childList,
      subtree
    } = {}) => {
      if (attributeFilter) {
        options.attributeFilter = (options.attributeFilter ?? []).concat(attributeFilter);
      }
      if (attributes) options.attributes &&= attributes;
      if (characterData) options.characterData &&= characterData;
      if (childList) options.childList &&= childList;
      if (subtree) options.subtree &&= subtree;
      return options;
    },
    {},
  );

/**
 * @param {Node} node
 */
const getElement = (node) => (node instanceof Element ? node : node.parentElement);

/**
 * @param {MutationObserverInit[]} mutations
 * @param {AbortSignal} signal
 * @returns {Tacocat.Internal.Observer}
 */
const Observe = (mutations, signal) => {
  const options = mergeMutations(mutations);
  return (consumer, listeners, scope, selector) => {
    /** @type {Set<() => void>} */
    const disposers = new Set();
    /** @type {Set<Element>} */
    const removed = new Set();
    /** @type {Set<Element>} */
    const updated = new Set();
    let timer = 0;

    const matches = createSelectorMatcher(selector);

    function produce() {
      if (!timer) {
        timer = setTimeout(() => {
          timer = 0;
          if (removed.size || updated.size) {
            const product = (context, element) => ({ context, element, key: '' });
            consumer([
              ...[...removed].map((element) => product(false, element)),
              ...[...updated].map((element) => product(true, element)),
            ]);
            if (removed.size) log.debug('Removed:', { elements: [...removed] });
            removed.clear();
            if (updated.size) log.debug('Updated:', { elements: [...updated] });
            updated.clear();
          }
        });
      }
    }

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const { type } = record;
        switch (type) {
          case 'attributes':
          case 'characterData':
            const element = getElement(record.target);
            if (matches(element)) updated.add(element);
            break;
          case 'childList':
            const { addedNodes, removedNodes } = record;
            [...removedNodes].forEach((node) => {
              const element = getElement(node);
              if (matches(element)) {
                removed.add(element);
                updated.delete(element);
              }
            });
            [...addedNodes].forEach((node) => {
              const element = getElement(node);
              if (matches(element)) {
                removed.delete(element);
                updated.add(element);
                if (listeners.length) {
                  log.debug('Listening:', { element, listeners });
                  listeners.forEach((listener) => disposers.add(listener(element, () => {
                    updated.add(element);
                    produce();
                  })));
                }
              }
            });
            break;
        }
      }

      produce();
    });

    const elements = [scope];
    for (const element of elements) {
      elements.push(...element.children);
      if (matches(element)) updated.add(element);
    }
    produce();

    log.debug('Observing:', { mutations, scope, selector });
    observer.observe(scope, options);
    disposers.add(() => observer.disconnect());
    signal.addEventListener('abort', () => disposers.forEach((disposer) => disposer()));
  };
}

export default Observe;
