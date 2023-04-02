import { expect, spy } from './tool.js';
import Log from '../../libs/tacocat/log.js';
import Control from '../../libs/tacocat/control.js';
import { Util } from '../../libs/tacocat/index.js';

describe('function "Control"', () => {
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
        expect(disposer1.called).to.be.false;
        control.dispose(disposer2, key);
        expect(disposer2.called).to.be.false;
        control.release(key);
        expect(disposer1.called).to.be.true;
        expect(disposer2.called).to.to.be.true;
      });
    });

    // TODO: fix test
    describe.skip('method "dispose"', () => {
      it('registers disposer calbacks called on abort signal', async () => {
        const controller = new AbortController();
        const control = Control({ signal: controller.signal });
        const disposer1 = spy();
        const disposer2 = spy();

        control.dispose(disposer1);
        expect(disposer1.called).to.be.false;
        control.dispose(disposer2);
        expect(disposer2.called).to.be.false;
        controller.abort('test');
        await Util.delay(100);

        expect(disposer1.called).to.be.true;
        expect(disposer2.called).to.be.true;
      });
    });
  });
});
