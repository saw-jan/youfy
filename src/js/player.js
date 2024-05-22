const { difference } = require("lodash");

const PLAYER = {
    id: null,
    next: null,
    loop: false,
    errorCount: 0,
    maxErrorCount: 10,
};

let PLAYLIST = new Map();

// song history: max to 20
const MAX_HISTORY = 20;

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

const addToHistory = (song) => {
    PLAYLIST.set(song.id, song);
    return PLAYLIST;
};

const removeFromHistory = (songId) => {
    PLAYLIST.delete(songId);
    return PLAYLIST;
};

const removeOldestHistory = (songId) => {
    const [[k, v], ...playlist] = PLAYLIST.entries();
    PLAYLIST = new Map(playlist);
    return PLAYLIST;
};

const historyOverflow = () => {
    return PLAYLIST.size >= MAX_HISTORY;
};

const hasHistory = () => {
    return PLAYLIST.size > 0;
};

const hasPreviousHistory = () => {
    const list = [...PLAYLIST.keys()];
    return list[list.indexOf(PLAYER.id) - 1] !== "undefined";
};

const hasNextHistory = () => {
    const list = [...PLAYLIST.keys()];
    return list[list.indexOf(PLAYER.id) + 1] !== "undefined";
};

const getPreviousHistory = () => {
    if (!hasPreviousHistory()) {
        return null;
    }
    const list = [...PLAYLIST.keys()];
    return PLAYLIST.get(list[list.indexOf(PLAYER.id) - 1]);
};

const getNextHistory = () => {
    if (!hasNextHistory()) {
        return null;
    }
    const list = [...PLAYLIST.keys()];
    return PLAYLIST.get(list[list.indexOf(PLAYER.id) + 1]);
};

const getCurrent = () => {
    return PLAYER.id;
};

const getCurrentHistoryLength = () => {
    return PLAYLIST.size;
};

const existInHistory = (songId) => {
    return PLAYLIST.has(songId);
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
    existInHistory,
};
