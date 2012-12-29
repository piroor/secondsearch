#!/bin/sh

appname=secondsearch

cp buildscript/makexpi.sh ./
./makexpi.sh -n $appname -o
rm ./makexpi.sh

