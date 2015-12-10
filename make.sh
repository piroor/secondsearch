#!/bin/sh

appname=secondsearch

cp makexpi/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

