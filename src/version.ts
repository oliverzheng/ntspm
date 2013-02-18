///<reference path='../typings.d.ts'/>

import _ = module('underscore');

export function tokenizeVersion(version: string): number[] {
	return version.split('.').map((value) => parseInt(value));
}

function findSuitableTokenizedVersion(version: number[], matchVersions: number[][], index: number): number[]{
	//console.log('-------------------');
	//console.log(version);
	//console.log(matchVersions);
	//console.log(index);
	if (index < version.length) {
		var matchVersions3 = matchVersions.filter(_version => version[index] == _version[index]).sort(_version => version[index] - _version[index]);
		if (matchVersions3.length > 0) return findSuitableTokenizedVersion(version, matchVersions3, index + 1);

		var matchVersions2 = matchVersions.filter(_version => version[index] > _version[index]).sort(_version => version[index] - _version[index]);
		if (matchVersions2.length > 0) return findSuitableTokenizedVersion(version, matchVersions2, index + 1);
	}

	return matchVersions[0];
}

/**
 * Finds the best version to use for a library. (x.y.z)
 * Criterias:
 * 
 *
 */
export function findSuitableVersion(javascriptVersion: string, typescriptVersions: string[]): string {
	var typescriptTokenizedVersions = typescriptVersions.map(version => tokenizeVersion(version));
	var suitableTokenizedVersion = findSuitableTokenizedVersion(
		tokenizeVersion(javascriptVersion),
		typescriptTokenizedVersions,
		0
	);
	return typescriptVersions[typescriptTokenizedVersions.indexOf(suitableTokenizedVersion)];
}
