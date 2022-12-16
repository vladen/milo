/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect, spy } from './tools.js';
import Log, { debugFilter } from '../../libs/tacocat/log.js';
import Render from '../../libs/tacocat/render.js';
import { Failure, Product } from '../../libs/tacocat/product.js';

describe('function "Render"', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(debugFilter);
  });

  it('returns function', () => {
    expect(Render([])).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('calls only "pending" callback for undefined product', () => {
      const element = document.body;
      const pending = spy();
      const rejected = spy();
      const resolved = spy();
      const renderer = Render([{ pending, rejected, resolved }]);
      renderer(element);
      expect(pending).to.have.been.called;
      expect(rejected).not.to.have.been.called;
      expect(resolved).not.to.have.been.called;
    });

    it.only('calls only "rejected" callbacks for provider failure', () => {
      const element = document.body;
      const failure = Failure({}, new Error('Test'));
      const pending = spy();
      const rejected = spy();
      const resolved = spy();
      const renderer = Render([{ pending, rejected, resolved }]);
      renderer(element, failure);
      expect(pending).not.to.have.been.called;
      expect(rejected).to.have.been.calledOnceWith(element, failure);
      expect(resolved).not.to.have.been.called;
    });

    it('calls only "resolved" callbacks for provided product', () => {
      const element = document.body;
      const product = Product({}, 'Value');
      const pending = spy();
      const rejected = spy();
      const resolved = spy();
      const renderer = Render([{ pending, rejected, resolved }]);
      renderer(element, product);
      expect(pending).not.to.have.been.called;
      expect(resolved).to.has.been.calledOnceWith(element, product);
      expect(rejected).not.to.have.been.called;
    });
  });
});
