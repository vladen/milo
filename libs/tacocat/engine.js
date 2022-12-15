import { getContextKey } from './context.js';
import Log from './log.js';
import { isFailure, isProduct } from './product.js';
import Subtree from './subtree.js';
import { isNil } from './utilities.js';

const log = Log.common.module('engine');

/**
 * @param {Map<Element, Tacocat.Engine.Placeholder>} placeholders
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Engine.Placeholder[]}
 */
function exploreScope(placeholders, { matcher, scope }) {
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
 * @param {{
 *  key?: string;
 *  resolve: (product: Tacocat.Internal.Product, key: string) => void;
 *  reject: (failure: Tacocat.Internal.Failure, key: string) => void
 * }} workflow
 */
function resultHandler({ key, resolve, reject = () => { } }) {
  /** @param {Tacocat.Internal.Result} result */
  return (result) => {
    if (isProduct(result, key)) {
      log.debug('Resolved:', result);
      resolve(result, getContextKey(result.context));
    } else if (isFailure(result, key)) {
      log.debug('Rejected:', { context, ...result });
      reject(result, getContextKey(result.context));
    }
  };
}

/**
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<string, Map<Element, Tacocat.Engine.Placeholder>>} pending
 * @param {Tacocat.Engine.Placeholder[]} rendered
 * @param {Tacocat.Internal.Result[]} results
 */
function renderPlaceholders({ renderer }, pending, rendered, results) {
  function render(product, key) {
    if (pending.has(key)) {
      [...pending.get(key).values()].forEach((placeholder) => {
        placeholder.value = product.value;
        renderer(placeholder.element, product);
        rendered.push(placeholder);
      });
      pending.delete(key);
    }
  }

  results.forEach(resultHandler({
    resolve: render,
    reject: render,
  }));
}

/**
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<string, Map<Element, Tacocat.Engine.Placeholder>>} pending
 */
function provideResults(workflow, pending) {
  /** @type {Tacocat.Engine.Placeholder[]} */
  const rendered = [];
  return workflow
    .provider([...pending], (result) => {
      renderPlaceholders(workflow, pending, rendered, [result]);
    })
    .then(() => {
      const error = new Error('Not provided');
      const failures = [...pending.values()].flatMap(
        (placeholders) => [...placeholders.values()].map(
          ({ context }) => ({ context, error }),
        ),
      );
      renderPlaceholders(workflow, pending, rendered, failures);
    })
    .then(() => rendered);
}

/**
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<Element, Tacocat.Engine.Placeholder>} placeholders
 * @param {Tacocat.Engine.Placeholder[]} observed
 * @return {Promise<Tacocat.Engine.Placeholder[]>}
 */
function processPlaceholders(workflow, placeholders, observed) {
  /** @type {Map<string, Map<Element, Tacocat.Engine.Placeholder>>} */
  const pending = new Map();
  observed.forEach((placeholder) => {
    const { context, element, value } = placeholder;
    if (isNil(context) || !workflow.extractor(context, element)) {
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
      workflow.renderer(element, undefined);
    }
  });
  return provideResults(workflow, pending);
}

/**
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {any} context
 */
const resolveContext = (workflow, context) => new Promise((resolve, reject) => {
  log.debug('Resolving:', { context });
  const handleResult = resultHandler({
    key: getContextKey(context),
    resolve,
    reject,
  });
  workflow
    .provider([context], handleResult)
    .then((results) => results.forEach(handleResult));
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Internal.Engine}
 */
function Engine(control, workflow, subtree) {
  /** @type {Map<Element, Tacocat.Engine.Placeholder>} */
  const placeholders = new Map();

  log.debug('Created:', { process, subtree, workflow });

  control.signal.addEventListener('abort', () => {
    log.debug('Disposed');
    placeholders.clear();
  });

  workflow.observer(
    (observed) => processPlaceholders(workflow, placeholders, observed),
    subtree,
  );

  return {
    explore(newScope, newSelector) {
      return exploreScope(placeholders, Subtree(newScope, newSelector));
    },
    refresh(newScope, newSelector) {
      const observed = exploreScope(placeholders, Subtree(newScope, newSelector));
      return processPlaceholders(workflow, placeholders, observed);
    },
    resolve(context) {
      return resolveContext(workflow, context);
    },
  };
}

export default Engine;
