var assert = require('assert')
var version = require('../src/version')
describe('version', function () {
    it('tokenizes fine', function () {
        assert.equal(JSON.stringify([
            1, 
            2, 
            3
        ]), JSON.stringify(version.tokenizeVersion('1.2.3')));
    });
    it('version has priority', function () {
        assert.equal('3.0.17', version.findSuitableVersion('3.0.0', [
            '2.0.0', 
            '3.0.17', 
            '4.1.0'
        ]));
    });
    it('should work', function () {
        assert.equal('2.0.0', version.findSuitableVersion('2.7.0', [
            '2.0.0', 
            '3.0.17', 
            '4.1.0'
        ]));
    });
    it('should work', function () {
        assert.equal('2.0.1', version.findSuitableVersion('3.7.0', [
            '2.0.1', 
            '4.0.17', 
            '5.1.0'
        ]));
    });
    it('case2', function () {
        assert.equal('3.7.1', version.findSuitableVersion('3.7.0', [
            '3.5.1', 
            '3.7.1', 
            '3.6.0'
        ]));
    });
});
