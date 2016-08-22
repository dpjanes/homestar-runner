/*
 *  RunnerBridge.js
 *
 *  David Janes
 *  IOTDB.org
 *  2016-05-21
 *
 *  Copyright [2013-2016] [David P. Janes]
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

"use strict";

const iotdb = require('iotdb');
const _ = iotdb._;
const os = require('os')

const logger = iotdb.logger({
    name: 'homestar-runner',
    module: 'RunnerBridge',
});

/**
 *  See {iotdb.bridge.Bridge#Bridge} for documentation.
 *  <p>
 *  @param {object|undefined} native
 *  only used for instances, should be 
 */
const RunnerBridge = function (initd, native) {
    const self = this;

    self.initd = _.defaults(initd,
        iotdb.keystore().get("bridges/RunnerBridge/initd"), {
            poll: 30
        }
    );
    self.native = native;   // the thing that does the work - keep this name

    if (self.native) {
        self.queue = _.queue("RunnerBridge");
    }
};

RunnerBridge.prototype = new iotdb.Bridge();

RunnerBridge.prototype.name = function () {
    return "RunnerBridge";
};

/* --- lifecycle --- */

/**
 *  See {iotdb.bridge.Bridge#discover} for documentation.
 */
RunnerBridge.prototype.discover = function () {
    const self = this;

    logger.info({
        method: "discover"
    }, "called");

    /*
     *  This is the core bit of discovery. As you find new
     *  thimgs, make a new RunnerBridge and call 'discovered'.
     *  The first argument should be self.initd, the second
     *  the thing that you do work with
     */

    self.discovered(new RunnerBridge(self.initd, {
        'iot:vendor.type': 'runner',
    }));

    /*
    const s = self._runner();
    s.on('something', function (native) {
        self.discovered(new RunnerBridge(self.initd, native));
    });
    */
};

/**
 *  See {iotdb.bridge.Bridge#connect} for documentation.
 */
RunnerBridge.prototype.connect = function (connectd) {
    const self = this;
    if (!self.native) {
        return;
    }

    self._validate_connect(connectd);

    self._setup_polling();
    self.pull();
};

RunnerBridge.prototype._setup_polling = function () {
    const self = this;
    if (!self.initd.poll) {
        return;
    }

    const timer = setInterval(function () {
        if (!self.native) {
            clearInterval(timer);
            return;
        }

        self.pull();
    }, self.initd.poll * 1000);
};

RunnerBridge.prototype._forget = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    logger.info({
        method: "_forget"
    }, "called");

    self.native = null;
    self.pulled();
};

/**
 *  See {iotdb.bridge.Bridge#disconnect} for documentation.
 */
RunnerBridge.prototype.disconnect = function () {
    const self = this;
    if (!self.native || !self.native) {
        return;
    }

    self._forget();
};

/* --- data --- */

/**
 *  See {iotdb.bridge.Bridge#push} for documentation.
 */
RunnerBridge.prototype.push = function (pushd, done) {
    const self = this;
    if (!self.native) {
        done(new Error("not connected"));
        return;
    }

    self._validate_push(pushd, done);

    logger.info({
        method: "push",
        pushd: pushd
    }, "push");

    const qitem = {
        // if you set "id", new pushes will unqueue old pushes with the same id
        // id: self.number, 
        run: function () {
            self._pushd(pushd);
            self.queue.finished(qitem);
        },
        coda: function() {
            done();
        },
    };
    self.queue.add(qitem);
};

/**
 *  Do the work of pushing. If you don't need queueing
 *  consider just moving this up into push
 */
RunnerBridge.prototype._push = function (pushd) {
    if (pushd.on !== undefined) {
    }
};

/**
 *  See {iotdb.bridge.Bridge#pull} for documentation.
 */
RunnerBridge.prototype.pull = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    var d = {};

    if (self.native['iot:vendor.type'] === 'runner') {
        d["load-average"] = os.loadavg()[0];
        d["available-memory"] = os.totalmem();
        d["free-memory"] = os.freemem();
        d["uptime"] = os.uptime();
    } else if (self.native['iot:vendor.type'] === 'disk') {
    } else if (self.native['iot:vendor.type'] === 'cpu') {
    }


    /*
    d.arch = os.arch();
    d.cpus = os.cpus();
    d.endianness = os.endianness();
    d.homedir = os.homedir();
    d.hostname = os.hostname();
    d.networkInterfaces = os.networkInterfaces();
    d.platform = os.platform();
    d.release = os.release();
    d.tmpdir = os.tmpdir();
    d.type = os.type();
    */

    self.pulled(d);
};

/* --- state --- */

/**
 *  See {iotdb.bridge.Bridge#meta} for documentation.
 */
RunnerBridge.prototype.meta = function () {
    const self = this;
    if (!self.native) {
        return;
    }

    const metad = _.d.compose.shallow(self.native);

    if (self.native['iot:vendor.type'] === 'runner') {
        const rd = iotdb.keystore().get("/homestar/runner");
        const mapd = {
            "/name": "schema:name",
            "/location/latitude": "schema:latitude",
            "/location/longitude": "schema:longitude",
            "/location/locality": "schema:locality",
            "/location/country": "schema:country",
            "/location/region": "schema:region",
            "/location/timezone": "schema:timezone",
        };
        for (var key in mapd) {
            var value = _.d.get(rd, key);
            if (value) {
                metad[mapd[key]] = value;
            }
        }
    }

    return metad;
};

/**
 *  See {iotdb.bridge.Bridge#reachable} for documentation.
 */
RunnerBridge.prototype.reachable = function () {
    return this.native !== null;
};

/**
 *  See {iotdb.bridge.Bridge#configure} for documentation.
 */
RunnerBridge.prototype.configure = function (app) {};

/* -- internals -- */
var __singleton;

/**
 *  If you need a singleton to access the library
 */
RunnerBridge.prototype._runner = function () {
    const self = this;

    if (!__singleton) {
        __singleton = runner.init();
    }

    return __singleton;
};

/*
 *  API
 */
exports.Bridge = RunnerBridge;
