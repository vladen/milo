import { expect, spy } from './tools.js';
import Log from '../../libs/tacocat/log.js';
import Control from '../../libs/tacocat/control.js';

describe.skip('function "Control"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(Log.quietFilter);
  });

  it('returns an object', () => {
    expect(Control()).to.be.instanceOf(Object);
  });

  describe('object "control"', () => {
    describe('method "release"', () => {
      it('calls all disposer calbacks registered for the key', () => {
        const control = Control();
        const disposer1 = spy();
        const disposer2 = spy();
        const key = {};

        control.dispose(disposer1, key);
        expect(disposer1).not.to.have.been.called;
        control.dispose(disposer2, key);
        expect(disposer2).not.to.have.been.called;
        control.release(key);
        expect(disposer1).to.have.been.called;
        expect(disposer2).to.have.been.called;
      });
    });

    describe('method "dispose"', () => {
      it('registers disposer calbacks called on abort signal', () => {
        const controller = new AbortController();
        const control = Control({ signal: controller.signal });
        const disposer1 = spy();
        const disposer2 = spy();

        control.dispose(disposer1);
        expect(disposer1).not.to.have.been.called;
        control.dispose(disposer2);
        expect(disposer2).not.to.have.been.called;
        controller.abort();
        expect(disposer1).to.have.been.called;
        expect(disposer2).to.have.been.called;
      });
    });
  });
});
