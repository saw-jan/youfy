const { difference } = require("lodash");

const PLAYER = {
    currentIdx: 0,
    current: null,
    next: null,
    loop: false,
    errorCount: 0,
    maxErrorCount: 10,
};

// song history: max to 20
const MAX_HISTORY = 20;
const history = [];

const updatePlayer = (settings = {}) => {
    validateSetting(settings);

    Object.keys(settings).forEach((prop) => {
        PLAYER[prop] = settings[prop];
    });

    return PLAYER;
};

const validateSetting = (settings) => {
    const invalidSet = difference(Object.keys(settings), Object.keys(PLAYER));

    if (invalidSet.length !== 0) {
        throw new Error(`Invalid settings: ${invalidSet.join(",")}`);
    }
};

const addToHistory = (songId) => {
    history.push(songId);
    return history;
};

const removeFromHistory = (songId) => {
    history.splice(history.indexOf(songId), 1);
    return history;
};

const removeOldestHistory = (songId) => {
    history.shift(songId);
    return history;
};

const historyOverflow = () => {
    return history.length >= MAX_HISTORY;
};

const hasHistory = () => {
    return history.length > 0;
};

const hasPreviousHistory = () => {
    return typeof history[PLAYER.currentIdx - 1] !== "undefined";
};

const hasNextHistory = () => {
    return typeof history[PLAYER.currentIdx + 1] !== "undefined";
};

const getPreviousHistory = () => {
    return history[PLAYER.currentIdx - 1];
};

const getNextHistory = () => {
    return history[PLAYER.currentIdx + 1];
};

const getCurrent = () => {
    return history[PLAYER.currentIdx];
};

const getCurrentHistoryLength = () => {
    return history.length;
};

module.exports = {
    PLAYER,
    updatePlayer,
    addToHistory,
    removeFromHistory,
    removeOldestHistory,
    historyOverflow,
    hasHistory,
    hasPreviousHistory,
    hasNextHistory,
    getPreviousHistory,
    getNextHistory,
    getCurrent,
    getCurrentHistoryLength,
};
