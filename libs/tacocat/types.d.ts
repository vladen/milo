declare namespace Tacocat {
  // --- types ---
  type isError = (value: any) => value is Error;
  type isFunction = (value: any) => value is Function;
  type isNil = (value: any) => value is null | undefined;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isUndefined = (value: any) => value is undefined;

  type Contextful<T extends object> = { context?: T };
  type Rejection<T extends object> = Contextful<T> & Error;
  type Resolution<T extends object, U extends object> = Contextful<T> & U;
  type State<T extends object, U extends object> =
    | Contextful<T>
    | Rejection<T>
    | Resolution<T, U>;

  type hasContext = (candidate: any) => candidate is Contextful<any>;

  type Pending = 'pending';
  type Rejected = 'rejected';
  type Resolved = 'resolved';
  type Stage = Pending | Rejected | Resolved;

  type ContextfulEvent<T extends object> = Event & {
    state: Contextful<T>;
    stage: Stage;
  };

  type ContextfulError<T extends object> = Contextful<T> & Error;

  type SomeContext = { [key: string]: any };
  type SomeRejection = Rejection<SomeContext>;
  type SomeResolution = Resolution<SomeContext, SomeContext>;
  type SomeState =
    | Contextful<SomeContext>
    | SomeRejection
    | SomeResolution;

  type StateEvent = Event & {
    stage: Stage;
    state: SomeState
}

  module Engine {
    // --- types ---
    type Disposer = () => void;
    type Disposers = Disposer | Disposer[] | Disposer[][];

    type Extractor<T extends object, U extends object> = (
      context: T,
      element: Element,
      event: Event,
      signal?: AbortSignal
    ) => U | Promise<U>;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type PendingPresenter<T extends object> = (
      element: Element,
      state: Contextful<T>,
      event?: Event,
      signal?: AbortSignal
    ) => void;

    type Provider<T extends object, U extends object> = (
      contexts: T[],
      signal?: AbortSignal
    ) => Promise<Resolution<T, U>[]>;

    type RejectedPresenter<T extends object> = (
      element: Element,
      state: Rejection<T>,
      event?: Event,
      signal?: AbortSignal
    ) => void;

    type ResolvedPresenter<T extends object, U extends object> = (
      element: Element,
      state: Resolution<T, U>,
      event?: Event,
      signal?: AbortSignal
    ) => void;

    type Trigger = (
      element: Element,
      listener: (event?: Event) => void,
      signal?: AbortSignal
    ) => Disposer;

    // --- interfaces ---
    interface Channel<T extends object> {
      dispatch(
        target: EventTarget,
        state?: Contextful<T>,
        stage?: Stage,
        event?: Event
      ): void;
      listen: (
        target: EventTarget,
        listener: (state?: Contextful<T>, stage?: Stage, event?: Event) => void,
        options?: AddEventListenerOptions
      ) => Tacocat.Engine.Disposer;
      promise(target: EventTarget): Promise<T>;
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
      assign<T extends object, U extends object>(
        result: T,
        context: U
      ): T & Contextful<U>;
      /**
       * Starts definintion of tacocat pipeline.
       * @param base
       * Base context to be clones by all further pipelinesd.
       */
      define<T extends object>(base?: T): Extract<T>;
      channel: {
        pending: Channel<SomeContext>;
        rejected: Channel<SomeRejection>;
        resolved: Channel<SomeResolution>;
      };
      stage: {
        pending: Pending;
        rejected: Rejected;
        resolved: Resolved;
      };
    }

    interface Instance<T extends object, U extends object> {
      explore(scope?: Element, selector?: string): Placeholder<T, U>[];
      refresh(scope?: Element, selector?: string): Placeholder<T, U>[];
    }

    interface Placeholder<T extends object, U extends object> {
      element: Element;
      state: State<T, U>;
      wait(stage: Stage): Promise<Placeholder<T, U>>;
    }

    interface Present<T extends object, U extends object> {
      observe(
        scope: Element,
        selector: string,
        signal?: AbortSignal
      ): Instance<T, U>;
      present(
        stage: Pending,
        ...presenters: PendingPresenter<T>[]
      ): Present<T, U>;
      present(
        stage: Rejected,
        ...presenters: RejectedPresenter<T>[]
      ): Present<T, U>;
      present(
        stage: Resolved,
        ...presenters: ResolvedPresenter<T, U>[]
      ): Present<T, U>;
    }

    interface Reactions {
      events?: string[];
      mutations?: Mutations;
      trigger?: Trigger;
    }
  }

  module Internal {
    // --- aliases ---
    type Contextful = Tacocat.Contextful<any>;
    type ContextfulEvent = Tacocat.ContextfulEvent<any>;
    type Engine = Tacocat.Engine.Instance<any, any>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Listener = Tacocat.Engine.Trigger;
    type Mutations = Tacocat.Engine.Mutations;
    type PendingPresenter = Tacocat.Engine.PendingPresenter<any>;
    type Placeholder = Tacocat.Engine.Placeholder<any, any>;
    type Presenters = {
      pending: PendingPresenter[];
      rejected: RejectedPresenter[];
      resolved: ResolvedPresenter[];
    };
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Reactions = Tacocat.Engine.Reactions;
    type RejectedPresenter = Tacocat.Engine.RejectedPresenter<any>;
    type ResolvedPresenter = Tacocat.Engine.ResolvedPresenter<any, any>;
    type State = SomeContext | SomeRejection | SomeResolution;

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

  module Log {
    // --- types ---
    type Factory = {
      (namespace: string): Instance;
      common: Instance;
      level: Level;
      reset(environment?: string): void;
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
