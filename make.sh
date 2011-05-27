#!/bin/sh

appname=secondsearch

cp buildscript/makexpi.sh ./
./makexpi.sh $appname
rm ./makexpi.sh

