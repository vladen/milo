import { getContextKey } from './context.js';
import Log from './log.js';
import Process from './process.js';
import { createSelectorMatcher } from './utilities.js';

const log = Log.common.module('engine');

/**
 * @param {(element: Element) => boolean} matcher
 * @param {Map<Element, Tacocat.Internal.Placeholder>} placeholders
 * @param {Element} scope
 */
function exploreScope(matcher, placeholders, scope) {
  const elements = [scope, ...scope.children];
  const results = [];
  elements.forEach((element) => {
    if (matcher(element)) {
      const placeholder = placeholders.get(element);
      if (placeholder) results.push({ ...placeholder });
    }
  });
  return results;
}

/**
 * @param {Map<string, Tacocat.Internal.Placeholder[]>} pending
 * @param {(Tacocat.Internal.Failure | Tacocat.Internal.Product)[]} products
 * @param {Tacocat.Internal.Renderer} renderer
 */
function renderRejected(pending, products, renderer) {
  [...pending.values()].forEach((placeholders) => {
    placeholders.forEach((placeholder) => {
      const { element, key } = placeholder;
      const product = products.find((candidate) => key === candidate.key);
      placeholder.value = undefined;
      log.debug('Rejected:', { context, element, product });
      renderer(element, { context });
    });
  });
}

/**
 *
 * @param {Map<string, Tacocat.Internal.Placeholder[]>} pending
 * @param {Tacocat.Internal.Product} product
 * @param {Tacocat.Internal.Renderer} renderer
 * @returns
 */
function renderResolved(pending, product, renderer) {
  const { key, value } = product;
  const placeholders = pending.get(key);
  pending.delete(key);
  if (placeholders) {
    placeholders.forEach((placeholder) => {
      placeholder.value = value;
      const { context, element } = placeholder;
      log.debug('Resolved:', { context, element, value });
      renderer(element, { context, value });
    });
  }
  return product;
}

/**
 * @param {Map<string, Tacocat.Internal.Placeholder[]>} pending
 * @param {Tacocat.Internal.Results} results
 * @param {Tacocat.Internal.Renderer} renderer
 * @param {AbortSignal} signal
 * @param {number} timeout
 */
function renderResults(pending, results, renderer, signal, timeout) {
  const timer = setTimeout(() => renderRejected(pending, [], renderer), timeout);
  signal.addEventListener('abort', () => clearTimeout(timer));

  Process(
    log,
    (products) => renderRejected(pending, products, renderer),
    results,
    (product) => renderResolved(pending, product, renderer),
  );
}

/**
 * @param {Tacocat.Internal.Extractor} extractor
 * @param {Map<Element, Tacocat.Internal.Placeholder>} placeholders
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Renderer} renderer
 * @param {Tacocat.Internal.Placeholder[]} selected
 * @param {AbortSignal} signal
 * @param {number} timeout
 */
function processPlaceholders(
  extractor,
  placeholders,
  provider,
  renderer,
  selected,
  signal,
  timeout,
) {
  const contexts = [];
  /** @type {Map<string, Tacocat.Internal.Placeholder[]>} */
  const pending = new Map();
  selected.forEach((placeholder) => {
    const { element, key, value } = placeholder;
    let { context } = placeholder;
    if (context !== false) context = extractor(context, element);
    if (context === false) {
      log.debug('Disposed:', { context, element, value });
      placeholders.delete(element);
    } else {
      const existing = placeholders.get(element)?.context;
      if (existing) {
        if (existing === key) return;
      } else placeholders.set(element, placeholder);
      placeholders.get(element).context = context;
      contexts.push(context);
      if (pending.has(key)) pending.get(key).push(placeholder);
      else pending.set(key, [placeholder]);
      log.debug('Pending:', { context, element });
      renderer(element);
    }
  });
  renderResults(pending, provider(contexts, signal), renderer, signal, timeout);
}

/**
 * @param {Tacocat.Internal.Extractor} extractor
 * @param {(element: Element) => boolean} matcher
 * @param {Map<Element, Tacocat.Internal.Placeholder>} placeholders
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Renderer} renderer
 * @param {Element} scope
 * @param {AbortSignal} signal
 * @param {number} timeout
 */
function refreshPlaceholders(
  extractor,
  matcher,
  placeholders,
  provider,
  renderer,
  scope,
  signal,
  timeout,
) {
  processPlaceholders(
    extractor,
    placeholders,
    provider,
    renderer,
    exploreScope(matcher, placeholders, scope),
    signal,
    timeout,
  );
}

/**
 * @param {any} context
 * @param {string} key
 * @param {Tacocat.Internal.Provider} provider
 * @param {AbortSignal} signal
 * @param {number} timeout
 */
const resolveContext = (context, key, provider, signal, timeout) => new Promise(
  (resolve, reject) => {
    const failure = () => ({ context, key, error: new Error('Timeout') });
    const timer = setTimeout(() => reject(failure()), timeout);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(failure());
    });

    Process(
      log,
      () => { },
      provider(context, signal),
      (product) => {
        if (product.key === key) {
          log.debug('Resolved:', product);
          resolve(product);
        }
        return product;
      },
    );
  },
);

/**
 * @param {Tacocat.Internal.Extractor} extractor
 * @param {Tacocat.Internal.Listener[]} listeners
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Renderer} renderer
 * @param {Element} scope
 * @param {string?} selector
 * @param {AbortSignal} signal
 * @param {number} timeout
 * @returns {Tacocat.Internal.Engine}
 */
function Engine(
  extractor,
  listeners,
  observer,
  provider,
  renderer,
  scope,
  selector,
  signal,
  timeout = 30000,
) {
  /** @type {Map<Element, Tacocat.Internal.Placeholder>} */
  const placeholders = new Map();

  signal.addEventListener('abort', () => {
    log.debug('Disposed');
    placeholders.clear();
  });

  observer((selected) => {
    processPlaceholders(
      extractor,
      placeholders,
      provider,
      renderer,
      selected,
      signal,
      timeout,
    );
  }, listeners, scope, selector);

  log.debug('Created:', { scope, selector, timeout });

  return {
    explore(newScope, newSelector) {
      return exploreScope(
        createSelectorMatcher(newSelector),
        placeholders,
        newScope,
      );
    },
    refresh(newScope, newSelector) {
      refreshPlaceholders(
        extractor,
        createSelectorMatcher(newSelector),
        placeholders,
        provider,
        renderer,
        newScope,
        signal,
        timeout,
      );
    },
    resolve(context) {
      return resolveContext(
        context,
        getContextKey(context),
        provider,
        signal,
        timeout,
      );
    },
  };
}

export default Engine;
