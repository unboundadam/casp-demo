#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )/../casp-bot"

mkdir -p "$DIR"
cd "$DIR"
rm -f "casp-sdk-package.1.0.*.tar.gz"
rm -rf "bin docs jar sample"
REPO="https://repo.dyadicsec.com/casp/UB2004/latest/client/centos/7.5/"
# REPO="https://repo.dyadicsec.com/Products/casp/$branch/latest/client/centos/7.5/"
echo $REPO
wget -nv -O- $REPO |
  grep -o '[^"[:space:]]*>casp-sdk-package.1.0[^"[:space:]]*\.tar.gz<' | sed -e 's/<//' | sed -e 's/>//' |
    head -n5 | while read x; do
      wget  "$REPO/$x" -P .
  done
# wget "https://repo.dyadicsec.com/casp/UB2004/snapshots/client/centos/7.5/casp-sdk-package.1.0.2004.42859.RHES.x86_64.tar.gz"
tar -xf casp-sdk-*.tar.gz
rm -f *.tar.gz
