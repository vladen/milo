import Control from './control.js';
import Declare from './declare.js';
import Engine from './engine.js';
import Extract from './extract.js';
import Observe from './observe.js';
import Provide from './provide.js';
import Render from './render.js';
import Subtree from './subtree.js';
import { mergeMutations } from './utilities.js';

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Workflow} workflow
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns
 */
const observe = (control, workflow, subtree) => ({
  ...Engine(
    control,
    workflow,
    subtree,
  ),
  observe(scope, selector) {
    return observe(
      control,
      workflow,
      Subtree(scope, selector),
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.SafeObserver} observer
 * @param {Tacocat.Internal.SafeProvider} provider
 * @param {Tacocat.Internal.Renderers[]} renderers
 * @returns
 */
const render = (control, extractor, observer, provider, renderers = []) => ({
  observe(scope, selector) {
    return observe(
      control,
      { extractor, observer, provider, renderer: Render(renderers) },
      Subtree(scope, selector),
    );
  },
  render(newRenderers) {
    return render(
      control,
      extractor,
      observer,
      provider,
      [...renderers, newRenderers],
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.SafeObserver} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Transformer[]} transformers
 */
const transform = (control, extractor, observer, provider, transformers = []) => ({
  transform(transformer) {
    return transform(
      control,
      extractor,
      observer,
      provider,
      [...transformers, transformer],
    );
  },
  render(renderers) {
    return render(
      control,
      extractor,
      observer,
      Provide(control, provider, transformers),
      [renderers],
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {MutationObserverInit[]} mutations
 * @param {Tacocat.Internal.Listener[]} listeners
 */
const extract = (control, declarer, extractors, mutations, listeners = []) => ({
  extract(extractor, newMutations, listener) {
    return extract(
      control,
      declarer,
      [...extractors, extractor],
      [...mutations, newMutations],
      [...listeners, listener],
    );
  },
  provide(provider) {
    return transform(
      control,
      Extract(declarer, extractors),
      Observe(control, listeners, mergeMutations(mutations)),
      provider,
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Declarer[]} declarers
 */
const declare = (control, declarers) => ({
  declare(declarer) {
    return declare(
      control,
      [...declarers, declarer],
    );
  },
  extract(extractor, mutations) {
    return extract(
      control,
      Declare(declarers),
      [extractor],
      [mutations],
    );
  },
});

/**
 * @type {Tacocat.Engine.Factory}
 */
const Tacocat = (signal, timeout) => ({
  declare(declarer) {
    return declare(Control({ signal, timeout }), [declarer]);
  },
});

export default Tacocat;
