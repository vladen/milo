import { expect } from '@esm-bundle/chai';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import { getContextKey, projectObject } from '../../libs/tacocat/context.js';

describe('context', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  describe('getContextKey', () => {
    it('returns empty string for null and undefined', () => {
      expect(getContextKey()).to.equal('');
      expect(getContextKey(null)).to.equal('');
    });

    it('returns not empty string for an object', () => {
      expect(getContextKey({})).not.to.be.empty;
      expect(getContextKey([])).not.to.be.empty;
    });
  });

  describe('projectObject', () => {
    it('returns an object having same properties as the passed object', () => {
      const passed = { boolean: true, number: 1, string: 'string' };
      expect(projectObject({}, passed)).to.deep.equal(passed);
    });

    it('setting property on the passed object projects it to the returned object', () => {
      const passed = { test: 1 };
      const returned = projectObject({}, passed);
      passed.test = 2;
      expect(returned.test).to.equal(2);
    });

    it('setting projected property on the returned object sets same property on the passed object', () => {
      const passed = { test: 1 };
      projectObject({}, passed).test = 2;
      expect(passed.test).to.equal(2);
    });

    it('setting custom property on the returned object does not update the passed object', () => {
      const passed = { test1: 1 };
      projectObject({}, passed).test2 = 2;
      expect(passed.test2).to.be.undefined;
    });
  });
});
