declare namespace Tacocat {
  // --- types ---
  type isFunction = (value: any) => value is Function;
  type isNil = (value: any) => value is null | undefined;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isUndefined = (value: any) => value is undefined;

  type hasContext = (candidate: any) => candidate is Result<any, any>;
  type isFailure = (candidate: any) => candidate is Failure<any>;
  type isProduct = (candidate: any) => candidate is Product<any, any>;

  type Contextful<T> = { context?: T };
  type Failure<T> = Contextful<T> & Error;
  type Product<T, U> = Contextful<T> & { value?: U };
  type Result<T, U> = Failure<T> | Product<T, U>;

  module Engine {
    // --- types ---
    type Declarer<T, U extends object> = (context: T) => U;

    /**
     * @returns
     * - undefined - the template cannot be applied to this context/value
     * - null - the template removed placeholder element and it should not be handled anymore
     * - Element - the template updated existing placeholder element and confirms this by returning it
     * - Element - the template replaced existing placeholder with new one, the new one is returned for tracking
     */
    type Effect = void | Element;

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

    type Provider<T, U> = (control: Control, contexts: T[]) => any;

    type Transformer<T, U, V extends U> = (
      product: Product<T, U>
    ) => Result<T, V>;

    // --- interfaces ---
    interface Control {
      signal: AbortSignal;
      timeout: number;
    }

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
      explore(scope: Element, selector?: string): Placeholder[];

      observe(scope: Element, selector?: string): Observe<T, U>;

      refresh(scope: Element, selector?: string): Promise<Placeholder[]>;

      resolve(context: T): Promise<Product<T, U>>;
    }

    interface Placeholder {
      context: object;
      element: Element;
      stage?: 'pending' | 'resolved' | 'rejected';
      value?: any;
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
      pending?: PendingRenderer | PendingRenderer[];

      rejected?: RejectedRenderer<T> | RejectedRenderer<T>[];

      resolved?: ResolvedRenderer<T, U> | ResolvedRenderer<T, U>[];
    }

    interface Transform<T, U> {
      transform<V extends U>(
        transformer: Transformer<T, U, V>
      ): Transform<T, V>;

      render(renderers: Renderers<T, U>): Render<T, U>;
    }
  }

  module Internal {
    // --- types ---
    type Control = Tacocat.Engine.Control & { promise: Promise<never> };
    type Declarer = Tacocat.Engine.Declarer<any, any>;
    type Engine = Omit<Tacocat.Engine.Observe<any, any>, 'observe'>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Failure = Tacocat.Failure<any>;
    type Listener = Tacocat.Engine.Listener;
    type Product = Tacocat.Product<any, any>;
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Renderers = Tacocat.Engine.Renderers<any, any>;
    type Resolver = (results: Tacocat.Internal.Result[]) => void;
    type Result = Tacocat.Result<any, any>;
    type SafeDeclarer = Tacocat.Engine.Declarer<any, any>;
    type SafeExtractor = (element: Element) => object;
    type SafeObserver = (
      consumer: (placeholders: Tacocat.Engine.Placeholder[]) => void,
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
