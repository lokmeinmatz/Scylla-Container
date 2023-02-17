#! /usr/bin/bash

cd scylla-dev_ui
java -cp "target/classes;../dependencies/*;lib/*;*" de.hpi.bpt.scylla.Scylla $1 $2 $3 --enable-bps-logging
