declare namespace Tacocat {
  // --- types ---
  type isFunction = (value: any) => value is Function;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isUndefined = (value: any) => value is undefined;

  type hasContext = (candidate: any) => candidate is Result<any, any>;
  type isFailure = (candidate: any) => candidate is Failure<any>;
  type isProduct = (candidate: any) => candidate is Product<any, any>;

  type Failure<T> = { context?: T; error?: Error };
  type Product<T, U> = { context: T; value?: U };
  type Result<T, U> = Failure<T> | Product<T, U>;

  // --- interfaces ---
  interface Controls {
    signal: AbortSignal;
    timeout: number;
  }

  module Engine {
    // --- types ---
    type Declarer<T, U extends object> = (context: T) => U;

    type Effect = void | undefined | null | Element;

    type Extractor<T, U extends object> = (context: T, element: Element) => U;

    type Factory = (
      signal?: AbortSignal,
      timeout?: number
    ) => {
      declare<T extends object>(context: T): Declare<T>;
      declare<T extends object>(declarer: Declarer<object, T>): Declare<T>;
    };

    type Listener = (
      element: Element,
      listener: (event: Event) => void
    ) => () => void;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type Provider<T, U> = (controls: Controls, contexts: T[]) => U;

    type Transformer<T, U extends T, V, W extends V> = (
      product: Product<T, V>
    ) => Product<U, W>;

    // --- interfaces ---

    interface Declare<T extends object> {
      declare<U extends object>(declarer: Declarer<T, U>): Declare<T & U>;
      declare<U extends object>(context: U): Declare<T & U>;

      extract<U extends object>(
        extractor: Extractor<T, U>,
        mutations?: Mutations
      ): Extract<T & U>;
    }

    interface Extract<T> {
      extract<U extends object>(
        extractor: Extractor<T, U>,
        mutations?: Mutations,
        listener?: Listener
      ): Extract<T & U>;

      provide<U>(provider: Provider<T, U>): Transform<T, U>;
    }

    interface Observe<T, U> {
      explore(scope: Element, selector?: string): Placeholder<T, U>[];

      observe(scope: Element, selector?: string): Observe<T, U>;

      refresh(scope: Element, selector?: string): void;

      resolve(context: T): Promise<Product<T, U>>;
    }

    interface Placeholder<T, U> {
      context: T;
      element: Element;
      value?: U;
    }

    interface Render<T, U> {
      observe(scope: Element, selector?: string): Observe<T, U>;

      render(renderers: Renderers<T, U>): Render<T, U>;
    }

    type PendingRenderer = (element: Element) => Effect;
    type RejectedRenderer<T> = (
      element: Element,
      failure: Failure<T>
    ) => Effect;
    type ResolvedRenderer<T, U> = (
      element: Element,
      product: Product<T, U>
    ) => Effect;
    interface Renderers<T, U> {
      /**
       * @returns
       * - undefined - the template cannot be applied to this context/value
       * - null - the template removed/replaced placeholder element and it should not be handled anymore
       * - Element - the template either updated existing placeholder element or created new one, it should be handled
       */
      pending?: PendingRenderer | PendingRenderer[];

      rejected?: RejectedRenderer<T> | RejectedRenderer<T>[];

      resolved?: ResolvedRenderer<T, U> | ResolvedRenderer<T, U>[];
    }

    interface Transform<T, U> {
      transform<V extends T, W extends U>(
        transformer: Transformer<T, V, U, W>
      ): Transform<T, U & V>;

      render(renderers: Renderers<T, U>): Render<T, U>;
    }
  }

  module Internal {
    // --- types ---
    type Declarer = Tacocat.Engine.Declarer<any, any>;
    type Engine = Omit<Tacocat.Engine.Observe<any, any>, 'observe'>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Failure = Keyed<Tacocat.Failure<any>>;
    type Keyed<T extends object> = T & { key?: string };
    type Listener = Tacocat.Engine.Listener;
    type Placeholder = Keyed<Tacocat.Engine.Placeholder<any, any>>;
    type Product = Keyed<Tacocat.Product<any, any>>;
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Renderers = Tacocat.Engine.Renderers<any, any>;
    type Resolver = (results: Tacocat.Internal.Result[]) => void;
    type Result = Keyed<Tacocat.Result<any, any>>;
    type SafeDeclarer = Tacocat.Engine.Declarer<any, any>;
    type SafeExtractor = (element: Element) => object;
    type SafeObserver = (
      consumer: (placeholders: Placeholder[]) => void,
      subtree: Subtree
    ) => void;
    type SafeProvider = (contexts: object[]) => any;
    type SafeRenderer = (
      element: Element,
      result: Tacocat.Result<any, any> | undefined
    ) => Tacocat.Engine.Effect;
    type SelectorMatcher = (element: Element) => boolean;
    type Transformer = (product: Product) => Product;

    // --- interfaces ---
    interface Processing {
      resolver?: Tacocat.Internal.Resolver;
      transformer?: Tacocat.Internal.Transformer;
    }
    interface Reactions {
      listeners: Engine.Listener[];
      mutations: Engine.Mutations;
    }
    interface Subtree {
      matcher: SelectorMatcher;
      scope: Element;
      selector?: string;
    }
    interface Workflow {
      observer: Tacocat.Internal.SafeObserver;
      extractor: Tacocat.Internal.SafeExtractor;
      provider: Tacocat.Internal.SafeProvider;
      renderer: Tacocat.Internal.SafeRenderer;
    }
  }

  module Log {
    // --- types ---
    type Factory = {
      (namespace: string): Instance;
      common: Instance;
      level: Level;
      reset(): void;
      use(...modules: Module[]): Factory;
    };

    type Level = {
      debug: 'debug';
      error: 'error';
      info: 'info';
      warn: 'warn';
    };

    // --- interfaces ---
    interface Instance {
      readonly namespace: string;
      debug(message: string, ...params: any[]): void;
      error(message: string, ...params: any[]): void;
      module(name: string): Instance;
      info(message: string, ...params: any[]): void;
      warn(message: string, ...params: any[]): void;
    }

    interface Module {
      filter?(record: Record): boolean;
      write?(record: Record): void;
    }

    interface Record {
      level: Level;
      message: string;
      namespace: string;
      params: any[];
      timestamp: number;
    }
  }
}
