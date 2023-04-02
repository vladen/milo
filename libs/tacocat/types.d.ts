declare namespace Tacocat {
  // --- types ---
  type isBoolean = (value: any) => value is boolean;
  type isHTMLElement = (value: any) => value is HTMLElement;
  type isError = (value: any) => value is Error;
  type isFunction = (value: any) => value is Function;
  type isMap = (value: any) => value is Map<any, any>;
  type isNil = (value: any) => value is null | undefined;
  type isNumber = (value: any) => value is number;
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

  type Mounted = 'mounted';
  type Pending = 'pending';
  type Rejected = 'rejected';
  type Resolved = 'resolved';
  type Stage = Mounted | Pending | Rejected | Resolved;

  type SomeContext = Context<{}>;
  type SomeContextful = Contextful<SomeContext>;
  type SomeRejection = Rejection<SomeContext>;
  type SomeResolution = Resolution<SomeContext, object>;
  type SomeResult = SomeRejection | SomeResolution;

  type CycleEvent = CustomEvent<{
    context: SomeContext;
    element: HTMLElement;
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
      event: Event | undefined,
      control: Control,
    ) => Promise<U> | U;

    type Filter = (element: Element) => boolean;

    type MountedPresenter = (
      element: Element,
      event: Event | undefined,
      control: Control,
    ) => undefined | Element;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type PendingPresenter<T extends object> = (
      element: Element,
      result: Contextful<T>,
      event: Event | undefined,
      control: Control,
    ) => undefined | Element;

    type Provider<T extends object, U extends object> = (
      contexts: T[],
      control: Control,
    ) => Promise<Resolution<T, U>>[];

    type RejectedPresenter<T extends object> = (
      element: Element,
      result: Rejection<T>,
      event: Event | undefined,
      control: Control,
    ) => undefined | Element;

    type ResolvedPresenter<T extends object, U extends object> = (
      element: Element,
      result: Resolution<T, U>,
      event: Event | undefined,
      control: Control,
    ) => undefined | Element;

    type SomePlaceholder = Placeholder<Stage, SomeContext, object>;

    type Trigger = (
      element: Element,
      listener: (event?: Event) => void,
      control: Control,
    ) => Disposer;

    // --- interfaces ---
    interface Cache<T> {
      getOrSet(keys: any | any[], factory: () => T): T;
    }

    interface Control {
      dispose(disposers: Tacocat.Engine.Disposers, key: any): boolean;
      release(key: any): void;
      signal?: AbortSignal;
    }

    interface Extract<T extends object> {
      extract<U extends object>(
        extractor: Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
      provide<U extends object>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Select {
      /**
       * Defines function extracting context objects from placeholder elements and reactions triggering updates of placeholders.
       * @param extractor
       * A function accepting already extracted context and DOM element being processed as placeholder.
       * Returns null to cancel placeholder processing or object to merge into pipeline context.
       * @param reactions
       * Lists of event types to listen on element and/or mutations to observe and/or custom function triggering
       * this pipeline.
       */
      extract<T extends object>(
        extractor: Extractor<object, T>,
        reactions?: Reactions
      ): Extract<T>;
    }

    interface Factory {
      /**
       * Defines CSS selector matching placeholder elements to be processed by tacocat.
       * @param selector
       */
      select<T extends object>(selector: string, filter?: Filter): Select;
      CssClass: {
        mounted: string;
        pending: string;
        rejected: string;
        resolved: string;
      };
      Event: {
        mounted: string;
        pending: string;
        rejected: string;
        resolved: string;
      };
      Log: Log.Factory;
      Stage: {
        mounted: Mounted;
        pending: Pending;
        rejected: Rejected;
        resolved: Resolved;
      };
    }

    interface Instance<T extends object, U extends object> {
      get placeholders(): (
        | PendingPlaceholder<T, U>
        | RejectedPlaceholder<T, U>
        | ResolvedPlaceholder<T, U>
        | StalePlaceholder<T, U>
      )[];
    }

    interface Placeholder<T extends Stage, U extends object, V extends object> {
      readonly context: U;
      readonly element: HTMLElement;
      readonly event: Event;
      get promise(): Promise<V>;
      readonly result?: Contextful<U>;
      readonly stage: T;
      update(context: U): void;
    }

    interface StalePlaceholder<T extends object, U extends object>
      extends Placeholder<Mounted, T, U> {
    }

    interface PendingPlaceholder<T extends object, U extends object>
      extends Placeholder<Pending, T, U> {
    }

    interface RejectedPlaceholder<T extends object, U extends object>
      extends Placeholder<Rejected, T, U> {
      readonly result: Rejection<T>;
    }

    interface ResolvedPlaceholder<T extends object, U extends object>
      extends Placeholder<Resolved, T, U> {
      readonly result: Resolution<T, U>;
    }

    interface Present<T extends object, U extends object> {
      observe(options: {
        scope?: HTMLElement,
        reactions?: Reactions,
        signal?: AbortSignal
      }): Instance<T, U>;
      mounted(presenter: MountedPresenter): Present<T, U>;
      pending(presenter: PendingPresenter<T>): Present<T, U>;
      rejected(presenter: RejectedPresenter<T>): Present<T, U>;
      resolved(presenter: ResolvedPresenter<T, U>): Present<T, U>;
    }

    interface Reactions {
      events?: string[];
      mutations?: Mutations;
      trigger?: Trigger;
    }
  }

  module Internal {
    // --- aliases ---
    type Engine = Tacocat.Engine.Instance<any, any>;
    type Extractor = Tacocat.Engine.Extractor<SomeContext, SomeContext>;
    type PendingPresenter = Tacocat.Engine.PendingPresenter<SomeContext>;
    type Placeholder = Writable<
      Omit<Engine.SomePlaceholder, 'promise' | 'update'>
    >;
    type Presenter = PendingPresenter | RejectedPresenter | ResolvedPresenter;
    type Presenters = {
      pending: PendingPresenter[];
      rejected: RejectedPresenter[];
      resolved: ResolvedPresenter[];
      stale: ResolvedPresenter[];
    };
    type Provider = Tacocat.Engine.Provider<SomeContext, SomeContextful>;
    type RejectedPresenter = Tacocat.Engine.RejectedPresenter<SomeContext>;
    type ResolvedPresenter = Tacocat.Engine.ResolvedPresenter<
      SomeContext,
      SomeContextful
    >;

    // --- types ---

    type Subscriber = (control: Engine.Control, cycle: Cycle) => void;

    // --- interfaces ---
    interface Cycle {
      get placeholders(): Placeholder[];
      get scope(): HTMLElement;
      get selector(): string;
      dispose(element: HTMLElement): void;
      exists(element: HTMLElement): boolean;
      extract(context: SomeContext): void;
      listen(
        target: HTMLElement,
        types: string | string[],
        listener: Tacocat.CycleEventListener,
        options?: AddEventListenerOptions
      ): void;
      match(node: Node): HTMLElement;
      observe(element: HTMLElement, context?: SomeContext, event?: Event): void;
      present(context: SomeContext, element?: HTMLElement): void;
      provide(result: SomeResult): void;
      select(): Element[];
    }

    interface Reactions {
      events: string[];
      mutations: Tacocat.Engine.Mutations;
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
