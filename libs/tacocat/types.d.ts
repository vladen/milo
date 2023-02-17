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

  type Pending = 'pending';
  type Rejected = 'rejected';
  type Resolved = 'resolved';
  type Stage = Pending | Rejected | Resolved;
  
  type ContextfulEvent<T> = CustomEvent & { detail: Contextful<T> };
  type FailureEvent<T> = CustomEvent & { detail: Failure<T> & { stage: Rejected } };
  type ProductEvent<T, U> = CustomEvent & { detail: Product<T, U> & { stage: Resolved } };
  type ResultEvent<T, U> = FailureEvent<T> | ProductEvent<T, U>;

  type Disposer = () => void;
  type Disposers = Disposer | Disposer[] | Disposer[][];

  module Engine {
    // --- types ---
    type Configure<T extends object, U extends object, V> = (pipeline: {
      declare(declarer: Declarer<object, T>): void;
      extract(extractor: Extractor<T, U>, options?: Reactions): void;
      compare(comparer: Comparer<T>): void;
      provide(provider: Provider<U, V>): void;
      present(presenters: Presenters<U, V>): void;
    }) => (target: {
      scope: Element,
      selector?: string
    }) => Instance<U, V>;

    type Comparer<T> = (next: T, last: T) => boolean;
    type Declarer<T, U extends object> = (context: T) => U;
    type Extractor<T, U extends object> = (event: CustomEvent & { detail: Contextful<T> }) => Promise<U>;

    type Factory = (
      signal?: AbortSignal,
      timeout?: number
    ) => {
      declare<T extends object>(context: T): Declare<T>;
      declare<T extends object>(declarer: Declarer<object, T>): Declare<T>;
    };

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type Provider<T, U> = (control: Control, contexts: T[]) => U;

    type PendingPresenter<T> = (event: ContextfulEvent<T>) => void;
    type RejectedPresenter<T> = (event: FailureEvent<T>) => void;
    type ResolvedPresenter<T, U> = (event: ProductEvent<T, U>) => void;

    type Transformer<T, U, V extends U> = (
      product: Product<T, U>
    ) => Result<T, V>;

    type Trigger = (
      element: Element,
      listener: (event?: Event) => void,
      signal?: AbortSignal
    ) => Disposer;

    // --- interfaces ---
    interface Control {
      signal?: AbortSignal;
      timeout?: number;
    }

    interface Declare<T extends object> {
      declare<U extends object>(declarer: Declarer<T, U>): Declare<T & U>;
      declare<U extends object>(context: U): Declare<T & U>;
      extract<U extends object>(extractor: Extractor<T, U>, reactions?: Reactions): Extract<T & U>;
    }

    interface Extract<T> {
      compare(comparer: Comparer<T>): Provide<T>;
      extract<U extends object>(extractor: Extractor<T, U>, reactions?: Reactions): Extract<T & U>;
      provide<U>(provider: Provider<T, U>): Transform<T, U>;
    }

    interface Instance<T, U> {
      abort(): void;
      explore(scope: Element, selector?: string): Placeholder[];
      refresh(scope: Element, selector?: string): Promise<Placeholder[]>;
      resolve(context: T): Promise<Product<T, U>>;
    }

    interface Observe<T, U> extends Instance<T, U> {
      observe(scope: Element, selector?: string): Observe<T, U>;
    }

    interface Reactions {
      events?: string[];
      mutations?: Mutations,
      trigger?: Trigger
    }

    interface Placeholder {
      context: object;
      element: Element;
      stage?: Stage;
      value?: any;
    }

    interface Presenters<T, U> {
      pending?: PendingPresenter<T> | PendingPresenter<T>[];
      rejected?: RejectedPresenter<T> | RejectedPresenter<T>[];
      resolved?: ResolvedPresenter<T, U> | ResolvedPresenter<T, U>[];
    }

    interface Present<T, U> {
      observe(scope: Element, selector?: string): Observe<T, U>;
      present(presenters: Presenters<T, U>): Present<T, U>;
    }

    interface Provide<T> {
      provide<U>(provider: Provider<T, U>): Transform<T, U>;
    }

    interface Transform<T, U> {
      present(presenters: Presenters<T, U>): Present<T, U>;
      transform<V extends U>(transformer: Transformer<T, U, V>): Transform<T, V>;
    }
  }

  module Internal {
    // --- types ---
    type Consumer = (product: Product) => void;
    type Control = Tacocat.Engine.Control & {
      dispose(disposers: Disposers, key: any): boolean;
      expire<T>(fallback: T): Promise<T>;
      release(key: any): void;
    };
    type Declarer = Tacocat.Engine.Declarer<any, any>;
    type Engine = Omit<Tacocat.Engine.Observe<any, any>, 'observe'>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Failure = Tacocat.Failure<any>;
    type Listener = Tacocat.Engine.Trigger;
    type Mutations = Tacocat.Engine.Mutations;
    type Product = Tacocat.Product<any, any>;
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Presenters = Tacocat.Engine.Presenters<any, any>;
    type Resolver = (products: Product[]) => void;
    type Result = Tacocat.Result<any, any>;
    type SafeDeclarer = (control: Control, context: object) => Promise<boolean>;
    type SafeExtractor = (control: Control, element: Element) => void;
    type SafeObserver = (control: Control, subtree: Subtree) => (
      observe: (control: Control, element: Element) => Disposer
    ) => void;
    type SafeProvider = (
      contexts: object[],
      consumer: Consumer,
    ) => Promise<Product[]>;
    type SafePresenter = (element: Element) => Disposers;
    type SelectorMatcher = (element: Element) => boolean;
    type Transformer = (product: Product) => Product;

    // --- interfaces ---
    interface EventDispatcher<T> {
      dispatch(target: EventTarget, product?: T, event?: Event): void;
      listen: (
        target: EventTarget,
        listener: (event: CustomEvent & { detail: T }) => void,
        options?: AddEventListenerOptions
      ) => Disposer;
      type: string;
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
      presenter: Tacocat.Internal.SafePresenter;
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
      writer?(record: Record): void;
    }

    interface Record {
      instance: number;
      level: Level;
      message: string;
      namespace: string;
      params: any[];
      timestamp: number;
    }
  }
}
