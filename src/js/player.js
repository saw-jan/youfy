const PLAYER = {
    current: null,
    previous: null,
    next: null,
    loop: false,
    errorCount: 0,
    maxErrorCount: 20,
};

const updatePlayer = (settings = {}) => {
    Object.keys(settings).forEach((prop) => {
        PLAYER[prop] = settings[prop];
    });
};

module.exports = {
    PLAYER,
    updatePlayer,
};
