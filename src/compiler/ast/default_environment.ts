import Environment = require('./environment');
import Symbol = require('../../objects/symbol');
import Syntax = require('../../objects/syntax');


function getDefaultEnvironment(): Environment {
  const env = new Environment();
  env.define(new Symbol('if'), new Syntax('if'));
  return env;
}


export const get = getDefaultEnvironment;
