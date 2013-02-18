///<reference path='../typings.d.ts'/>

import assert = module('assert');
import version = module('../src/version');

describe('version', () => {
	it('tokenizes fine', () => {
		assert.equal(JSON.stringify([1, 2, 3]), JSON.stringify(version.tokenizeVersion('1.2.3')));
	});
	
	it('version has priority', () => {
		assert.equal('3.0.17', version.findSuitableVersion('3.0.0', ['2.0.0', '3.0.17', '4.1.0']));
	});

	it('should work', () => {
		assert.equal('2.0.0', version.findSuitableVersion('2.7.0', ['2.0.0', '3.0.17', '4.1.0']));
	});

	it('should work', () => {
		assert.equal('2.0.1', version.findSuitableVersion('3.7.0', ['2.0.1', '4.0.17', '5.1.0']));
	});
	it('case2', () => {
		assert.equal('3.7.1', version.findSuitableVersion('3.7.0', ['3.5.1', '3.7.1', '3.6.0']));
	});
});
