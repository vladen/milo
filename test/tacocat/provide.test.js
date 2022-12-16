/// <reference path="../../libs/tacocat/types.d.ts" />

import { expect, spy } from './tools.js';
import Control from '../../libs/tacocat/control.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import Provide from '../../libs/tacocat/provide.js';
import { delay } from '../../libs/tacocat/utilities.js';
import { Failure, Product } from '../../libs/tacocat/product.js';

// use(chaiAsPromised);

const control = Control({ timeout: Infinity });

describe('function "Provide"', () => {
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
      const product1 = Product(context, 1);
      const failure1 = Failure(context, new Error('Error1'));
      const product2 = Product(context, 2);
      const failure2 = Failure(context, new Error('Error2'));
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
      const product1 = Product(context, 'one');
      const product2 = Product(context, 'two');
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
      const failure = Failure(context, new Error('Error'));
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
      expect(transformer1).not.to.be.called;
      expect(transformer2).not.to.be.called;
    });

    it('calls consumer callback for each provided product', async () => {
      const context = {};
      const product1 = Product(context, 1);
      const failure = Failure(context, new Error('Error1'));
      const product2 = Product(context, 2);
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
      const product = Product(context, 1);
      const provide = Provide(
        Control({ timeout: 1 }),
        () => delay(10).then(() => product),
        [],
      );
      const products = await provide([context], () => {});
      expect(products).to.be.instanceOf(Array);
      expect(products).to.be.empty;
    });
  });
});
