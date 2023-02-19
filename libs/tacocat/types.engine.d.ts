declare namespace Tacocat {
  module Engine {
    // --- types ---
    type Builder<T extends object> = (context?: T) => Declare<T>;

    type Constructor<T extends object, U extends object, V> = (pipeline: {
      declare(declarer: Declarer<object, T>): void;
      extract(extractor: Extractor<T, U>, options?: Reactions): void;
      compare(comparer: Comparer<T>): void;
      provide(provider: Provider<U, V>): void;
      present(presenters: Presenters<U, V>): void;
    }) => (activation: {
      scope: Element;
      selector?: string;
      signal?: AbortSignal;
      timeout?: number;
    }) => Instance<U, V>;

    type Comparer<T> = (one: T, two: T) => boolean;

    type Declarer<T, U extends object> = (
      context: T,
      signal?: AbortSignal
    ) => Promise<U>;

    type Disposer = () => void;
    type Disposers = Disposer | Disposer[] | Disposer[][];

    type Extractor<T, U extends object> = (
      event: ContextEvent<T>,
      signal?: AbortSignal
    ) => Promise<U>;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type PendingPresenter<T> = (element: Element, state: Context<T>) => void;

    type Provider<T, U> = (
      contexts: T[],
      signal?: AbortSignal
    ) => Promise<U[]> | Promise<Promise<U[]>[]>;

    type RejectedPresenter<T> = (element: Element, state: Failure<T>) => void;

    type ResolvedPresenter<T, U> = (
      element: Element,
      state: Product<T, U>
    ) => void;

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
      extract<U extends object>(
        extractor: Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
    }

    interface Extract<T> {
      compare(comparer: Comparer<T>): Provide<T>;
      extract<U extends object>(
        extractor: Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
      provide<U>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Instance<T, U> {
      explore(scope: Element, selector?: string): Placeholder<T, U>[];
      refresh(scope: Element, selector?: string): Promise<Placeholder<T, U>[]>;
      resolve(context: T): Promise<Product<T, U>>;
    }

    interface Observe<T, U> extends Instance<T, U> {
      observe(scope: Element, selector?: string): Observe<T, U>;
    }

    interface Placeholder<T, U> {
      element: Element;
      state: State<T, U>
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
      provide<U>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Reactions {
      events?: string[];
      mutations?: Mutations;
      trigger?: Trigger;
    }
  }
}
