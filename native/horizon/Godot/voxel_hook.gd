extends Node
## Zylann Voxel Engine hook. Ours if the plugin is absent.

var _h := PackedFloat32Array()
const N := 32

func _ready() -> void:
	_h.resize(N * N)
	_h.fill(0.0)

func crater(where: Vector3, ke: float) -> float:
	var r := minf(8.0, 0.6 + sqrt(ke) * 0.04)
	var mass := 0.0
	var cx := int(where.x)
	var cy := int(where.z)
	var ir := int(r) + 1
	for y in range(cy - ir, cy + ir + 1):
		for x in range(cx - ir, cx + ir + 1):
			if x < 0 or y < 0 or x >= N or y >= N:
				continue
			var d := Vector2(x, y).distance_to(Vector2(where.x, where.z))
			if d > r:
				continue
			var cut := (1.0 - d / r) * minf(1.0, ke / 400.0)
			var i := y * N + x
			var add := minf(1.0 - _h[i], cut)
			_h[i] += add
			mass += add
	return mass

func regenerate_zone(dt: float) -> void:
	for i in _h.size():
		_h[i] = maxf(0.0, _h[i] - 0.08 * dt)
