/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';
import Log, { debugFilter } from '../../libs/tacocat/log.js';
import Declare from '../../libs/tacocat/declare.js';

describe('Declare', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(debugFilter);
  });

  it('returns function', () => {
    expect(Declare([])).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('creates context merged of declared objects and declarer function results', () => {
      const object1 = { test1: 1 };
      const object2 = { test2: 2 };
      const object3 = { test3: 3 };
      const object4 = { test4: 4 };
      const declared = Declare([object1, () => object2, object3, () => object4])({});
      expect(declared).to.be.eql({ ...object1, ...object2, ...object3, ...object4 });
    });

    it('overrides previoudly declared property', () => {
      const object1 = { test: 1 };
      const object2 = { test: 2 };
      const declared = Declare([object1, () => object2])({});
      expect(declared).to.be.eql(object2);
    });

    it('passes already constructed context to the next declarer', () => {
      const object1 = { test: 1 };
      const object2 = { test: 2 };
      const declarer = spy(() => ({}));
      Declare([object1, () => object2, declarer])({});
      expect(declarer.firstCall.firstArg).to.be.eql(object2);
    });

    it('projects first static context to the returned object', () => {
      const context = { test: 1 };
      const object1 = { test1: 2 };
      const object2 = { test2: 3 };
      const object = Declare([context, object1, () => object2])({});
      expect(object.test).to.be.equal(1);
      object.test = 4;
      expect(context.test).to.be.equal(4);
    });

    it('does not project not first context to the returned object', () => {
      const context = { test: 1 };
      const object1 = { test1: 2 };
      const object = Declare([() => object1, context])({});
      expect(object.test).to.be.equal(1);
      object.test = 4;
      expect(context.test).to.be.equal(1);
      expect(object.test).to.be.equal(4);
    });
  });
});
