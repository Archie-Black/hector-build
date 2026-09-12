extends Node3D
## Spectral HX tick into Godot 4.7. Same knot as native/horizon.

var tick := 0
var knot := 0

func _ready() -> void:
	knot = 0x48584F41534953

func _process(delta: float) -> void:
	tick += 1
	knot ^= int(delta * 16777619.0)
	rotate_y(delta * 0.05)
