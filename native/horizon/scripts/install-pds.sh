#!/usr/bin/env bash
# NASA PDS. Catalog only. Do not pull terabytes in this install.
set +e
echo "PDS is free. TSPA. Nodes: Geo, Imaging, SBN, NAIF."
echo "Search: ODE https://ode.rsl.wustl.edu/  REST https://oderest.rsl.wustl.edu/"
echo "Registry API https://nasa-pds.github.io/pds-api/"
echo "Luna height: LOLA GDR / SLDEM  (pds-geosciences + imbrium.mit.edu)"
echo "Luna color:  LROC WAC/NAC      (lroc.sese.asu.edu)"
echo "Mars height: MOLA MEGDR PDS4   (geo node, Aug 2026)"
echo "Phobos:      MEX HRSC/SRC stereo — not Cesium Moon."
echo "Next LRO drop: Release 67 on 2026-09-15."
echo "Path into UE: DEM -> landscape/Nanite. IMG -> virtual texture. SPICE -> NAIF."
exit 0
