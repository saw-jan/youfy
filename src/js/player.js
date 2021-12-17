const PLAYER = {
    current: null,
    previous: null,
    next: null,
    loop: false,
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
