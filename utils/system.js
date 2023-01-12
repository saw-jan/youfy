const { join } = require("path");
const { homedir } = require("os");

function isMac() {
    return process.platform === "darwin";
}

function isWin() {
    return process.platform === "win32";
}

function isLinux() {
    return process.platform === "linux";
}

function getConfigPath() {
    if (isMac) {
        return join(homedir(), ".youfy");
    } else if (isWin) {
        return join(homedir(), ".youfy");
    } else if (isLinux) {
        return join(homedir(), ".youfy");
    }
}

module.exports = {
    isMac,
    isWin,
    isLinux,
    getConfigPath,
};
