#!/bin/bash
#
# Node Slideshow [VERSION]
# [DATE]
# Corey Hart @ http://www.codenothing.com
#
node node/server.js > s.log &
sleep 1
tail -f s.log
