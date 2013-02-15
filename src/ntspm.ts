///<reference path='../typings.d.ts'/>

import util = module('util');
import fs = module('fs');
import http = module('http');
import https = module('https');
import _ = module('underscore');

function downloadHttp(url: string, callback) {
	https.get(url, function (res: http.ClientResponse) {
		//console.log("Got response: " + res.statusCode);
		if (res.statusCode != 200) {
			callback(new Error('status code ' + res.statusCode), '');
		} else {
			res.on('data', (data) => {
				//console.log('data: ' + data);
				callback(null, data.toString('utf-8'));
			});
		}
		//console.log(res);
	}).on('error', function (e) {
		callback(e, '');
	});
}

function getNodeModules(path): any {
	var moduleVersions = {};
	var modulesPath = path + '/node_modules';
	fs.readdirSync(modulesPath).forEach((moduleName) => {
		var modulePath = modulesPath + '/' + moduleName;
		var moduleInfo = JSON.parse(fs.readFileSync(modulePath + "/package.json").toString('utf-8'));
		moduleVersions[moduleInfo.name] = moduleInfo.version;
		//console.log(moduleInfo.name + ": " + moduleInfo.version);
	});
	return moduleVersions;
}

_.each(getNodeModules('.'), (name, version) => {
	console.log(name + ': ' + version);
});
