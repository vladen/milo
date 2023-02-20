declare namespace Tacocat {
  // --- types ---
  type isError = (value: any) => value is Error;
  type isFunction = (value: any) => value is Function;
  type isNil = (value: any) => value is null | undefined;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isUndefined = (value: any) => value is undefined;

  type Contextful<T extends object> = { context?: T };
  type ContextfulError<T extends object> = Contextful<T> & Error;
  type ContextfulObject<T extends object, U extends object> = Contextful<T> & U;
  type State<T extends object, U extends object> = Contextful<T> | ContextfulError<T> | ContextfulObject<T, U>;

  type hasContext = (candidate: any) => candidate is Contextful<any>;

  type Pending = 'pending';
  type Rejected = 'rejected';
  type Resolved = 'resolved';
  type Stage = Pending | Rejected | Resolved;

  type ContextEvent<T extends object> = CustomEvent & {
    detail: Contextful<T> & { stage: Pending };
  };
}

declare namespace Tacocat {
  module Engine {
    // --- types ---
    type Comparer<T> = (one: T, two: T) => boolean;

    type Disposer = () => void;
    type Disposers = Disposer | Disposer[] | Disposer[][];

    type Extractor<T extends object, U extends object> = (
      context: T,
      element: Element,
      event: ContextEvent<T>,
      signal?: AbortSignal
    ) => U | Promise<U>;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type PendingPresenter<T extends object> = (
      element: Element,
      state: Contextful<T>
    ) => void;

    type Provider<T extends object, U extends object> = (
      contexts: T[],
      signal?: AbortSignal
    ) => Promise<ContextfulObject<T, U>[]> | Promise<Promise<ContextfulObject<T, U>[]>[]>;

    type RejectedPresenter<T extends object> = (
      element: Element,
      state: ContextfulError<T>
    ) => void;

    type ResolvedPresenter<T extends object, U extends object> = (
      element: Element,
      state: ContextfulObject<T, U>
    ) => void;

    type Trigger = (
      element: Element,
      listener: (event?: Event) => void,
      signal?: AbortSignal
    ) => Disposer;

    // --- interfaces ---
    interface Channel<T> {
      dispatch(target: EventTarget, detail?: T, event?: Event): void;
      listen: (
        target: EventTarget,
        listener: (event: CustomEvent & { detail: T }) => void,
        options?: AddEventListenerOptions
      ) => Tacocat.Engine.Disposer;
      type: string;
    }

    interface Extract<T extends object> {
      /**
       * Continues defining tacocat pipeline by registering contexts extractor and reactions triggering it.
       * @param extractor
       * A function accepting current pipeline context and DOM element being processed as placeholder.
       * Returns null to cancel placeholder processing or object to merge into pipeline context.
       * @param reactions
       * Lists of event types to listen on element and/or mutations to observe and/or custom function triggering
       * this pipeline.
       */
      extract<U extends object>(
        extractor: Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
      provide<U extends object>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Factory {
      /**
       * Starts definintion of tacocat pipeline.
       * @param base
       * Base context to be clones by all further pipelinesd.
       * @param comparer
       * Optional function returning true if two context objects are equal.
       * If not provided, then default comparer (JSON.stringify) will be used.
       */
      define<T extends object>(base?: T, comparer?: Comparer<T>): Extract<T>;
      event: {
        mount: string;
        observe: string;
        refresh: string;
        extract: string;
        reject: string;
        resolve: string;
        present: string;
        unmount: string;
      };
    }

    interface Instance<T extends object, U extends object> {
      explore(scope: Element, selector?: string): Placeholder<T, U>[];
      refresh(scope: Element, selector?: string): Placeholder<T, U>[];
    }

    interface Placeholder<T extends object, U extends object> {
      element: Element;
      state: State<T, U>;
    }

    interface Present<T extends object, U extends object> {
      observe(
        scope: Element,
        selector?: string,
        signal?: AbortSignal
      ): Instance<T, U>;
      pending(...presenters: PendingPresenter<T>[]): Present<T, U>;
      rejected(...presenters: RejectedPresenter<T>[]): Present<T, U>;
      resolved(...presenters: ResolvedPresenter<T, U>[]): Present<T, U>;
    }

    interface Reactions {
      events?: string[];
      mutations?: Mutations;
      trigger?: Trigger;
    }
  }
}

declare namespace Tacocat {
  module Internal {
    // --- aliases ---
    type Comparer = Tacocat.Engine.Comparer<any>;
    type Contextful = Tacocat.Contextful<any>;
    type ContextfulError = Tacocat.ContextfulError<any>;
    type ContextfulObject = Tacocat.ContextfulObject<any, any>;
    type Engine = Tacocat.Engine.Instance<any, any>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Listener = Tacocat.Engine.Trigger;
    type Mutations = Tacocat.Engine.Mutations;
    type PendingPresenter = Tacocat.Engine.PendingPresenter<any>;
    type Presenters = {
      pending: PendingPresenter[];
      rejected: RejectedPresenter[];
      resolved: ResolvedPresenter[];
    };
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Reactions = Tacocat.Engine.Reactions;
    type RejectedPresenter = Tacocat.Engine.RejectedPresenter<any>;
    type ResolvedPresenter = Tacocat.Engine.ResolvedPresenter<any, any>;
    type State = Contextful | ContextfulError | ContextfulObject;

    type ContextfulEvent = Tacocat.ContextEvent<any>;

    // --- types ---

    type Subscriber = (
      control: Control,
      element: Element,
      depot: Storage
    ) => void;

    type SelectorMatcher = (element: Element) => boolean;

    // --- interfaces ---
    interface Control {
      dispose(disposers: Tacocat.Engine.Disposers, key: any): boolean;
      release(key: any): void;
      signal?: AbortSignal;
    }

    interface Storage {
      deleteState(element: Element): void;
      getState(element: Element): State;
      setState(element: Element, state: State): void;
    }

    interface Subtree {
      matcher: SelectorMatcher;
      scope: Element;
      selector?: string;
    }
  }
}

declare namespace Tacocat {
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
      readonly id: string;
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
