module.exports = {
    parse: require('./parser').parse,
    compile: require('./compiler').compile,
    execute: require('./vm').execute,
    objects: require('./objects')
};
