import { getContextKey } from './context.js';
import Log from './log.js';
import Process from './process.js';
import { isProduct } from './product.js';
import { createSelectorMatcher } from './utilities.js';

const log = Log.common.module('engine');

/**
 * @param {Map<Element, Tacocat.Internal.Placeholder>} placeholders
 * @param {Tacocat.Internal.Subtree} subtree
 */
function exploreScope(placeholders, { matcher, scope }) {
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
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<string, Tacocat.Internal.Placeholder[]>} pending
 * @param {(Tacocat.Internal.Failure | Tacocat.Internal.Product)[]} products
 */
function renderRejected({ renderer }, pending, products) {
  [...pending.values()].forEach((placeholders) => {
    placeholders.forEach((placeholder) => {
      const { context, element, key } = placeholder;
      const product = products.find((candidate) => key === candidate.key);
      placeholder.value = undefined;
      log.debug('Rejected:', { context, element, product });
      renderer(element, product ? { ...product, context } : { context });
    });
  });
}

/**
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<string, Tacocat.Internal.Placeholder[]>} pending
 * @param {Tacocat.Internal.Product} product
 * @returns
 */
function renderResolved({ renderer }, pending, product) {
  const { key, value } = product;
  const placeholders = pending.get(key);
  pending.delete(key);
  placeholders?.forEach((placeholder) => {
    placeholder.value = value;
    const { context, element } = placeholder;
    log.debug('Resolved:', { context, element, value });
    renderer(element, { context, value });
  });
  return product;
}

/**
 * @param {Tacocat.Controls} controls
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<string, Tacocat.Internal.Placeholder[]>} pending
 * @param {any} results
 */
function renderResults(controls, workflow, pending, results) {
  const timer = setTimeout(
    () => renderRejected(workflow, pending, []),
    controls.timeout,
  );
  controls.signal.addEventListener('abort', () => clearTimeout(timer));
  Process(results, {
    log,
    resolve(products) {
      renderRejected(workflow, pending, products);
    },
    transform(product) {
      renderResolved(workflow, pending, product);
      return product;
    },
  });
}

/**
 * @param {Tacocat.Controls} controls
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<Element, Tacocat.Internal.Placeholder>} placeholders
 * @param {Tacocat.Internal.Placeholder[]} selected
 */
function processPlaceholders(
  controls,
  workflow,
  placeholders,
  selected,
) {
  const contexts = [];
  /** @type {Map<string, Tacocat.Internal.Placeholder[]>} */
  const pending = new Map();
  selected.forEach((placeholder) => {
    const { element, key, value } = placeholder;
    let { context } = placeholder;
    if (context !== false) context = workflow.extractor(element);
    if (context == null) {
      log.debug('Disposed:', { context, element, value });
      placeholders.delete(element);
    } else {
      const existing = placeholders.get(element)?.key;
      if (existing) {
        if (existing === key) return;
      } else placeholders.set(element, { ...placeholder, context });
      contexts.push(context);
      if (pending.has(key)) pending.get(key).push(placeholder);
      else pending.set(key, [placeholder]);
      log.debug('Pending:', { context, element });
      workflow.renderer(element, undefined);
    }
  });
  if (pending.size) {
    renderResults(controls, workflow, pending, workflow.provider(contexts));
  }
}

/**
 * @param {Tacocat.Controls} controls
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<Element, Tacocat.Internal.Placeholder>} placeholders
 * @param {Tacocat.Internal.Subtree} subtree
 */
function refreshPlaceholders(
  controls,
  workflow,
  placeholders,
  subtree,
) {
  processPlaceholders(
    controls,
    workflow,
    placeholders,
    exploreScope(placeholders, subtree),
  );
}

/**
 * @param {Tacocat.Controls} controls
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {any} context
 * @param {string} key
 */
const resolveContext = (controls, workflow, context, key) => new Promise(
  (resolve, reject) => {
    const failure = () => ({ context, key, error: new Error('Timeout') });
    const timer = setTimeout(() => reject(failure()), controls.timeout);
    controls.signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(failure());
    });

    log.debug('Resolving:', { context });
    Process(
      log,
      workflow.provider([context]),
      {
        resolver(products) {
          const product = products.find((candidate) => candidate.key === key);
          if (product) {
            if (isProduct(product)) {
              log.debug('Resolved:', { context, product });
              resolve(product);
            } else {
              log.debug('Rejected:', { context, product });
              reject(product.error);
            }
          }
        },
      },
    );
  },
);

/**
 * @param {Tacocat.Controls} controls
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Internal.Engine}
 */
function Engine(
  controls,
  workflow,
  subtree,
) {
  /** @type {Map<Element, Tacocat.Internal.Placeholder>} */
  const placeholders = new Map();

  controls.signal.addEventListener('abort', () => {
    log.debug('Disposed');
    placeholders.clear();
  });

  workflow.observer(
    (selected) => processPlaceholders(
      controls,
      workflow,
      placeholders,
      selected,
    ),
    subtree,
  );

  log.debug('Created:', { process, subtree, workflow });

  return {
    explore(newScope, newSelector) {
      return exploreScope(
        placeholders,
        {
          matcher: createSelectorMatcher(newSelector),
          scope: newScope,
          selector: newSelector,
        },
      );
    },
    refresh(newScope, newSelector) {
      refreshPlaceholders(
        controls,
        workflow,
        placeholders,
        {
          matcher: createSelectorMatcher(newSelector),
          scope: newScope,
          selector: newSelector,
        },
      );
    },
    resolve(context) {
      return resolveContext(
        controls,
        workflow,
        context,
        getContextKey(context),
      );
    },
  };
}

export default Engine;
