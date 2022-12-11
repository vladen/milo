/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';
import Log, { debugFilter } from '../../libs/tacocat/log.js';
import Render from '../../libs/tacocat/render.js';

describe('Render', () => {
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
    it('calls pending renderer callback for undefined product and returns element returned by it', () => {
      const element = document.body;
      const pending = spy((e) => e);
      const rejected = spy();
      const resolved = spy();
      expect(Render([{ pending, rejected, resolved }])(element)).to.equal(element);
      expect(pending.firstCall.args).to.equal([element]);
      expect(rejected.called).to.equal(false);
      expect(resolved.called).to.equal(false);
    });

    it.only('calls rejected renderer callback for failure product and returns element returned by it', () => {
      const element = document.body;
      const product = { context: {}, error: 'Test' };
      const pending = spy();
      const rejected = spy((e) => e);
      const resolved = spy();
      expect(Render([{ pending, rejected, resolved }])(element, product)).to.equal(element);
      expect(rejected.firstCall.firstArg).to.equal(element);
      expect(pending.called).to.equal(false);
      expect(resolved.called).to.equal(false);
    });

    it('calls rejected renderer callback for failure product and returns element returned by it', () => {
      const element = document.body;
      const product = { context: {}, value: 'Value' };
      const pending = spy();
      const rejected = spy();
      const resolved = spy((e) => e);
      expect(Render([{ pending, rejected, resolved }])(element)).to.equal(element);
      expect(resolved.firstCall.args).to.equal([element, product]);
      expect(pending.called).to.equal(false);
      expect(rejected.called).to.equal(false);
    });

    it('attempts renderers until one returns element', () => {
      const element = document.body;
      const renderer1 = spy();
      const renderer2 = spy((e) => e);
      const renderer3 = spy();
      expect(Render([{ pending: [renderer1, renderer2, renderer3] }])(element)).to.equal(element);
      expect(renderer1.called).to.equal(true);
      expect(renderer2.called).to.equal(true);
      expect(renderer3.called).to.equal(false);
    });
  });
});
