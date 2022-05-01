const { difference } = require("lodash");

const PLAYER = {
    current: null,
    previous: null,
    next: null,
    loop: false,
    errorCount: 0,
    maxErrorCount: 20,
};

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

module.exports = {
    PLAYER,
    updatePlayer,
};
