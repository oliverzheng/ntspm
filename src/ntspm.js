var temp = require('temp');

var fs = require('fs')

var https = require('https')


var crypto = require('crypto')
var _ = require('underscore')
var version = require('./version')
function getHttpCacheFolder() {
    return temp.mkdirSync('ntspm_cache', '0777');
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
            var err = null;
            var data = null;
            res.setEncoding('utf8');
            if(res.statusCode !== 200) {
                err = 'status code ' + res.statusCode;
                res.on('data', function () {
                });
            } else {
                data = '';
                res.on('data', function (chunk) {
                    data += chunk;
                });
            }
            res.on('end', function () {
                fs.writeFileSync(urlFileCache, JSON.stringify({
                    err: err,
                    data: data
                }), 'utf-8');
                doCacheCallback();
            });
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
            if(nodeModuleNames.length === 0) {
                var typingsFileString = '';
                _.forEach(references, function (reference) {
                    typingsFileString += "///<reference path='" + reference + "'/>\r\n";
                });
                fs.writeFileSync(projectFolder + '/_typings.d.ts', typingsFileString, 'utf-8');
                return;
            }
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
                        var suitableVersion = version.findSuitableVersion(nodeModuleVersion, versions);
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
            }
        };
        processNext();
    });
}
updateProjectFolder('.');

