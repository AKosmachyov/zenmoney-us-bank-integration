import { it, describe } from 'node:test';
import assert from 'node:assert/strict';

import { toISODateString } from '../src/utils/date.ts';

describe('Date converter', () => {
	it('transform CSV date to ISO format', () => {
		assert.equal(toISODateString('07/17/2025'), '2025-07-17');
	});
});
