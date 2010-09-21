#!/bin/bash
#
# Node Slideshow [VERSION]
# [DATE]
# Corey Hart @ http://www.codenothing.com
#
node client/client.js > c.log &
sleep 1
tail -f c.log
