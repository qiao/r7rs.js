module.exports = process.env.R7RS_COV ?
    require('./src-cov') :
    require('./src');
