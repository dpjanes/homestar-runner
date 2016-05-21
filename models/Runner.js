/*
 *  Runner.js
 *
 *  David Janes
 *  IOTDB
 *  2016-05-21
 */

var iotdb = require("iotdb");

exports.binding = {
    bridge: require('../RunnerBridge').Bridge,
    model: require('./runner.json'),
};
