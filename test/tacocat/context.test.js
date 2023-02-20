import { expect } from './tools.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import { getContextKey } from '../../libs/tacocat/context.js';

describe('module "context"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  describe('function "getContextKey"', () => {
    it('returns empty string for null and undefined', () => {
      expect(getContextKey()).to.equal('');
      expect(getContextKey(null)).to.equal('');
    });

    it('returns not empty string for an object', () => {
      expect(getContextKey({})).not.to.be.empty;
      expect(getContextKey([])).not.to.be.empty;
    });
  });
});
