#!/usr/bin/env bash
# UE 5.8 moon datasets. Stream or local maps. Never Caldera.
set +e
echo "Cesium Moon: LRO 3D Tiles. Cesium for Unreal 2.29. Ellipsoid IAU2015_Moon."
echo "  https://cesium.com/platform/cesium-ion/content/cesium-moon/"
echo "  Plugin: CesiumForUnreal. Polar NAC ~1m. Mid-lat WAC ~100m."
echo "NASA CGI Moon Kit (SVS 4720): color + LOLA displacement. Local sphere. No ion."
echo "  https://svs.gsfc.nasa.gov/4720"
echo "NASA SVS 14959: LRO web/AR globe. 2026."
echo "  https://svs.gsfc.nasa.gov/14959/"
echo "Cesium Mars: MOLA. Backdrop only for 00:13."
echo "Phobos is not in Cesium Moon. Horizon crater is ours."
echo "Lumen: deferred, SSE 0.1, raise tile cache. Vacuum: no Rayleigh."
exit 0
