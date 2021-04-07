var fs = require('fs');
var path = require('path');
var { exec } = require("child_process");
var arg = require('arg');
const parentModule = require('parent-module');

var exclusionsList = ['node_modules'];

function parseArgumentsIntoOptions(rawArgs) {
    var args = arg({
        '--input': String,
        '--output': String,
        '-i': '--input',
        '-o': '--output'
    }, {
        argv: rawArgs.slice(2),
    });
    return {
        inputFolder: args['--input'] || path.resolve(__dirname, 'contracts'),
        outputFolder: args['--output'] || path.resolve(__dirname, 'out')
    };
}

function cleanPath(path) {
    try {
        fs.rmdirSync(path, { recursive: true });
    } catch (e) {
    }
    try {
        fs.mkdirSync(path, { recursive: true });
    } catch (e) {
    }
}

function runProcess(processLocation, contract, outputContract) {
    var outputFolder = outputContract.split('\\').join('/');
    outputFolder = outputFolder.substring(0, outputFolder.lastIndexOf('/'));
    fs.mkdirSync(outputFolder, { recursive: true });
    return new Promise(function(ok, ko) {
        exec(`${processLocation} ${contract}`, (error, stdout) => {
            if (error) {
                return ko(error);
            }
            return ok(clean(outputContract, `${stdout}`.trim()));
        });
    });
}

function clean(contract, source) {
    return adjustAbicoderV2(contract, adjustABIEncoderV2(contract, eraseLicenses(contract, source)));
}

function eraseLicenses(contract, source) {
    try {
        var split = source.split('SPDX-License-Identifier:');
        if(split.length > 1) {
            var firstTranche = split[0];
            split.splice(0, 1);
            source = firstTranche + 'SPDX-License-Identifier:' + split.join('SPDX_License_Identifier:');
        }
    } catch (e) {
    }
    fs.writeFileSync(contract, source);
    return source;
}

function adjustABIEncoderV2(contract, source) {
    try {
        var split = source.split('pragma experimental ABIEncoderV2;');
        if(split.length > 1) {
            var firstTranche = split[0];
            split.splice(0, 1);
            source = firstTranche + 'pragma experimental ABIEncoderV2;' + split.join('//pragma experimental ABIEncoderV2;');
        }
    } catch (e) {
    }
    fs.writeFileSync(contract, source);
    return source;
}

function adjustAbicoderV2(contract, source) {
    try {
        var split = source.split('pragma abicoder v2;');
        if(split.length > 1) {
            var firstTranche = split[0];
            split.splice(0, 1);
            source = firstTranche + 'pragma abicoder v2;' + split.join('//pragma abicoder v2;');
        }
    } catch (e) {
    }
    fs.writeFileSync(contract, source);
    return source;
}

function isValidPath(p) {
    for(var exclusion of exclusionsList) {
        if(p.toLowerCase().indexOf(exclusion.toLowerCase()) !== -1) {
            return false;
        }
    }
    return true;
}

function getContractsList(p) {
    if(!isValidPath(p)) {
        return [];
    }
    if(!fs.lstatSync(p).isDirectory()) {
        return [p];
    }
    var contracts = [];
    var files = fs.readdirSync(p);
    for (var file of files) {
        var filePath = path.resolve(p, file);
        if (fs.lstatSync(filePath).isDirectory()) {
            contracts.push(...getContractsList(filePath));
        } else if (filePath.endsWith('.sol')) {
            contracts.push(filePath);
        }
    }
    return contracts;
};

function projectRoot(iF) {
    var root = iF ? path.dirname(parentModule()) : __dirname;
    root = root === __dirname && iF ? iF : root;
    for(var i = 0; i < 200; i++) {
        var package = path.resolve(root, 'package.json');
        var packageLock = path.resolve(root, 'package-lock.json');
        var nodeModules = path.resolve(root, 'node_modules');
        var truffleConfig = path.resolve(root, 'truffle-config.js');
        if(fs.existsSync(package) || 
        fs.existsSync(packageLock) ||
        fs.existsSync(nodeModules) ||
        fs.existsSync(truffleConfig)) {
            return root;
        }
        root = path.resolve(root, '..');
    }
}

module.exports = async function main(iF, oF) {
    var wasExisting = true;
    try {
        var truffleConfigFile = path.resolve(projectRoot(iF), 'truffle-config.js');
        wasExisting = fs.existsSync(truffleConfigFile);
        var options = parseArgumentsIntoOptions(process.argv);
        var inputFolder = iF || options.inputFolder;
        var outputFolder = oF || options.outputFolder;
        !wasExisting && fs.writeFileSync(truffleConfigFile, '');
        var processLocation = path.resolve('node_modules/.bin/truffle-flattener');
        !outputFolder.endsWith('.sol') && cleanPath(outputFolder);
        if(fs.lstatSync(inputFolder).isDirectory()) {
            var contracts = getContractsList(inputFolder);
            await Promise.all(contracts.map(it => runProcess(processLocation, it, it.split(inputFolder).join(outputFolder))));
        } else {
            await runProcess(processLocation, inputFolder, outputFolder);
        }
    } finally {
        try {
            !wasExisting && fs.unlinkSync(truffleConfigFile);
        } catch(e) {
        }
    }
}