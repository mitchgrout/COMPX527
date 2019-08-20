#!/bin/bash

# Tagged images
curl https://raw.githubusercontent.com/nightrome/cocostuff/master/labels.md | grep calvin.inf.ed | cut -d'(' -f3 | cut -d')' -f1 > urls
for x in `cat urls`; do wget $x; done
for x in label-*-*.png; do mv $x `echo $x | sed 's/label-[0-9]*-//'`; done

# ~15MB image of Earth 
wget https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751/world.topo.bathy.200407.3x5400x2700.png -O very_large.png
