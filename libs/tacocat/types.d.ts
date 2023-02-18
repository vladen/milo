declare namespace Tacocat {
  // --- types ---
  type isError = (value: any) => value is Error;
  type isFunction = (value: any) => value is Function;
  type isNil = (value: any) => value is null | undefined;
  type isObject = (value: any) => value is object;
  type isPromise = (value: any) => value is Promise<any>;
  type isUndefined = (value: any) => value is undefined;

  type Context<T> = { context?: T };
  type Failure<T> = Context<T> & { error: Error };
  type Product<T, U> = Context<T> & { value: U };
  type Result<T, U> = Failure<T> | Product<T, U>;
  type State<T, U> = Context<T> | Failure<T> | Product<T, U>;

  type hasContext = (candidate: any) => candidate is Context<any>;
  type isFailure = (candidate: any) => candidate is Failure<any>;
  type isProduct = (candidate: any) => candidate is Product<any, any>;
  type isResult = (candidate: any) => candidate is Result<any, any>;

  type Pending = 'pending';
  type Rejected = 'rejected';
  type Resolved = 'resolved';
  type Stage = Pending | Rejected | Resolved;

  type ContextEvent<T> = CustomEvent & { detail: Context<T> };
  type FailureEvent<T> = CustomEvent & {
    detail: Failure<T> & { stage: Rejected };
  };
  type ProductEvent<T, U> = CustomEvent & {
    detail: Product<T, U> & { stage: Resolved };
  };
  type ResultEvent<T, U> = FailureEvent<T> | ProductEvent<T, U>;
}
