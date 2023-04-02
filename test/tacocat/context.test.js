import { expect } from './tool.js';
import Log from '../../libs/tacocat/log.js';
import { Util } from '../../libs/tacocat/index.js';

describe('module "Util"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(Log.quietFilter);
  });

  describe('function "hasContext"', () => {
    const { hasContext } = Util;

    it('returns true if object has context with id', () => {
      expect(hasContext({ context: { id: 'test' } })).to.be.true;
    });

    it('returns false if object has no context with id', () => {
      expect(hasContext()).to.be.false;
      expect(hasContext({ context: { id: null } })).to.be.false;
    });
  });

  describe('function "setContext"', () => {
    const { setContext } = Util;

    it('returns true if object has context with id', () => {
      const context = { id: 'test' };
      const result = { foo: 'bar' };
      expect(setContext(result, context)).to.deep.equal({
        context,
        ...result,
      });
    });
  });
});
