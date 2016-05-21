# homestar-runner
IOTDB / Home☆Star Module for [Runner]().

<img src="https://raw.githubusercontent.com/dpjanes/iotdb-homestar/master/docs/HomeStar.png" align="right" />

# Installation

[Install Home☆Star first](https://homestar.io/about/install).

Then:

    $ homestar install homestar-runner

# Testing

## IOTDB

Turn on Runner.

	$ node
	>>> iotdb = require('iotdb')
	>>> things = iotdb.connect("Runner")
	>>> things.set(":on", true);
	
## [IoTQL](https://github.com/dpjanes/iotdb-iotql)

Change to HDMI1 

	$ homestar install iotql
	$ homestar iotql
	> SET state:on = true WHERE meta:model-id = "runner";

## Home☆Star

Do:

	$ homestar runner browser=1
	
You may have to refresh the page, as it may take a little while for your Things to be discovered. If your TV is not on it won't show up.

# Models
## Runner

See [Runner.iotql](https://github.com/dpjanes/homestar-runner/blob/master/models/Runner.iotql)
