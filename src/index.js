module.exports = {
    parse: require('./parser').parse,
    compile: require('./compiler').compile,
    execute: require('./interpreter').execute,
    objects: require('./objects')
};
