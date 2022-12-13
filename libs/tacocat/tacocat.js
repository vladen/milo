import Declare from './declare.js';
import Engine from './engine.js';
import Extract from './extract.js';
import Observe from './observe.js';
import Provide from './provide.js';
import Render from './render.js';
import { mergeMutations } from './utilities.js';

/**
 * @param {Tacocat.Options.Process} process
 * @param {Tacocat.Internal.Declarer[]} declarers
 */
const declare = (process, declarers) => ({
  declare(declarer) {
    return declare(
      process,
      [...declarers, declarer],
    );
  },
  extract(extractor, mutations) {
    return extract(
      process,
      Declare(declarers),
      [extractor],
      [mutations],
      [],
    );
  },
});

/**
 * @param {Tacocat.Options.Process} process
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {MutationObserverInit[]} mutations
 * @param {Tacocat.Internal.Listener[]} listeners
 */
const extract = (process, declarer, extractors, mutations, listeners = []) => ({
  extract(extractor, newMutations, listener) {
    return extract(
      process,
      declarer,
      [...extractors, extractor],
      [...mutations, newMutations],
      [...listeners, listener],
    );
  },
  provide(provider) {
    return transform(
      process,
      Extract(declarer, extractors),
      Observe(process, { listeners, mutations: mergeMutations(mutations) }),
      provider,
    );
  },
});

/**
 *
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.SafeRenderer} renderer
 * @param {Tacocat.Options.Process} process
 * @param {Tacocat.Options.Subtree} subtree
 * @returns
 */
const observe = (process, extractor, observer, provider, renderer, subtree) => ({
  ...Engine(
    process,
    extractor,
    observer,
    provider,
    renderer,
    subtree,
  ),
  observe(scope, selector) {
    return observe(
      process,
      extractor,
      observer,
      provider,
      renderer,
      { scope, selector },
    );
  },
});

/**
 * @param {Tacocat.Options.Process} process
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Renderers[]} renderers
 * @returns
 */
const render = (process, extractor, observer, provider, renderers = []) => ({
  observe(scope, selector) {
    return observe(
      process,
      extractor,
      observer,
      provider,
      Render(renderers),
      { scope, selector },
    );
  },
  render(newRenderers) {
    return render(
      process,
      extractor,
      observer,
      provider,
      [...renderers, newRenderers],
    );
  },
});

/**
 * @param {Tacocat.Options.Process} process
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Transformer[]} transformers
 */
const transform = (process, extractor, observer, provider, transformers = []) => ({
  transform(transformer) {
    return transform(
      process,
      extractor,
      observer,
      provider,
      [...transformers, transformer],
    );
  },
  render(renderers) {
    return render(
      process,
      extractor,
      observer,
      Provide(process, provider, transformers),
      [renderers],
    );
  },
});

/** @type {Tacocat.Engine.Factory} */
const Tacocat = (signal, timeout) => ({
  declare(declarer) {
    return declare({ signal, timeout }, [declarer]);
  },
});

export default Tacocat;
