import { getContextKey } from './context.js';
import Log from './log.js';
import Process from './process.js';
import { isProduct } from './product.js';
import Subtree from './subtree.js';
import { isNil } from './utilities.js';

const log = Log.common.module('engine');

/**
 * @param {Map<Element, Tacocat.Engine.Placeholder>} placeholders
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
 * @param {Tacocat.Engine.Placeholder[]} placeholders
 * @param {(Tacocat.Internal.Failure | Tacocat.Internal.Product)[]} products
 */
function renderRejected({ renderer }, placeholders, products) {
  placeholders.forEach((placeholder) => {
    const { context, element } = placeholder;
    const rejectedKey = getContextKey(context);
    const product = products.find(
      (candidate) => rejectedKey === getContextKey(candidate.context),
    );
    placeholder.value = undefined;
    log.debug('Rejected:', { ...product, context, element });
    return renderer(element, product ? { ...product, context } : { context });
  });
}

/**
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Tacocat.Engine.Placeholder[]} placeholders
 * @param {Tacocat.Internal.Product} product
 */
function renderResolved({ renderer }, placeholders, product) {
  placeholders?.forEach((placeholder) => {
    placeholder.value = product.value;
    const { element } = placeholder;
    log.debug('Resolved:', { ...product, element });
    return renderer(element, product);
  });
}

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<string, Tacocat.Engine.Placeholder[]>} pending
 * @param {any} results
 * @return {Promise<Tacocat.Engine.Placeholder[]>}
 */
function renderResults(control, workflow, pending, results) {
  /** @type {Tacocat.Engine.Placeholder[]} */
  const rendered = [];
  return Promise.race([
    control.promise,
    new Promise((resolve) => {
      Process(control, log, results, {
        resolver(products) {
          const placeholders = [...pending.values()].flat();
          rendered.push(...placeholders);
          renderRejected(workflow, placeholders, products);
          resolve(rendered);
          pending.clear();
        },
        transformer(product) {
          const resolvedKey = getContextKey(product.context);
          const placeholders = pending.get(resolvedKey);
          if (placeholders) {
            renderResolved(workflow, placeholders, product);
            rendered.push(...placeholders);
            pending.delete(resolvedKey);
          }
          return product;
        },
      });
    }),
  ]);
}

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Map<Element, Tacocat.Engine.Placeholder>} placeholders
 * @param {Tacocat.Engine.Placeholder[]} observed
 * @return {Promise<Tacocat.Engine.Placeholder[]>}
 */
function processPlaceholders(control, workflow, placeholders, observed) {
  /** @type {Map<string, Tacocat.Engine.Placeholder[]>} */
  const pending = new Map();
  observed.forEach((placeholder) => {
    const { element, value } = placeholder;
    let { context } = placeholder;
    if (!isNil(context)) context = workflow.extractor(element);
    if (isNil(context)) {
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
      if (pending.has(observedKey)) {
        pending.get(observedKey).push(placeholder);
      } else {
        pending.set(observedKey, [placeholder]);
      }
      log.debug('Pending:', { context, element });
      workflow.renderer(element, undefined);
    }
  });
  return renderResults(control, workflow, pending, workflow.provider([...pending]));
}

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {any} context
 */
const resolveContext = (control, workflow, context) => Promise.race([
  control.promise,
  new Promise((resolve, reject) => {
    const resolvingKey = getContextKey(context);
    log.debug('Resolving:', { context });
    Process(
      control,
      log,
      workflow.provider([context]),
      {
        resolver(products) {
          const product = products.find(
            (candidate) => resolvingKey === getContextKey(candidate.context),
          ) ?? { context };
          if (isProduct(product)) {
            log.debug('Resolved:', product);
            resolve(product);
          } else {
            log.debug('Rejected:', { context, ...product });
            reject(product);
          }
        },
      },
    );
  }),
]);

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
    (observed) => processPlaceholders(
      control,
      workflow,
      placeholders,
      observed,
    ),
    subtree,
  );

  return {
    explore(newScope, newSelector) {
      return exploreScope(
        placeholders,
        Subtree(newScope, newSelector),
      );
    },
    refresh(newScope, newSelector) {
      return processPlaceholders(
        control,
        workflow,
        placeholders,
        exploreScope(placeholders, Subtree(newScope, newSelector)),
      );
    },
    resolve(context) {
      return resolveContext(
        control,
        workflow,
        context,
      );
    },
  };
}

export default Engine;
