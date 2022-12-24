import { expect, spy } from './tools.js';
import Extract from '../../libs/tacocat/extract.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';

const declarer = () => true;

describe('function "Extract"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  it('returns function', () => {
    expect(Extract(declarer, [])).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('returns false if its argument is not a function', () => {
      expect(Extract(declarer, [null])({})).to.be.false;
    });

    it('returns false if the extractor callback returns not an object', () => {
      expect(Extract(declarer, [() => null])({})).to.be.false;
    });

    it('returns false if the extractor callback throws', () => {
      const extractor = () => {
        throw new Error('test');
      };
      expect(Extract(declarer, [extractor])({})).to.be.false;
    });

    it('returns true if all arguments are functions returning objects', () => {
      expect(Extract(declarer, [() => ({}), () => ({})])({})).to.be.true;
    });

    it('calls the extractor callback with the context and element arguments', () => {
      const context = {};
      const element = document.createElement('i');
      const extractor = spy(() => ({}));
      Extract(declarer, [extractor, extractor])(context, element);
      expect(extractor).to.have.been.calledTwice;
      expect(extractor).to.have.been.always.calledWithExactly(context, element);
    });

    it('merges all objects returned by the extractor calbacks into the context object', () => {
      const context = { test: '0' };
      const element = document.createElement('i');
      element.setAttribute('test1', ' 1');
      element.setAttribute('test2', ' 2');
      Extract(declarer, [
        (ctx, elem) => ({ test: ctx.test + elem.getAttribute('test1').trim() }),
        (ctx, elem) => ({ test: ctx.test + elem.getAttribute('test2').trim() }),
      ])(context, element);
      expect(context.test).to.equal('012');
    });
  });
});
