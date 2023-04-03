/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../node_modules/@types/chai/index.d.ts" />

import { expect, use } from '@esm-bundle/chai';
import { chaiDomDiff } from '@open-wc/semantic-dom-diff';
import { match, spy } from 'sinon';

use(chaiDomDiff);

export { expect, match, spy };
