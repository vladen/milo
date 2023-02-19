declare namespace Tacocat {
  module Engine {
    // --- types ---
    type Builder<T extends object> = (context?: T) => Extract<T>;

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
    interface Extract<T> {
      compare(comparer: Comparer<T>): Provide<T>;
      extract<U extends object>(context: U): Extract<T & U>;
      extract<U extends object>(
        extractor: Extractor<T, U>,
        reactions?: Reactions
      ): Extract<T & U>;
      provide<U>(provider: Provider<T, U>): Present<T, U>;
    }

    interface Instance<T, U> {
      explore(scope: Element, selector?: string): Placeholder<T, U>[];
      refresh(scope: Element, selector?: string): Placeholder<T, U>[];
    }

    interface Observe<T, U> extends Instance<T, U> {
      observe(
        scope: Element,
        selector?: string,
        signal?: AbortSignal
      ): Instance<T, U>;
    }

    interface Placeholder<T, U> {
      element: Element;
      state: State<T, U>;
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
