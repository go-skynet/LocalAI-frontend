#!/bin/sh

npm run build
exec serve -s ./build
