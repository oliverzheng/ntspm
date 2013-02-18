
function tokenizeVersion(version) {
    return version.split('.').map(function (value) {
        return parseInt(value);
    });
}
exports.tokenizeVersion = tokenizeVersion;
function findSuitableTokenizedVersion(version, matchVersions, index) {
    if(index < version.length) {
        var matchVersions3 = matchVersions.filter(function (_version) {
            return version[index] == _version[index];
        }).sort(function (_version) {
            return version[index] - _version[index];
        });
        if(matchVersions3.length > 0) {
            return findSuitableTokenizedVersion(version, matchVersions3, index + 1);
        }
        var matchVersions2 = matchVersions.filter(function (_version) {
            return version[index] > _version[index];
        }).sort(function (_version) {
            return version[index] - _version[index];
        });
        if(matchVersions2.length > 0) {
            return findSuitableTokenizedVersion(version, matchVersions2, index + 1);
        }
    }
    return matchVersions[0];
}
function findSuitableVersion(javascriptVersion, typescriptVersions) {
    var typescriptTokenizedVersions = typescriptVersions.map(function (version) {
        return tokenizeVersion(version);
    });
    var suitableTokenizedVersion = findSuitableTokenizedVersion(tokenizeVersion(javascriptVersion), typescriptTokenizedVersions, 0);
    return typescriptVersions[typescriptTokenizedVersions.indexOf(suitableTokenizedVersion)];
}
exports.findSuitableVersion = findSuitableVersion;
