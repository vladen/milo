import Declare from './declare';
import Engine from './engine';
import Extract from './extract';
import Observe from './observe';
import Provide from './provide';
import Render from './render';

/**
 * @param {Tacocat.Internal.Declarer[]} declarers
 * @param {AbortSignal} signal
 * @param {number} timeout
 */
const declare = (declarers, signal, timeout) => ({
  declare(declarer) {
    return declare(
      [...declarers, declarer],
      signal,
      timeout,
    );
  },
  extract(extractor, mutations) {
    return extract(
      Declare(declarers),
      [extractor],
      [],
      [mutations],
      signal,
      timeout,
    );
  }
});

/**
 * 
 * @param {Tacocat.Internal.CombinedDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Internal.Listener[]} listeners
 * @param {MutationObserverInit[]} mutationList 
 * @param {AbortSignal} signal
 * @param {number} timeout
 */
const extract = (declarer, extractors, listeners, mutationList, signal, timeout) => ({
  extract(extractor, mutations, listener) {
    return extract(
      declarer,
      [...extractors, extractor],
      [...listeners, listener],
      [...mutationList, mutations],
      signal,
      timeout
    );
  },
  provide(provider) {
    return transform(
      Extract(declarer, extractors),
      listeners,
      Observe(mutationList, signal),
      provider,
      signal,
      timeout,
      [],
    );
  }
});

/**
 * 
 * @param {Tacocat.Internal.CombinedExtractor} extractor
 * @param {Tacocat.Internal.Listener[]} listeners
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Renderer} renderer 
 * @param {Element} scope 
 * @param {string?} selector 
 * @param {AbortSignal} signal
 * @param {number} timeout
 * @returns 
 */
const observe = (extractor, listeners, observer, provider, renderer, scope, selector, signal, timeout) => ({
  ...Engine(
    extractor,
    listeners,
    observer,
    provider,
    renderer,
    scope,
    selector,
    signal,
    timeout
  ),
  observe(scope, selector) {
    return observe(
      extractor,
      listeners,
      observer,
      provider,
      renderer,
      scope,
      selector,
      signal,
      timeout
    );
  },
});

/**
 * @param {Tacocat.Internal.CombinedExtractor} extractor
 * @param {Tacocat.Internal.Listener[]} listeners
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Renderers[]} rendererList
 * @param {AbortSignal} signal
 * @param {number} timeout
 * @returns 
 */
const render = (extractor, listeners, observer, provider, rendererList = [], signal, timeout) => ({
  observe(scope, selector) {
    return observe(
      extractor,
      listeners,
      observer,
      provider,
      Render(rendererList),
      scope,
      selector,
      signal,
      timeout,
    );
  },
  render(renderers) {
    return render(
      extractor,
      listeners,
      observer,
      provider,
      [...rendererList, renderers],
      signal,
      timeout,
    );
  }
})

/**
 * @param {Tacocat.Internal.CombinedExtractor} extractor
 * @param {Tacocat.Internal.Listener[]} listeners
 * @param {Tacocat.Internal.Observer} observer
 * @param {Tacocat.Internal.Provider} provider 
 * @param {AbortSignal} signal
 * @param {number} timeout
 * @param {Tacocat.Internal.Transformer[]} transformers 
 */
const transform = (extractor, listeners, observer, provider, signal, timeout, transformers) => ({
  transform(transformer) {
    return transform(
      extractor,
      listeners,
      observer,
      provider,
      signal,
      timeout,
      [...transformers, transformer],
    );
  },
  render(renderers) {
    return render(
      extractor,
      listeners,
      observer,
      Provide(provider, signal, transformers),
      [renderers],
      signal,
      timeout,
    );
  }
});

/** @type {Tacocat.Engine.Factory} */
const Tacocat = (signal, timeout) => ({
  declare(declarer) {
    return declare([declarer], signal, timeout);
  }
});

export default Tacocat;
