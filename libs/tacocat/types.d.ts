declare namespace Tacocat {
  type isFunction = (value: any) => value is Function;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isUndefined = (value: any) => value is undefined;

  type Safe<T> = (
    message: string,
    callback: (() => T) | Promise<T>,
    log?: Log.Instance
  ) => T | undefined;

  module Engine {
    // --- types ---

    type Declarer<T, U extends object> = (context: T) => U;

    type Effect = void | undefined | null | Element;

    type Extractor<T, U extends object> = (context: T, element: Element) => U;

    type Factory = (
      signal?: AbortSignal,
      timeout?: number
    ) => {
      declare<T extends object>(context: T): Declare<T>;
      declare<T extends object>(declarer: Declarer<object, T>): Declare<T>;
    };

    type Failure<T> = { context: T; error: Error };

    type Listener = (element: Element, listener: (event: Event) => void) => () => void;

    type Mutations = Omit<
      MutationObserverInit,
      'attributeOldValue' | 'characterDataOldValue'
    >;

    type Product<T, U> = { context: T; value?: U };

    type Provider<T, U> = (contexts: T[], signal: AbortSignal) => Results<T, U>;

    type Results<T, U> =
      | undefined
      | null
      | Iterable<Product<T, U>>
      | Iterable<Promise<Product<T, U> | Iterable<Product<T, U>>>>
      | Promise<Results<T, U>>;

    type Transformer<T, U extends T, V, W extends V> = (
      product: Product<T, V>
    ) => Product<U, W>;

    // --- interfaces ---

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
      explore(scope: Element, selector?: string): Placeholder<T, U>[];

      observe(scope: Element, selector?: string): Observe<T, U>;

      refresh(scope: Element, selector?: string): void;

      resolve(context: T): Promise<Product<T, U>>;
    }

    interface Placeholder<T, U> {
      context: T;
      element: Element;
      value?: U;
    }

    interface Render<T, U> {
      observe(scope: Element, selector?: string): Observe<T, U>;

      render(renderers: Renderers<T, U>): Render<T, U>;
    }

    interface Renderers<T, U> {
      /**
       * @returns
       * - undefined - the template cannot be applied to this context/value
       * - null - the template removed/replaced placeholder element and it should not be handled anymore
       * - Element - the template either updated existing placeholder element or created new one, it should be handled
       */
      pending?(element: Element): Effect;

      rejected?(element: Element, failure: Failure<T>): Effect;

      resolved?(element: Element, product: Product<T, U>): Effect;
    }

    interface Transform<T, U> {
      transform<V extends T, W extends U>(
        transformer: Transformer<T, V, U, W>
      ): Transform<T, U & V>;

      render(renderers: Renderers<T, U>): Render<T, U>;
    }
  }

  module Internal {
    type CombinedExtractor = (element: Element) => object;
    type Declarer = Tacocat.Engine.Declarer<any, any>;
    type CombinedDeclarer = Tacocat.Engine.Declarer<any, any>;
    type Engine = Omit<Tacocat.Engine.Observe<any, any>, 'observe'>;
    type Extractor = Tacocat.Engine.Extractor<any, any>;
    type Failure = Tacocat.Engine.Failure<any> & { key: string };
    type Listener = Tacocat.Engine.Listener;
    type Observer = (
      consumer: (placeholders: Placeholder[]) => void,
      listeners: Listener[],
      scope: Element,
      selector?: string
    ) => void;
    type Placeholder = Tacocat.Engine.Placeholder<any, any> & { key: string };
    type Processor = (
      product: Tacocat.Internal.Product
    ) => Tacocat.Internal.Product;
    type Product = Tacocat.Engine.Product<any, any> & { key: string };
    type Provider = Tacocat.Engine.Provider<any, any>;
    type Renderer = (
      element: Element,
      result?: Tacocat.Engine.Product<any, any> | Tacocat.Engine.Failure<any>
    ) => Tacocat.Engine.Effect;
    type Renderers = Tacocat.Engine.Renderers<any, any>;
    type Resolver = (products: Tacocat.Internal.Product[]) => void;
    type Results = Tacocat.Engine.Results<any, any>;
    type Transformer = (product: Product) => Product;
  }

  module Log {
    // --- types ---

    type Factory = {
      (namespace: string): Instance;
      common: Instance;
      level: Level;
      use(...modules: Module[]): Factory;
    };

    type Level = {
      debug: 'debug';
      error: 'error';
      info: 'info';
      warn: 'warn';
    };

    // --- interfaces ---

    interface Record {
      level: Level;
      message: string;
      namespace: string;
      parameters: any[];
      timestamp: number;
    }

    interface Module {
      filter(record: Record): boolean;
      write(record: Record): void;
    }

    interface Instance {
      readonly namespace: string;
      debug(message: string, ...params: any[]): void;
      error(message: string, ...params: any[]): void;
      module(name: string): Instance;
      info(message: string, ...params: any[]): void;
      warn(message: string, ...params: any[]): void;
    }
  }
}
