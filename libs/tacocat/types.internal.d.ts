declare namespace Tacocat {
  module Internal {
    // --- aliases ---
    type Comparer = Tacocat.Engine.Comparer<any>;
    type Declarer = Tacocat.Engine.Declarer<any, any>;
    type Engine = Tacocat.Engine.Instance<any, any>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Failure = Tacocat.Failure<any>;
    type Listener = Tacocat.Engine.Trigger;
    type Mutations = Tacocat.Engine.Mutations;
    type PendingPresenter = Tacocat.Engine.PendingPresenter<any>;
    type Product = Tacocat.Product<any, any>;
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Presenters = Tacocat.Engine.Presenters<any, any>;
    type RejectedPresenter = Tacocat.Engine.RejectedPresenter<any>;
    type ResolvedPresenter = Tacocat.Engine.ResolvedPresenter<any, any>;
    type Result = Tacocat.Result<any, any>;
    type State = Tacocat.State<any, any>;
    type Transformer = Tacocat.Engine.Transformer<any, any, any>;

    type ContextEvent = Tacocat.ContextEvent<any>;
    type FailureEvent = Tacocat.FailureEvent<any>;
    type ProductEvent = Tacocat.ProductEvent<any, any>;
    type ResultEvent = ContextEvent | FailureEvent | ProductEvent;

    // --- types ---

    type SafeDeclarer = (control: Control, context: object) => Promise<boolean>;

    type SafeExtractor = (control: Control, element: Element) => void;

    type SafeObserver = (
      control: Control,
      subtree: Subtree
    ) => (
      observe: (control: Control, element: Element) => Tacocat.Engine.Disposer
    ) => void;

    type SafeProvider = (control: Control, element: Element) => void;

    type SafePresenter = (control: Control, element: Element) => void;

    type SafeTransformer = (control: Control, product: any) => Promise<boolean>;

    type SelectorMatcher = (element: Element) => boolean;

    // --- interfaces ---
    interface Control extends Tacocat.Engine.Control {
      dispose(disposers: Tacocat.Engine.Disposers, key: any): boolean;
      expire<T>(fallback: T): Promise<T>;
      release(key: any): void;
    }

    interface EventDispatcher<T> {
      dispatch(target: EventTarget, result?: T, event?: Event): void;
      listen: (
        target: EventTarget,
        listener: (event: CustomEvent & { detail: T }) => void,
        options?: AddEventListenerOptions
      ) => Tacocat.Engine.Disposer;
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
}
