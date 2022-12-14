/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect } from '@esm-bundle/chai';
import { spy } from 'sinon';
import Control from '../../libs/tacocat/control.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import Provide from '../../libs/tacocat/provide.js';
import { delay } from '../../libs/tacocat/utilities.js';

// use(chaiAsPromised);

const control = Control({ timeout: Infinity });

describe('Provide', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  it('returns a function', () => {
    expect(Provide(Control({}), () => [], [])).to.be.instanceOf(Function);
  });

  describe('returned function', () => {
    it('returns a promise resolving to array of provided products', async () => {
      const context = {};
      const product1 = { context, value: 1 };
      const failure1 = { context, error: 'Error1' };
      const product2 = { context, value: 2 };
      const failure2 = { context, error: 'Error2' };
      const provide = Provide(
        control,
        () => Promise.resolve([
          Promise.resolve(product1),
          Promise.reject(failure1),
          Promise.resolve([product2]),
          Promise.reject(failure2),
        ]),
        [],
      );
      const products = await provide([context], () => { });
      expect(products).to.include(product1);
      expect(products).to.include(failure1);
      expect(products).to.include(product2);
      expect(products).to.include(failure2);
    });

    it('applies all transformers to each provided product', async () => {
      const context = {};
      const product1 = { context, value: 'one' };
      const product2 = { context, value: 'two' };
      const provide = Provide(
        control,
        () => [Promise.resolve(product1), Promise.resolve([product2])],
        [
          ({ value, ...rest }) => ({ ...rest, value: `${value} three` }),
          ({ value, ...rest }) => Promise.resolve({ ...rest, value: `${value} four` }),
        ],
      );
      const products = await provide([context], () => { });
      expect(products).to.deep.equal([
        { ...product1, value: `${product1.value} three four` },
        { ...product2, value: `${product2.value} three four` },
      ]);
    });

    it('does apply transformers to failure', async () => {
      const context = {};
      const failure = { context, error: 'Error' };
      const transformer1 = spy((product) => product);
      const transformer2 = spy((product) => product);
      const provide = Provide(
        control,
        () => Promise.reject(failure),
        [
          transformer1,
          transformer2,
        ],
      );
      await provide([context], () => { });
      expect(transformer1.called).to.be.false;
      expect(transformer2.called).to.be.false;
    });

    it('calls consumer callback for each provided product', async () => {
      const context = {};
      const product1 = { context, value: 1 };
      const failure = { context, error: 'Error1' };
      const product2 = { context, value: 2 };
      const consume = spy();
      const provide = Provide(control, () => [
        Promise.resolve(product1),
        Promise.resolve([Promise.reject(failure)]),
        Promise.resolve([product2]),
      ], []);
      await provide([context], consume);
      expect(consume.called).to.be.true;
      expect(consume.firstCall.firstArg).to.equal(product1);
      expect(consume.secondCall.firstArg).to.equal(product2);
      expect(consume.thirdCall.firstArg).to.equal(failure);
    });

    it('returns a promise fulfiling on timeout', async () => {
      const context = {};
      const product = { context, value: 1 };
      const provide = Provide(control, () => delay(2).then(() => product), []);
      const [error] = await provide([context], () => {});
      return expect(error).be.instanceOf(Error);
    });
  });
});
