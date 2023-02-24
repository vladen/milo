import Channel from './channel.js';
import { Stage } from './constants.js';
import { assignContext } from './context.js';
import Control from './control.js';
import Extract from './extract.js';
import Log from './log.js';
import Observe from './observe.js';
import Present from './present.js';
import Provide from './provide.js';
import { safeAsync, safeSync } from './safe.js';
import Subtree from './subtree.js';
import { isFunction } from './utilities.js';

export { Log, safeAsync, safeSync };

/**
 * @template T, U
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Tacocat.Internal.Reactions[]} reactions
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Engine.Present<T, U>}
 */
const Step2 = (subscribers, reactions, presenters = {
  pending: [],
  rejected: [],
  resolved: [],
}) => ({
  observe(scope, selector, signal) {
    return Observe(
      Control(signal),
      reactions,
      [...subscribers, Present(presenters)],
      Subtree(scope, selector),
    );
  },
  present(stage, ...nextPresenters) {
    if (isFunction(stage)) {
      return Step2(subscribers, reactions, {
        [Stage.pending]: [...presenters[Stage.pending], stage],
        [Stage.rejected]: [...presenters[Stage.rejected], stage],
        [Stage.resolved]: [...presenters[Stage.resolved], stage],
      });
    }
    return Step2(subscribers, reactions, {
      ...presenters,
      [stage]: [...[presenters[stage] ?? []], ...nextPresenters],
    });
  },
});

/**
 * @template T, U
 * @param {object} context
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Internal.Reactions[]} reactions
 * @returns {Tacocat.Engine.Extract<T, U>}
 */
const Step1 = (context, extractors = [], reactions = []) => ({
  extract(extractor, nextReactions) {
    return Step1(
      context,
      [...extractors, extractor],
      [...reactions, nextReactions],
    );
  },
  provide(provider) {
    const presenters = {
      pending: [],
      rejected: [],
      resolved: [],
    };
    return Step2(
      [Extract(context, extractors), Provide(provider)],
      reactions,
      presenters,
    );
  },
});

/**
 * @type {Tacocat.Engine.Factory}
 */
const tacocat = {
  assign: assignContext,
  define(context) {
    return Step1(context);
  },
  channel: Channel,
  stage: Stage,
};

export default tacocat;

/*
const attribute = 'data-value';
const rejected = 'rejected';
const resolved = 'resolved';

const placeholders = tacocat
  .define({})
  .extract(
    (_, element) => Promise.resolve({ test: element.getAttribute('context') }),
  )
  .provide(
    (contexts) => Promise.resolve(contexts.map((context) => ({
      context,
      product: `${context.test}-product`,
    }))),
  )
  .present(tacocat.stage.resolved, (element, { _, product }) => {
    element.setAttribute('product', product);
  })
  .observe(document.body, 'p')
  .explore();
await Promise.all(
  placeholders.map((placeholder) => placeholder.wait(tacocat.stage.resolved)),
);
placeholders.forEach((placeholder) => {
  placeholder.element.getAttribute('context');
  placeholder.element.getAttribute('product');
});

const pipeline = tacocat
  .define({ reject: false })
  .extract(
    (context, element) => Promise.resolve({
      ...context,
      extracted: element.getAttribute(attribute),
    }),
    {
      events: ['click'],
      mutations: { attributeFilter: [attribute] },
    },
  )
  .provide(
    (contexts) => Promise.resolve(contexts.map((context) => {
      if (context.reject) {
        throw assignContext(new Error(rejected), context);
      }
      return assignContext({ resolved }, context);
    })),
  )
  .present(Stage.pending, (element, state) => {
    // @ts-ignore
    element.state = state;
  });

pipeline
  .observe(document.body, 'p')
  .refresh(document.body);
*/
