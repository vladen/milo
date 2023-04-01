declare namespace Tacocat {
  // --- types ---
  type isBoolean = (value: any) => value is boolean;
  type isElement = (value: any) => value is Element;
  type isError = (value: any) => value is Error;
  type isFunction = (value: any) => value is Function;
  type isMap = (value: any) => value is Map<any, any>;
  type isNil = (value: any) => value is null | undefined;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isString = (value: any) => value is string;
  type isWeakMap = (value: any) => value is WeakMap<any, any>;

  type parseHrefParams = (element: HTMLAnchorElement) => URLSearchParams;
  type tryParseJson = (json: string, message?: string) => any | undefined;

  type Context<T extends object> = T & { id?: string };

  type Rejection<T extends object> = Contextful<T> & Error;
  type Resolution<T extends object, U extends object> = Contextful<T> & U;

  type hasContext = (candidate: any) => candidate is Contextful<any>;

  type Stale = 'stale';
  type Pending = 'pending';
  type Rejected = 'rejected';
  type Resolved = 'resolved';
  type Stage = Stale | Pending | Rejected | Resolved;

  type SomeContext = Context<{}>;
  type SomeRejection = Rejection<SomeContext>;
  type SomeResolution = Resolution<SomeContext, SomeContext>;
  type SomeResult = SomeRejection | SomeResolution;

  type CycleEvent = CustomEvent<{
    context: SomeContext;
    element: Element;
    stage: Stage;
    result: SomeResult;
  }>;

  type CycleEventListener = (event: CycleEvent, cause: Event) => void;

  type Writable<T> = { -readonly [K in keyof T]: T[K] };

  // --- interfaces ---

  interface Contextful<T extends object> {
    context: Context<T>;
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
    ) => Promise<U>;

    type Filter = (element: Element) => boolean;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type PendingPresenter<T extends object> = (
      element: Element,
      result: Contextful<T>,
      event?: Event,
      signal?: AbortSignal
    ) => undefined | Element;

    type Provider<T extends object, U extends object> = (
      contexts: T[],
      signal?: AbortSignal
    ) => Promise<Resolution<T, U>>[];

    type RejectedPresenter<T extends object> = (
      element: Element,
      result: Rejection<T>,
      event?: Event,
      signal?: AbortSignal
    ) => undefined | Element;

    type ResolvedPresenter<T extends object, U extends object> = (
      element: Element,
      result: Resolution<T, U>,
      event?: Event,
      signal?: AbortSignal
    ) => undefined | Element;

    type StalePresenter = (
      element: Element,
      event?: Event,
      signal?: AbortSignal
    ) => undefined | Element;

    type SomePlaceholder = Placeholder<SomeContext, SomeContext>;

    type Trigger = (
      element: Element,
      listener: (event?: Event) => void,
      signal?: AbortSignal
    ) => Disposer;

    // --- interfaces ---
    interface Cache<T> {
      getOrSet(keys: any | any[], factory: () => T): T;
    }

    interface Extract<T extends object> {
      /**
       * Defines function extracting context objects from placeholder elements and reactions triggering updates of placeholders.
       * @param extractor
       * A function accepting already extracted context and DOM element being processed as placeholder.
       * Returns null to cancel placeholder processing or object to merge into pipeline context.
       * Or an object to be assigned to already extracted context.
       * @param reactions
       * Lists of event types to listen on element and/or mutations to observe and/or custom function triggering
       * this pipeline.
       */
      extract<U extends object>(
        extractor: U | Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
      provide<U extends object>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Factory {
      /**
       * Defines CSS selector matching placeholder elements to be processed by tacocat.
       * @param selector
       */
      select<T extends object>(selector: string, filter?: Filter): Extract<T>;
      CssClass: {
        pending: string;
        rejected: string;
        resolved: string;
        stale: string;
      };
      Event: {
        pending: string;
        rejected: string;
        resolved: string;
        stale: string;
      };
      Log: Log.Factory;
      namespace: string;
      Stage: {
        pending: Pending;
        rejected: Rejected;
        resolved: Resolved;
        stale: Stale;
      };
    }

    interface Instance<T extends object, U extends object> {
      get placeholders(): Placeholder<T, U>[];
    }

    interface Placeholder<T extends object, U extends object> {
      readonly context: T;
      readonly element: Element;
      readonly event: Event;
      get promise(): Promise<U>;
      readonly result: null | Rejection<T> | Resolution<T, U>;
      readonly stage: Stage;
      update(context: T): void;
    }

    interface Present<T extends object, U extends object> {
      observe(scope?: Element, signal?: AbortSignal): Instance<T, U>;
      present(stage: Stale, presenter: StalePresenter): Present<T, U>;
      present(stage: Pending, presenter: PendingPresenter<T>): Present<T, U>;
      present(stage: Rejected, presenters: RejectedPresenter<T>): Present<T, U>;
      present(
        stage: Resolved,
        presenter: ResolvedPresenter<T, U>
      ): Present<T, U>;
    }

    interface Reactions {
      events?: string[];
      mutations?: Mutations;
      selector?: string;
      trigger?: Trigger;
    }
  }

  module Internal {
    // --- aliases ---
    type Engine = Tacocat.Engine.Instance<any, any>;
    type Extractor = Tacocat.Engine.Extractor<SomeContext, SomeContext>;
    type PendingPresenter = Tacocat.Engine.PendingPresenter<SomeContext>;
    type Placeholder = Writable<
      Omit<Engine.Placeholder<SomeContext, SomeContext>, 'promise' | 'update'>
    >;
    type Presenter = PendingPresenter | RejectedPresenter | ResolvedPresenter;
    type Presenters = {
      pending: PendingPresenter[];
      rejected: RejectedPresenter[];
      resolved: ResolvedPresenter[];
    };
    type Provider = Tacocat.Engine.Provider<SomeContext, SomeContext>;
    type RejectedPresenter = Tacocat.Engine.RejectedPresenter<SomeContext>;
    type ResolvedPresenter = Tacocat.Engine.ResolvedPresenter<
      SomeContext,
      SomeContext
    >;

    // --- types ---

    type Subscriber = (control: Control, cycle: Cycle) => void;

    // --- interfaces ---
    interface Control {
      dispose(disposers: Tacocat.Engine.Disposers, key: any): boolean;
      release(key: any): void;
      signal?: AbortSignal;
    }

    interface Cycle {
      get placeholders(): Placeholder[];
      get scope(): Element;
      get selector(): string;
      dispose(element: Element): void;
      exists(element: Element): boolean;
      extract(context: SomeContext): void;
      listen(
        types: string | string[],
        listener: Tacocat.CycleEventListener,
        options?: AddEventListenerOptions
      ): void;
      match(node: Node): Element;
      observe(element: Element, context?: SomeContext, event?: Event): void;
      present(context: SomeContext, element?: Element): void;
      provide(result: SomeResult): void;
      select(): Element[];
    }

    interface Reactions {
      events: string[];
      mutations: Tacocat.Engine.Mutations;
      selectors: string[];
      triggers: Tacocat.Engine.Trigger[];
    }

    interface Subtree {
      match(element: Element): boolean;
      scope: Element;
      select(element: Element): Element[];
    }
  }

  module Log {
    // --- types ---
    type isLog = (candidate: any) => candidate is Instance;

    type Factory = {
      (namespace: string): Instance;
      common: Instance;
      level: {
        debug: 'debug';
        error: 'error';
        info: 'info';
        warn: 'warn';
      };

      consoleWriter: Module;
      debugFilter: Module;
      quietFilter: Module;

      isLog: isLog;
      reset(environment?: string): void;
      use(...modules: Module[]): Factory;
    };

    type Level = 'debug' | 'error' | 'info' | 'warn';

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
