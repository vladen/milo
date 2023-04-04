declare namespace Tacocat {
  // --- types ---
  type Context<T extends object> = T & { id?: string };
  type hasContext = (candidate: any) => candidate is Contextful<any>;
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
  type Mounted = 'mounted';
  type parseHrefParams = (element: HTMLAnchorElement) => URLSearchParams;
  type Pending = 'pending';
  type Rejected = 'rejected';
  type Rejection<T extends object> = Contextful<T> & Error;
  type Resolved = 'resolved';
  type Resolution<T extends object, U extends object> = Contextful<T> & U;
  type SomeContext = Context<{}>;
  type SomeContextful = Contextful<SomeContext>;
  type SomeRejection = Rejection<SomeContext>;
  type SomeResolution = Resolution<SomeContext, object>;
  type SomeResult = SomeRejection | SomeResolution;
  type Stage = Mounted | Pending | Rejected | Resolved;
  type Writable<T> = { -readonly [K in keyof T]: T[K] };
  type tryParseJson = (json: string, message?: string) => any | undefined;

  // --- interfaces ---
  interface Contextful<T extends object> {
    context: Context<T>;
  }

  module Engine {
    // --- types ---
    type Disposer = () => void;

    type Extractor<T extends object, U extends object> = (
      state: State & {
        context: T;
      }
    ) => Promise<U>;
    type Filter = (element: Element) => boolean;

    type MountedPresenter = (
      state: State
    ) => void | undefined | HTMLElement;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type PendingPresenter<T extends object> = (
      state: State & {
        context: T;
        result: Contextful<T>;
      }
    ) => void | undefined | HTMLElement;

    type Provider<T extends object, U extends object> = (
      state: {
        contexts: T[];
        control: Control,
      },
    ) => Promise<Resolution<T, U>>[];

    type RejectedPresenter<T extends object> = (
      state: State & {
        result: Rejection<T>;
      }
    ) => void | undefined | HTMLElement;

    type ResolvedPresenter<T extends object, U extends object> = (
      state: State & {
        context: T;
        result: Resolution<T, U>;
      }
    ) => void | undefined | HTMLElement;

    type SomePlaceholder = Placeholder<Stage, SomeContext, object>;

    type Trigger = (
      element: Element,
      listener: (event?: Event) => void,
      control: Control
    ) => void;

    // --- interfaces ---
    interface Cache<T> {
      getOrSet(keys: any[], factory: () => T): T;
    }

    interface Control {
      readonly alias: string;
      readonly scope: HTMLElement;
      readonly selector?: string;
      capture(disposers: Disposer | Disposer[], key: any): boolean;
      dispatch(target: EventTarget, event: Event): void;
      listen(
        target: EventTarget,
        types: string | string[],
        listener: EventListener,
        options?: boolean | AddEventListenerOptions
      ): boolean;
      signal?: AbortSignal;
    }

    interface Extract<T extends object> {
      extract<U extends object>(
        extractor: Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
      provide<U extends object>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Factory {
      /**
       * Defines CSS selector matching placeholder elements to be processed by tacocat.
       * @param selector
       */
      select(alias: string, selector: string, filter?: Filter): Select;
      Cache<T>(): Cache<T>;
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
      WeakCache<T>(): Cache<T>;
    }

    interface Instance<T extends object, U extends object> {
      get placeholders(): (
        | PendingPlaceholder<T, U>
        | RejectedPlaceholder<T, U>
        | ResolvedPlaceholder<T, U>
        | MountedPlaceholder<T, U>
      )[];
      select(selector: string, filter?: Filter): Iterator<(
        | PendingPlaceholder<T, U>
        | RejectedPlaceholder<T, U>
        | ResolvedPlaceholder<T, U>
        | MountedPlaceholder<T, U>
      )>;
    }

    interface MountedPlaceholder<T extends object, U extends object>
      extends Placeholder<Mounted, T, U> {}

    interface PendingPlaceholder<T extends object, U extends object>
      extends Placeholder<Pending, T, U> {}

    interface Placeholder<T extends Stage, U extends object, V extends object> {
      readonly context: U;
      readonly element: HTMLElement;
      readonly event: Event;
      get promise(): Promise<V>;
      readonly result?: Contextful<U>;
      readonly stage: T;
      update(context: U): void;
    }

    interface Present<T extends object, U extends object> {
      observe(options: {
        scope?: HTMLElement;
        reactions?: Reactions;
        signal?: AbortSignal;
      }): Instance<T, U>;
      mounted(presenter: MountedPresenter): Present<T, U>;
      pending(presenter: PendingPresenter<T>): Present<T, U>;
      rejected(presenter: RejectedPresenter<T>): Present<T, U>;
      resolved(presenter: ResolvedPresenter<T, U>): Present<T, U>;
    }

    interface Reactions {
      mutations?: Mutations;
      trigger?: Trigger;
    }

    interface RejectedPlaceholder<T extends object, U extends object>
      extends Placeholder<Rejected, T, U> {
      readonly result: Rejection<T>;
    }

    interface ResolvedPlaceholder<T extends object, U extends object>
      extends Placeholder<Resolved, T, U> {
      readonly result: Resolution<T, U>;
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

    interface State {
      readonly control: Control;
      readonly element: HTMLElement;
      readonly event?: Event;
      readonly scope: HTMLElement;
      readonly selector: string;
    }
  }

  module Internal {
    // --- types ---
    type CycleEvent = CustomEvent<State>;
    type CycleEventListener = (event: CycleEvent) => void;
    type Engine = Tacocat.Engine.Instance<any, any>;
    type Extractor = Tacocat.Engine.Extractor<SomeContext, object>;
    type PendingPresenter = Tacocat.Engine.PendingPresenter<SomeContext>;
    type Placeholder = Writable<
      Omit<Engine.SomePlaceholder, 'promise' | 'update'>
    >;
    type Presenter = PendingPresenter | RejectedPresenter | ResolvedPresenter;
    type Presenters = {
      mounted: ResolvedPresenter[];
      pending: PendingPresenter[];
      rejected: RejectedPresenter[];
      resolved: ResolvedPresenter[];
    };
    type Provider = Tacocat.Engine.Provider<SomeContext, SomeContextful>;
    type RejectedPresenter = Tacocat.Engine.RejectedPresenter<SomeContext>;
    type ResolvedPresenter = Tacocat.Engine.ResolvedPresenter<
      SomeContext,
      SomeContextful
    >;
    type Subscriber = (control: Control, cycle: Cycle) => void;

    // --- interfaces ---
    interface Control extends Engine.Control {
      release(key: any): void;
    }

    interface Cycle {
      readonly control: Control;
      get placeholders(): Placeholder[];
      dispose(element: HTMLElement): void;
      exists(element: HTMLElement): boolean;
      extract(context: SomeContext): void;
      listen(
        target: HTMLElement,
        type: string | string[],
        listener: CycleEventListener,
        options?: AddEventListenerOptions
      ): void;
      match(node: Node): HTMLElement;
      observe(element: HTMLElement, context?: SomeContext, event?: Event): void;
      present(context: SomeContext, element?: HTMLElement): void;
      provide(result: SomeResult): void;
    }

    interface Reactions {
      mutations: Tacocat.Engine.Mutations;
      trigger: Tacocat.Engine.Trigger | Tacocat.Engine.Trigger[];
    }

    interface State extends Engine.State {
      readonly context: SomeContext;
      readonly stage: Stage;
      readonly result: SomeResult;
    }
  }

  module Log {
    // --- types ---
    type Factory = {
      (namespace: string, alias?: string): Instance;
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

      reset(environment?: string): void;
      use(...modules: Module[]): Factory;
    };

    type Level = 'debug' | 'error' | 'info' | 'warn';

    // --- interfaces ---
    interface Instance {
      readonly alias: string;
      readonly id: string;
      readonly namespace: string;
      debug(message: string, ...params: any[]): void;
      error(message: string, ...params: any[]): void;
      module(name: string, alias?: string): Instance;
      info(message: string, ...params: any[]): void;
      warn(message: string, ...params: any[]): void;
    }

    interface Module {
      filter?(record: Record): boolean;
      writer?(record: Record): void;
    }

    interface Record {
      alias?: string;
      instance: number;
      level: Level;
      message: string;
      namespace: string;
      params: any[];
      timestamp: number;
    }
  }
}
