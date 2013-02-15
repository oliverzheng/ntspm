///<reference path='../typings.d.ts'/>

var temp = require('temp');
import util = module('util');
import fs = module('fs');
import http = module('http');
import https = module('https');
import async = module('async');
import semver = module('semver');
import crypto = module('crypto');
import _ = module('underscore');

function getHttpCacheFolder() {
	var cachePath = process.env['TEMP'] + '/ntspm_cache';
	try { fs.mkdirSync(cachePath, '0777'); } catch (e) { }
	return cachePath;
}

function md5String(str) {
	var md5 = crypto.createHash('md5');
	md5.update(str, 'utf-8');
	return md5.digest('hex');
}

function downloadHttp(url: string, callback: (err: Error, data: string) => void) {
	var urlFileCache = getHttpCacheFolder() + '/' + md5String(url);
	//console.log(urlFileCache);
	//process.exit();

	function doCacheCallback() {
		var info = JSON.parse(fs.readFileSync(urlFileCache).toString('utf-8'));
		if (info.err != null) {
			callback(new Error(info.err), null);
		} else {
			callback(null, info.data);
		}
	}

	if (fs.existsSync(urlFileCache)) {
		doCacheCallback();
	} else {
		console.log(url);
		https.get(url, function (res: http.ClientResponse) {
			//console.log("Got response: " + res.statusCode);
			if (res.statusCode != 200) {
				fs.writeFileSync(urlFileCache, JSON.stringify({ err: 'status code ' + res.statusCode, data: null }), 'utf-8');
				doCacheCallback();
			} else {
				res.on('data', (data) => {
					var dataString = data.toString('utf-8');
					//console.log('data: ' + data);
					fs.writeFileSync(urlFileCache, JSON.stringify({ err: null, data: dataString }), 'utf-8');
					doCacheCallback();
				});
			}
			//console.log(res);
		}).on('error', function (e) {
			callback(e, '');
		});
	}
}

//function downloadModuleListing() {
//	downloadHttp('https://github.com/soywiz/ntspm-typings/tree/master/typings', (err, data) => {
//		// /soywiz/ntspm-typings/tree/master/typings/node
//		var reg = /js-directory-link/ig;
//		console.log(data.match(reg));
//		_.each(data.match(reg), (item) => {
//			console.log(item);
//		});
//		//console.log(reg.exec(data));
//		//console.log(data);
//	});
//}

function getNodeModules(path, callback) {
	var moduleVersions = {};
	var modulesPath = path + '/node_modules';
	fs.readdirSync(modulesPath).forEach((moduleName) => {
		if (!moduleName.match(/^\./)) {
			var modulePath = modulesPath + '/' + moduleName;
			var moduleInfo = JSON.parse(fs.readFileSync(modulePath + "/package.json").toString('utf-8'));
			moduleVersions[moduleInfo.name] = moduleInfo.version;
			//console.log(moduleInfo.name + ": " + moduleInfo.version);
		}
	});
	moduleVersions['node'] = '0.8.19';
	callback(moduleVersions);
}

function updateProjectFolder(projectFolder) {
	var typingsFolder = projectFolder + '/typings';
	try { fs.mkdirSync(typingsFolder, '0777'); } catch (e) { }

	getNodeModules(projectFolder, (nodeModules) => {
		var nodeModuleNames = _.keys(nodeModules);
		var processNext;
		var references = [];

		//console.log(nodeModuleNames);

		processNext = function () {
			var nodeModuleName = nodeModuleNames.shift();
			var nodeModuleVersion = nodeModules[nodeModuleName];
			if (nodeModuleName !== undefined) {
				console.log('Processing: ' + nodeModuleName);
				downloadHttp('https://api.github.com/repos/soywiz/ntspm-typings/contents/typings/' + nodeModuleName, (err, data) => {
					if (err) {
						console.log('  ' + err);
						processNext();
					} else {
						var versions = _.map(JSON.parse(data), (item) => item.name);
						var suitableVersion = semver.maxSatisfying(versions, nodeModuleVersion);
						if (suitableVersion === undefined) suitableVersion = versions[0];
						console.log('  Available versions: ' + JSON.stringify(versions));
						console.log('  Suitable version: ' + suitableVersion);
						//https://raw.github.com/soywiz/ntspm-typings/master/typings/node/0.8.0/node.d.t
						//'https://github.com/soywiz/ntspm-typings/raw/master/typings/' + nodeModuleName + '/' + suitableVersion + '/' + nodeModuleName + '.d.ts'

						var nodeModuleTypingFile = typingsFolder + '/' + nodeModuleName + '-' + suitableVersion + '.d.ts';

						references.push('./typings/' + nodeModuleName + '-' + suitableVersion + '.d.ts');

						if (fs.existsSync(nodeModuleTypingFile)) {
							processNext();
						} else {
							downloadHttp('https://raw.github.com/soywiz/ntspm-typings/master/typings/' + nodeModuleName + '/' + suitableVersion + '/' + nodeModuleName + '.d.ts', (err, data) => {
								//console.log('    ' + err);
								fs.writeFileSync(nodeModuleTypingFile, data, 'utf-8');
								//console.log(data);
								processNext();
							});
						}
					}
				});
			}
			// All processed
			else {
				var typingsFileString = '';
				_.forEach(references, (reference) => {
					typingsFileString += "///<reference path='" + reference + "'/>\r\n";
				});
				fs.writeFileSync(projectFolder + '/_typings.d.ts', typingsFileString, 'utf-8');
				//references
			}
		};

		processNext();

		//_.each(nodeModules, (version, name) => {
		//	console.log(name + ': ' + version);
		//});
		//
		//downloadHttp('https://api.github.com/repos/soywiz/ntspm-typings/contents/typings', (err, data) => {
		//	console.log(JSON.parse(data));
		//});
	})
}

updateProjectFolder('.');

//downloadModuleListing();