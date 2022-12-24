import { expect, spy } from './tools.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import Declare from '../../libs/tacocat/declare.js';

describe('function "Declare"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  it('returns function', () => {
    expect(Declare([])).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('returns false if its argument is not an object', () => {
      expect(Declare([null])({})).to.be.false;
    });

    it('returns false if its argument is not a function returning an object', () => {
      expect(Declare([() => null])({})).to.be.false;
    });

    it('returns false if the declarer function throws', () => {
      const declarer = () => {
        throw new Error('test');
      };
      expect(Declare([declarer])({})).to.be.false;
    });

    it('returns true if all arguments are objects or functions returning objects', () => {
      expect(Declare([{}, () => ({})])({})).to.be.true;
    });

    it('merges declared objects and declarer function results into the context object', () => {
      const context = {};
      const object1 = { test1: 1 };
      const object2 = { test2: 2 };
      const object3 = { test3: 3 };
      Declare([object1, () => object2, object3])(context);
      expect(context).to.deep.equal({ ...object1, ...object2, ...object3 });
    });

    it('overrides previoudly declared property in the context object', () => {
      const context = { test: 1 };
      const object = { test: 2 };
      Declare([() => context, () => object])(context);
      expect(context).to.deep.equal(object);
    });

    it('calls declarer function with context argument', () => {
      const context = {};
      const object1 = { test: 1 };
      const object2 = { test: 2 };
      const declarer = spy(() => ({}));
      Declare([object1, declarer, () => object2, declarer])(context);
      expect(declarer).to.have.been.calledTwice;
      expect(declarer).to.have.been.always.calledWithExactly(context);
    });

    it('projects first declared object to the context object', () => {
      const context = {};
      const object1 = { test: 1 };
      const object2 = { test: 2 };
      Declare([object1, () => object2])(context);
      expect(context.test).to.equal(2);
      context.test = 3;
      expect(object1.test).to.equal(3);
    });

    it('does not project second declared object to the context object', () => {
      const context = {};
      const object1 = { test1: 1 };
      const object2 = { test2: 2 };
      Declare([() => object1, object2])(context);
      expect(context.test2).to.equal(2);
      context.test2 = 3;
      expect(context.test2).to.equal(3);
      expect(object2.test2).to.equal(2);
    });
  });
});
