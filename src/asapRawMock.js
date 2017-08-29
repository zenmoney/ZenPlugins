module.exports = function(fn) {
    // call immediately due to sync runtime nature
    fn();
};
