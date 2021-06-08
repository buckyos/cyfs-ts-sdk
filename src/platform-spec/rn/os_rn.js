const os = require('os-browserify/browser');
const {
    Platform
} = require('react-native');

os.platform = function () { Platform.OS };

module.exports = os;