/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';
import Extract from '../../libs/tacocat/extract.js';
import Log, { debugFilter } from '../../libs/tacocat/log.js';

describe.skip('Extract', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(debugFilter);
  });

  it('returns function', () => {
    expect(Extract(() => 1, [])).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('returns value returned by "declarer" callback', () => {
      const context = {};
      const declarer = spy(() => context);
      expect(Extract(declarer, [])(document.body)).to.equal(context);
    });

    it('calls "extractor" callback with element and assigns returned value to context object', () => {
      const context = { test1: 'test1' };
      const extractor = spy(({ test1 }, element) => ({ test2: test1 + element.getAttribute('test2') }));
      const element = document.createElement('span');
      element.setAttribute('test2', ' test2');
      expect(Extract(() => context, [extractor])(element)).to.deep.equal({ ...context, test2: `${context.test1} test2` });
    });
  });
});
