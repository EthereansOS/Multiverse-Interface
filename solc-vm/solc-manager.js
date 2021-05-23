var fs = require('fs');
var path = require('path');
var os = require('os');

let osType = os.type().toLowerCase();

const binaryDirectory = path.join(__dirname, 'bin');

const getBinaryDirectory = function () {
  if (!fs.existsSync(binaryDirectory)) {
    try {
      fs.mkdirSync(binaryDirectory);
    } catch(e) {
    }
    if (!osType.startsWith('windows')) {
      try {
        fs.chmodSync(binaryDirectory, '0777');
      } catch(e) {
      }
    }
  }
  return binaryDirectory;
};

const getInstalledVersion = function () {
  if (!fs.existsSync(getBinaryDirectory())) {
    return [];
  }
  let files = fs.readdirSync(binaryDirectory);
  const binFiles = files.filter((item) => {
    return item.match(/^(solc-\d+\.\d+\.\d+)$/) || item.match(/^(solc-\d+\.\d+\.\d+.exe)$/);
  });
  const versions = binFiles.map((item) => {
    if (item.endsWith(".exe")) {
      return item.substring(5, item.length - 4);
    }
    return item.substring(5, item.length);
  });
  return versions;
};

const removeBinary = function (version) {
  if (!fs.existsSync(binaryDirectory)) return;
  fs.unlinkSync(path.join(binaryDirectory, binaryName(version)));
};

function binaryName (version) {
  if (osType.startsWith('windows')) {
    return 'solc-' + version + '.exe';
  }
  return 'solc-' + version;
}

function getBinary(version) {
  var binaryLocation = path.join(binaryDirectory, binaryName(version));
  if(osType.startsWith("windows") && hasBinaryVersion(version) && !fs.existsSync(binaryLocation)) {
    binaryLocation = path.join(binaryDirectory, `solc-${version}`, "solc.exe");
  }
  return binaryLocation;
}

function hasBinaryVersion(version) {
  return getInstalledVersion().filter(it => it.toLowerCase().indexOf(version) !== -1).length > 0;
}

module.exports = { getBinaryDirectory, hasBinaryVersion, getInstalledVersion, binaryName, removeBinary, getBinary };