/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />
/// <reference path="../../node_modules/@types/chai-as-promised/index.d.ts" />
/// <reference path="../../node_modules/@types/sinon-chai/index.d.ts" />
/* eslint-disable
    no-param-reassign,
    no-shadow,
    prefer-rest-params,
    prefer-spread,
    max-len,
    no-underscore-dangle
*/
import { expect, use } from '@esm-bundle/chai';
import chaiAsPromised from '@esm-bundle/chai-as-promised';
import { match, spy } from 'sinon';

/**
 * 'sinon-chai' package does not have yet '@esm-bundle/sinon-chai' counterpart
 * and cannot be imported from mjs file
 */
function sinonChai(chai, utils) {
  const { slice } = Array.prototype;

  function isSpy(putativeSpy) {
    return typeof putativeSpy === 'function'
      && typeof putativeSpy.getCall === 'function'
      && typeof putativeSpy.calledWithExactly === 'function';
  }

  function timesInWords(count) {
    switch (count) {
      case 1: {
        return 'once';
      }
      case 2: {
        return 'twice';
      }
      case 3: {
        return 'thrice';
      }
      default: {
        return `${count || 0} times`;
      }
    }
  }

  function isCall(putativeCall) {
    return putativeCall && isSpy(putativeCall.proxy);
  }

  function assertCanWorkWith(assertion) {
    if (!isSpy(assertion._obj) && !isCall(assertion._obj)) {
      throw new TypeError(`${utils.inspect(assertion._obj)} is not a spy or a call to a spy!`);
    }
  }

  function getMessages(spy, action, nonNegatedSuffix, always, args) {
    const verbPhrase = always ? 'always have ' : 'have ';
    nonNegatedSuffix = nonNegatedSuffix || '';
    if (isSpy(spy.proxy)) {
      spy = spy.proxy;
    }

    function printfArray(array) {
      return spy.printf.apply(spy, array);
    }

    return {
      affirmative() {
        return printfArray([`expected %n to ${verbPhrase}${action}${nonNegatedSuffix}`].concat(args));
      },
      negative() {
        return printfArray([`expected %n to not ${verbPhrase}${action}`].concat(args));
      },
    };
  }

  function sinonProperty(name, action, nonNegatedSuffix) {
    utils.addProperty(chai.Assertion.prototype, name, function () {
      assertCanWorkWith(this);

      const messages = getMessages(this._obj, action, nonNegatedSuffix, false);
      this.assert(this._obj[name], messages.affirmative, messages.negative);
    });
  }

  function sinonPropertyAsBooleanMethod(name, action, nonNegatedSuffix) {
    utils.addMethod(chai.Assertion.prototype, name, function (arg) {
      assertCanWorkWith(this);

      const messages = getMessages(this._obj, action, nonNegatedSuffix, false, [timesInWords(arg)]);
      this.assert(this._obj[name] === arg, messages.affirmative, messages.negative);
    });
  }

  function createSinonMethodHandler(sinonName, action, nonNegatedSuffix) {
    return function () {
      assertCanWorkWith(this);

      const alwaysSinonMethod = `always${sinonName[0].toUpperCase()}${sinonName.substring(1)}`;
      const shouldBeAlways = utils.flag(this, 'always') && typeof this._obj[alwaysSinonMethod] === 'function';
      const sinonMethodName = shouldBeAlways ? alwaysSinonMethod : sinonName;

      const messages = getMessages(this._obj, action, nonNegatedSuffix, shouldBeAlways, slice.call(arguments));
      this.assert(
        this._obj[sinonMethodName].apply(this._obj, arguments),
        messages.affirmative,
        messages.negative,
      );
    };
  }

  function sinonMethodAsProperty(name, action, nonNegatedSuffix) {
    const handler = createSinonMethodHandler(name, action, nonNegatedSuffix);
    utils.addProperty(chai.Assertion.prototype, name, handler);
  }

  function exceptionalSinonMethod(chaiName, sinonName, action, nonNegatedSuffix) {
    const handler = createSinonMethodHandler(sinonName, action, nonNegatedSuffix);
    utils.addMethod(chai.Assertion.prototype, chaiName, handler);
  }

  function sinonMethod(name, action, nonNegatedSuffix) {
    exceptionalSinonMethod(name, name, action, nonNegatedSuffix);
  }

  utils.addProperty(chai.Assertion.prototype, 'always', function () {
    utils.flag(this, 'always', true);
  });

  sinonProperty('called', 'been called', ' at least once, but it was never called');
  sinonPropertyAsBooleanMethod('callCount', 'been called exactly %1', ', but it was called %c%C');
  sinonProperty('calledOnce', 'been called exactly once', ', but it was called %c%C');
  sinonProperty('calledTwice', 'been called exactly twice', ', but it was called %c%C');
  sinonProperty('calledThrice', 'been called exactly thrice', ', but it was called %c%C');
  sinonMethodAsProperty('calledWithNew', 'been called with new');
  sinonMethod('calledBefore', 'been called before %1');
  sinonMethod('calledAfter', 'been called after %1');
  sinonMethod('calledImmediatelyBefore', 'been called immediately before %1');
  sinonMethod('calledImmediatelyAfter', 'been called immediately after %1');
  sinonMethod('calledOn', 'been called with %1 as this', ', but it was called with %t instead');
  sinonMethod('calledWith', 'been called with arguments %*', '%D');
  sinonMethod('calledOnceWith', 'been called exactly once with arguments %*', '%D');
  sinonMethod('calledWithExactly', 'been called with exact arguments %*', '%D');
  sinonMethod('calledOnceWithExactly', 'been called exactly once with exact arguments %*', '%D');
  sinonMethod('calledWithMatch', 'been called with arguments matching %*', '%D');
  sinonMethod('returned', 'returned %1');
  exceptionalSinonMethod('thrown', 'threw', 'thrown %1');
}

use(chaiAsPromised);
use(sinonChai);

export { expect, match, spy };
