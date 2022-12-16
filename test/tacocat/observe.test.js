import { expect, spy } from './tools.js';
import Control from '../../libs/tacocat/control.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import Observe from '../../libs/tacocat/observe.js';
import Subtree from '../../libs/tacocat/subtree.js';
import { delay } from '../../libs/tacocat/utilities.js';

describe('function "Observe"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  let controller = new AbortController();
  afterEach(() => {
    controller.abort();
    controller = new AbortController();
    document.body.innerHTML = '';
  });

  it('returns function', () => {
    const observe = Observe(Control(), [], {});
    expect(observe).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('notifies "consumer" callback about matching element in the DOM tree', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [],
        { childList: true },
      );
      const element = document.createElement('p');
      document.body.append(element);
      observe(consumer, Subtree(document.body, 'p'));
      await delay(10);
      expect(consumer.firstCall.firstArg).to.deep.equal([{ context: {}, element }]);
    });

    it('notifies "consumer" callback about matching nested elements in the DOM tree', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [],
        { childList: true },
      );
      const parent = document.createElement('p');
      document.body.append(parent);
      const element1 = document.createElement('i');
      parent.append(element1);
      const element2 = document.createElement('i');
      parent.append(element2);
      observe(consumer, Subtree(document.body, 'i'));
      await delay(10);
      expect(consumer.firstCall.firstArg).to.deep.equal([
        { context: {}, element: element1 },
        { context: {}, element: element2 },
      ]);
    });

    it('notifies "consumer" callback about matching element added to the DOM tree', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [],
        { childList: true },
      );
      observe(consumer, Subtree(document.body, 'p'));
      const element = document.createElement('p');
      document.body.append(element);
      await delay(10);
      expect(consumer.firstCall.firstArg).to.deep.equal([{ context: {}, element }]);
    });

    it('notifies "consumer" callback about matching element removed from the DOM tree', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [],
        { childList: true },
      );
      const element = document.createElement('p');
      document.body.append(element);
      observe(consumer, Subtree(document.body, 'p'));
      element.remove();
      await delay(10);
      expect(consumer.firstCall.firstArg).to.deep.equal([
        { context: null, element },
      ]);
    });

    it('notifies "consumer" callback about attribute update on a matching element', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [],
        { attributes: true, attributeFilter: ['data-test'] },
      );
      const element = document.createElement('p');
      document.body.append(element);
      observe(consumer, Subtree(element));
      await delay(10);
      expect(consumer).to.have.been.called;
      expect(consumer.firstCall.firstArg).to.deep.equal([
        { context: {}, element },
      ]);
      element.dataset.test = 1;
      await delay(10);
      expect(consumer).to.have.been.calledTwice;
      expect(consumer.secondCall.firstArg).to.deep.equal([
        { context: {}, element },
      ]);
    });

    it.skip('notifies "consumer" callback about attribute update on a nested element', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [],
        { attributes: true, childList: true, subtree: true },
      );
      const scope = document.createElement('p');
      document.body.append(scope);
      const element1 = document.createElement('i');
      const element2 = document.createElement('i');
      scope.append(element1, element2);
      observe(consumer, Subtree(scope, 'i'));
      await delay(10);
      expect(consumer).to.have.been.called;
      expect(consumer.firstCall.firstArg).to.deep.equal([
        { context: {}, element: element1 },
        { context: {}, element: element2 },
      ]);
      element1.setAttribute('title', 'test1');
      element1.setAttribute('title', 'test2');
      await delay(10);
      expect(consumer).to.have.been.calledTwice;
      expect(consumer.secondCall.firstArg).to.deep.equal([
        { context: {}, element: element1 },
        { context: {}, element: element2 },
      ]);
    });

    it('notifies "observer" callback about event triggered on a matching element', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [(element, listener) => {
          element.addEventListener('click', listener);
          return () => element.removeEventListener('click', listener);
        }],
        { childList: true },
      );
      const element = document.createElement('p');
      document.body.append(element);
      observe(consumer, Subtree(document.body, 'p'));
      await delay(10);
      element.click();
      await delay(10);
      expect(consumer.secondCall.firstArg).to.deep.equal([
        { context: {}, element },
      ]);
    });

    it('notifies "observer" callback about event triggered on a nested matching element', async () => {
      const consumer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [(element, listener) => {
          element.addEventListener('click', listener);
          return () => element.removeEventListener('click', listener);
        }],
        { childList: true },
      );
      const parent = document.createElement('p');
      document.body.append(parent);
      const element = document.createElement('i');
      parent.append(element);
      observe(consumer, Subtree(document.body, 'p'));
      await delay(10);
      element.click();
      await delay(10);
      expect(consumer.secondCall.firstArg).to.deep.equal([
        { context: {}, element: parent },
      ]);
    });

    it('calls "disposer" callback returned by a "listener" when control signal is aborted', async () => {
      const disposer = spy();
      const observe = Observe(
        Control({ signal: controller.signal }),
        [() => disposer],
        { childList: true },
      );
      const element1 = document.createElement('p');
      const element2 = document.createElement('p');
      document.body.append(element1, element2);
      observe(() => {}, Subtree(document.body, 'p'));
      await delay(10);
      controller.abort();
      expect(disposer).to.have.been.calledTwice;
    });
  });
});
