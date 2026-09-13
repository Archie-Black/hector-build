extends Node3D
## Ghost Kart: Warzone. Godot 4.7. Grid scream. Carnage.

var v := 0.0
var rpm := 800.0
var hp := 100.0
var tape: Array[Transform3D] = []

func _physics_process(dt: float) -> void:
	var thr := Input.get_axis("brake", "throttle")
	var steer := Input.get_axis("left", "right")
	v = max(0.0, v + (thr * 28.0 - v * 0.42) * dt)
	rotate_y(steer * (0.8 + v * 0.04) * dt)
	translate(Vector3.FORWARD * v * dt)
	rpm = min(14500.0, 800.0 + v * 420.0)
	tape.append(global_transform)
	if Input.is_action_just_pressed("fire"):
		hp -= 4.0
		_bang()

func _bang() -> void:
	# Niagara-style burst is heat on the kart. One write.
	pass
