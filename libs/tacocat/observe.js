import Log from './log.js';
import { createSelectorMatcher, getMatchingSelfOrParent } from './utilities.js';

const log = Log.common.module('observer');

/**
 * @param {Tacocat.Controls} controls
 * @param {Tacocat.Internal.Reactions} reactions
 * @returns {Tacocat.Internal.SafeObserver}
 */
const Observe = ({ signal }, { listeners, mutations }) => (consumer, { scope, selector }) => {
  /** @type {Set<() => void>} */
  const disposers = new Set();
  /** @type {Set<Element>} */
  const removed = new Set();
  /** @type {Set<Element>} */
  const updated = new Set();
  let timer;

  const matcher = createSelectorMatcher(selector);

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
      }, 0);
    }
  }

  const observer = new MutationObserver((records) => records.forEach((record) => {
    const { type } = record;
    if (type === 'attributes' || type === 'characterData') {
      const element = getMatchingSelfOrParent(record.target, matcher);
      if (element) updated.add(element);
    } else if (type === 'childList') {
      const { addedNodes, removedNodes } = record;
      [...removedNodes].forEach((node) => {
        const element = getMatchingSelfOrParent(node, matcher);
        if (element) {
          removed.add(element);
          updated.delete(element);
        }
      });
      [...addedNodes].forEach((node) => {
        const element = getMatchingSelfOrParent(node, matcher);
        if (element) {
          removed.delete(element);
          updated.add(element);
          if (listeners.length) {
            log.debug('Listening:', { element, listeners });
            listeners.forEach((listener) => {
              const disposer = listener(
                element,
                () => {
                  updated.add(element);
                  produce();
                },
              );
              disposers.add(disposer);
            });
          }
        }
      });
    }

    produce();
  }));

  if (!signal.aborted) {
    log.debug('Observing:', { listeners, mutations, scope, selector });

    const elements = [scope];
    elements.forEach((element) => {
      elements.push(...element.children);
      if (matcher(element)) updated.add(element);
    });
    produce();
    observer.observe(scope, mutations);

    disposers.add(() => observer.disconnect());
    signal.addEventListener(
      'abort',
      () => disposers.forEach((disposer) => disposer()),
    );
  }
};

export default Observe;
