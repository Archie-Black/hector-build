extends Node3D
## Spectral Horizon 00:13 menus. 3D slabs. Drip is heat, not embers.

@export var drip := 0.37

func _process(delta: float) -> void:
	rotate_y(delta * 0.08)
	for n in get_children():
		if n is Node3D:
			n.position.y = sin(Time.get_ticks_msec() * 0.002 + n.get_index()) * 0.04
			n.rotation.x = deg_to_rad(-6.0 + drip)
