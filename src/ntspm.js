var temp = require('temp');

var fs = require('fs')

var https = require('https')


var crypto = require('crypto')
var _ = require('underscore')
function getHttpCacheFolder() {
    var cachePath = process.env['TEMP'] + '/ntspm_cache';
    try  {
        fs.mkdirSync(cachePath, '0777');
    } catch (e) {
    }
    return cachePath;
}
function md5String(str) {
    var md5 = crypto.createHash('md5');
    md5.update(str, 'utf-8');
    return md5.digest('hex');
}
function downloadHttp(url, callback) {
    var urlFileCache = getHttpCacheFolder() + '/' + md5String(url);
    function doCacheCallback() {
        var info = JSON.parse(fs.readFileSync(urlFileCache).toString('utf-8'));
        if(info.err != null) {
            callback(new Error(info.err), null);
        } else {
            callback(null, info.data);
        }
    }
    if(fs.existsSync(urlFileCache)) {
        doCacheCallback();
    } else {
        console.log(url);
        https.get(url, function (res) {
            if(res.statusCode != 200) {
                fs.writeFileSync(urlFileCache, JSON.stringify({
                    err: 'status code ' + res.statusCode,
                    data: null
                }), 'utf-8');
                doCacheCallback();
            } else {
                res.on('data', function (data) {
                    var dataString = data.toString('utf-8');
                    fs.writeFileSync(urlFileCache, JSON.stringify({
                        err: null,
                        data: dataString
                    }), 'utf-8');
                    doCacheCallback();
                });
            }
        }).on('error', function (e) {
            callback(e, '');
        });
    }
}
function getNodeModules(path, callback) {
    var moduleVersions = {
    };
    var modulesPath = path + '/node_modules';
    fs.readdirSync(modulesPath).forEach(function (moduleName) {
        if(!moduleName.match(/^\./)) {
            var modulePath = modulesPath + '/' + moduleName;
            var moduleInfo = JSON.parse(fs.readFileSync(modulePath + "/package.json").toString('utf-8'));
            moduleVersions[moduleInfo.name] = moduleInfo.version;
        }
    });
    moduleVersions['node'] = '0.8.19';
    callback(moduleVersions);
}
function versionToNumber(version) {
    var parts = String(version).split('.');
    var version = 0;
    while(parts.length > 0) {
        version += parseInt(parts.shift());
        version *= 1000;
    }
    return version;
}
function findSuitableVersion(javascriptVersion, typescriptVersions) {
    return _.max(typescriptVersions, function (version) {
        return versionToNumber(version) - versionToNumber(javascriptVersion);
    });
}
function updateProjectFolder(projectFolder) {
    var typingsFolder = projectFolder + '/typings';
    try  {
        fs.mkdirSync(typingsFolder, '0777');
    } catch (e) {
    }
    getNodeModules(projectFolder, function (nodeModules) {
        var nodeModuleNames = _.keys(nodeModules);
        var processNext;
        var references = [];
        processNext = function () {
            var nodeModuleName = nodeModuleNames.shift();
            var nodeModuleVersion = nodeModules[nodeModuleName];
            if(nodeModuleName !== undefined) {
                console.log('Processing: ' + nodeModuleName + '@' + nodeModuleVersion);
                downloadHttp('https://api.github.com/repos/soywiz/ntspm-typings/contents/typings/' + nodeModuleName, function (err, data) {
                    if(err) {
                        console.log('  ' + err);
                        processNext();
                    } else {
                        var versions = _.map(JSON.parse(data), function (item) {
                            return item.name;
                        });
                        var suitableVersion = findSuitableVersion(nodeModuleVersion, versions);
                        console.log('  Available versions: ' + JSON.stringify(versions));
                        console.log('  Suitable version: ' + suitableVersion);
                        var nodeModuleTypingFile = typingsFolder + '/' + nodeModuleName + '.d.ts';
                        references.push('./typings/' + nodeModuleName + '.d.ts');
                        if(fs.existsSync(nodeModuleTypingFile)) {
                            processNext();
                        } else {
                            downloadHttp('https://raw.github.com/soywiz/ntspm-typings/master/typings/' + nodeModuleName + '/' + suitableVersion + '/' + nodeModuleName + '.d.ts', function (err, data) {
                                fs.writeFileSync(nodeModuleTypingFile, data, 'utf-8');
                                processNext();
                            });
                        }
                    }
                });
            } else {
                var typingsFileString = '';
                _.forEach(references, function (reference) {
                    typingsFileString += "///<reference path='" + reference + "'/>\r\n";
                });
                fs.writeFileSync(projectFolder + '/_typings.d.ts', typingsFileString, 'utf-8');
            }
        };
        processNext();
    });
}
updateProjectFolder('.');
