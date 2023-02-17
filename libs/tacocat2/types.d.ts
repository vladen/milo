interface Extraction<C extends object> {
  define(
    context: C
  ): Extraction<C>;
  define(
    factory: () => C | Promise<C>
  ): Extraction<C>;
  extract(
    configure: (context: C, element: HTMLElement, signal: AbortSignal) => C | Promise<C>
  ): Extraction<C>;
}

interface Observation {
  mutations(value: MutationObserverInit): Observation;
  scope(value: Element): Observation;
  selector(value: string): Observation;
}

interface Presentation<C extends object, V> {
  pending(
    configure: (element: HTMLElement, result: PendingResult<C>, signal: AbortSignal) => void
  ): Presentation<C, V>;
  rejected(
    configure: (element: HTMLElement, result: RejectedResult<C>, signal: AbortSignal) => void
  ): Presentation<C, V>;
  resolved(
    configure: (element: HTMLElement, result: ResolvedResult<C, V>, signal: AbortSignal) => void
  ): Presentation<C, V>;
}

interface Resolution<C extends object> {
  resolve<V>(
    configure: (
      contexts: C[],
      signal: AbortSignal
    ) => Promise<FulfilledResult<C, V>[]>,
  ): Transformation<C, V> & Presentation<C, V>
}

interface Transformation<C extends object, V> {
  transform<T>(
    configure: (result: FulfilledResult<C, V>, signal: AbortSignal) => Promise<FulfilledResult<C, V>>,
  ): Transformation<C, V> & Presentation<C, V>
}

type FulfilledResult<C, V> = RejectedResult<C> | ResolvedResult<C, V>;

interface PendingResult<C> {
  context: C;
  stage: 'pending';
}

interface RejectedResult<C> {
  context: C;
  error?: Error;
  stage: 'rejected';
}

interface ResolvedResult<C, V> {
  context: C;
  stage: 'rejected';
  value?: V;
}

interface Extractor<C extends object> {
  resolve<V>(configure: (resolution: Resolution<C>) => Resolution<C>): Presenter<C, V>;
}

interface Observer {
  extract<C extends object>(configure: (extraction: Extraction<C>) => Extraction<C>): Extractor<C>;
}

interface Presenter<C extends object, V> {
  present(configure: (presentation: Presentation<C, V>) => Presentation<C, V>): Presenter<C, V>;
}

interface Tacocat {
  observe(configure: (observation: Observation) => Observation): Observer;
}
