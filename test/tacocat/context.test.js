import { expect } from './tools.js';
import Log from '../../libs/tacocat/log.js';
import { hasContext, setContext } from '../../libs/tacocat/context.js';

describe.skip('module "context"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(Log.quietFilter);
  });

  describe('function "hasContext"', () => {
    it('returns true if object has context with id', () => {
      expect(hasContext({ context: { id: 'test' } })).to.be.true;
    });

    it('returns false if object has no context with id', () => {
      expect(hasContext()).to.be.false;
      expect(hasContext({ context: { id: null } })).to.be.false;
    });
  });

  describe('function "setContext"', () => {
    it('returns true if object has context with id', () => {
      const context = { id: 'test' };
      const result = { foo: 'bar' };
      expect(setContext(result, context)).to.equal({
        context,
        ...result,
      });
    });
  });
});
