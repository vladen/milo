import { getContextKey } from './context.js';
import Log from './log.js';
import { Failure, isFailure, isProduct } from './result.js';
import Subtree from './subtree.js';
import { isNil } from './utilities.js';

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.SafeObserver} observer
 * @param {Tacocat.Internal.SafeProvider} provider
 * @param {Tacocat.Internal.SafePresenter} renderer
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Internal.Engine}
 */
function Engine(control, extractor, observer, provider, renderer, subtree) {
  const log = Log.common.module('engine');
  log.debug('Created:', {
    control, extractor, observer, provider, renderer, subtree,
  });

  if (control.dispose(() => log.debug('Disposed'))) {
    return {
      explore() {
        return [];
      },
      refresh() {
        return Promise.resolve([]);
      },
      resolve(context) {
        return Promise.resolve(Failure(context, new Error('Disposed')));
      },
    };
  }

  /** @type {Map<Element, Tacocat.Engine.Placeholder>} */
  const placeholders = new Map();

  control.dispose(() => placeholders.clear());

  /**
   * @param {Tacocat.Internal.Subtree} subtree
   * @returns {Tacocat.Engine.Placeholder[]}
   */
  function exploreScope({ matcher, scope }) {
    const elements = [scope, ...scope.children];
    const results = [];
    elements.forEach((element) => {
      if (matcher(element)) {
        const placeholder = placeholders.get(element);
        if (placeholder) results.push({ ...placeholder });
      }
      elements.push(...element.children);
    });
    return results;
  }

  /**
   * @param {string} key
   * @param {(product: Tacocat.Internal.Product) => void} resolve
   * @param {(failure: Tacocat.Internal.Failure) => void} reject
   */
  function resultHandler(key, reject, resolve) {
    /** @param {Tacocat.Internal.Result} result */
    return (result) => {
      if (isProduct(result, key)) {
        log.debug('Resolved:', result);
        resolve(result);
      } else if (isFailure(result, key)) {
        log.debug('Rejected:', { context, ...result });
        reject(result);
      }
    };
  }

  /**
   * @param {Map<string, Map<Element, Tacocat.Engine.Placeholder>>} pending
   * @param {Tacocat.Engine.Placeholder[]} rendered
   * @param {Tacocat.Internal.Result[]} results
   */
  function renderPlaceholders(pending, rendered, results) {
    function render(product) {
      const key = getContextKey(product.context);
      if (pending.has(key)) {
        [...pending.get(key).values()].forEach((placeholder) => {
          placeholder.value = product.value;
          renderer(placeholder.element, product);
          rendered.push(placeholder);
        });
        pending.delete(key);
      }
    }

    results.forEach(resultHandler(undefined, render, render));
  }

  /**
   * @param {Map<string, Map<Element, Tacocat.Engine.Placeholder>>} pending
   */
  function provideResults(pending) {
    const contexts = [...pending.values()].flatMap(
      (map) => [...map.values()].map(
        ({ context }) => context,
      ),
    );
    /** @type {Tacocat.Engine.Placeholder[]} */
    const rendered = [];
    return provider(
      contexts,
      (result) => {
        renderPlaceholders(pending, rendered, [result]);
      },
    )
      .then(() => {
        const error = new Error('Not provided');
        const failures = [...pending.values()].flatMap(
          (map) => [...map.values()].map(
            ({ context }) => ({ context, error }),
          ),
        );
        renderPlaceholders(pending, rendered, failures);
      })
      .then(() => rendered);
  }

  /**
   * @param {Tacocat.Engine.Placeholder[]} observed
   * @return {Promise<Tacocat.Engine.Placeholder[]>}
   */
  function processPlaceholders(observed) {
    /** @type {Map<string, Map<Element, Tacocat.Engine.Placeholder>>} */
    const pending = new Map();
    observed.forEach((placeholder) => {
      const { context, element, value } = placeholder;
      if (isNil(context) || !extractor(context, element)) {
        log.debug('Disposed:', { element, context, value });
        placeholders.delete(element);
      } else {
        const observedKey = getContextKey(context);
        const existingKey = getContextKey(placeholders.get(element));
        if (existingKey) {
          if (existingKey === observedKey) return;
        } else {
          placeholders.set(element, { context, element, stage: 'pending', value });
        }
        if (!pending.has(observedKey)) {
          pending.set(observedKey, new Map());
        }
        pending.get(observedKey).set(element, placeholder);
        log.debug('Pending:', { context, element });
        renderer(element, undefined);
      }
    });
    return provideResults(pending);
  }

  /**
   * @param {any} context
   */
  const resolveContext = (context) => new Promise((resolve, reject) => {
    log.debug('Resolving:', { context });
    const handleResult = resultHandler(getContextKey(context), reject, resolve);
    provider([context], handleResult).then(
      (results) => results.forEach(handleResult),
    );
  });

  observer(
    (observed) => processPlaceholders(observed),
    subtree,
  );

  return {
    explore(newScope, newSelector) {
      return exploreScope(Subtree(newScope, newSelector));
    },
    refresh(newScope, newSelector) {
      return processPlaceholders(exploreScope(Subtree(newScope, newSelector)));
    },
    resolve(context) {
      return resolveContext(context);
    },
  };
}

export default Engine;
