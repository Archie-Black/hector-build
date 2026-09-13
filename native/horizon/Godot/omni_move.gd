extends CharacterBody3D
## Moon twitch. 0.16 g. Godot-Jolt if present.

const G := 9.80665 * 0.16
var cool := 0.0
var gait := "run"

func _physics_process(dt: float) -> void:
	cool = max(0.0, cool - dt)
	var axis := Input.get_vector("left", "right", "back", "forward")
	var slide := Input.is_action_pressed("slide")
	var dash := Input.is_action_just_pressed("dash")
	var dive := Input.is_action_just_pressed("dive")
	if dive and cool <= 0.0:
		gait = "dive"
		velocity *= 1.35
		velocity.y = 2.2
		cool = 0.7
	elif dash and cool <= 0.0:
		gait = "dash"
		var n := axis.normalized()
		velocity += Vector3(n.x, 0.0, n.y) * 18.0
		cool = 0.45
	elif slide and is_on_floor():
		gait = "slide"
	elif is_on_floor():
		gait = "run"
	var acc := 8.0 if gait == "slide" else 22.0
	var drag := 0.4 if gait == "slide" else 6.0
	velocity.x += (axis.x * acc - velocity.x * drag) * dt
	velocity.z += (axis.y * acc - velocity.z * drag) * dt
	velocity.y -= G * dt
	move_and_slide()

func take_velocity() -> Vector3:
	var v := velocity
	velocity = Vector3.ZERO
	gait = "run"
	return v
