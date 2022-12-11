import Log from "./log";
import safe from "./safe";
import Tacocat from "./tacocat";
export { Log, safe, Tacocat };

const controller = new AbortController();
const tacocat = Tacocat(controller.signal)
  // defines initial context of placeholders
  .declare({ test1: 'test1' })
  .declare(({ test1 }) => ({ test2: test1 }))
  // updates placeholder context with the data extracted from placeholder element
  .extract((_, element) => ({
    foo: element.id,
  }), { attributeFilter: ['id'] })
  .extract((context, element) => ({
    ...context,
    bar: element.closest(`.class-${context.foo}`).getAttribute('bar'),
  }), { childList: true })
  // provides values for extracted contexts, async
  .provide(function* (contexts, signal) {
    for (const context of contexts) {
      if (signal.aborted) break;
      if (context.foo === 'foo') {
        yield Promise.resolve({ context, value: { baz: 42 } });
      } else {
        yield Promise.reject({ context });
      }
    }
  })
  // transforms only successfully provided values, async
  .transform((products) => products.map(
    ({ context, value }) => ({ context, value: { ...value, qux: value.baz.toString() } })
  ))
  // registers functions updating placeholder elements
  .render({
    // updates placeholder awaiting for its value to resolve
    pending(element) {
      element.classList.add('tacocat-pending');
    },
    // updates placeholder with resolution error
    rejected(element) {
      element.classList.add('tacocat-rejected');

    },
    // updates placeholder with resolved value
    resolved(element) {
      element.classList.add('tacocat-resolved');
    },
  })
  .render({
    pending(element, context) {
      element.innerHTML = context.foo;
    },
    resolved(element, context, value) {
      element.innerHTML = `${context.foo} ${value.baz} ${value.qux}`;
    },
  })
  .observe(document.body.firstElementChild)
  // starts processing by detecting existing and future placeholders
  // located within `document.body` and matching `span[data-osi]` selector
  .observe(document.body, 'span[data-foo]');

// searches for placeholders located within `document.body` and matching `span[data-osi]` selector
// returns array of objects referring to placeholder element, its context and latest value
tacocat
  .explore(document.body, 'span[data-osi]')
  .forEach(({ context, element, value }) => {
    console.log('Found osi placeholder:', element, context, value);
  });

// refreshes all placeholders located within `document.body` and matching `span[data-osi]` selector
tacocat.refresh(document.body, 'span[data-osi]');

// does not update placeholders, just returns a promise resolving to context-value pair
tacocat.resolve({
  bar: 'bar',
  foo: 'foo',
  test1: 'test1',
  test2: 'test2'
}).then(({ context, value }) => console.log('Resolved context:', context, value));

// stops observation of DOM, processing of placeholders and other pending operations
controller.abort();

