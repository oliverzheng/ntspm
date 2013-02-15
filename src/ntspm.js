
var fs = require('fs')

var https = require('https')
var _ = require('underscore')
function downloadHttp(url, callback) {
    https.get(url, function (res) {
        if(res.statusCode != 200) {
            callback(new Error('status code ' + res.statusCode), '');
        } else {
            res.on('data', function (data) {
                callback(null, data.toString('utf-8'));
            });
        }
    }).on('error', function (e) {
        callback(e, '');
    });
}
function getNodeModules(path) {
    var moduleVersions = {
    };
    var modulesPath = path + '/node_modules';
    fs.readdirSync(modulesPath).forEach(function (moduleName) {
        var modulePath = modulesPath + '/' + moduleName;
        var moduleInfo = JSON.parse(fs.readFileSync(modulePath + "/package.json").toString('utf-8'));
        moduleVersions[moduleInfo.name] = moduleInfo.version;
    });
    return moduleVersions;
}
_.each(getNodeModules('.'), function (name, version) {
    console.log(name + ': ' + version);
});
