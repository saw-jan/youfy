const { difference } = require("lodash");

const PLAYER = {
    current: null,
    previous: null,
    next: null,
    loop: false,
    errorCount: 0,
    maxErrorCount: 20,
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

const removeOldestHistoryItem = (songId) => {
    history.shift(songId);
    return history;
};

const historyOverflow = () => {
    return history.length >= MAX_HISTORY;
};

module.exports = {
    PLAYER,
    updatePlayer,
    addToHistory,
    removeFromHistory,
    removeOldestHistoryItem,
    historyOverflow,
};
