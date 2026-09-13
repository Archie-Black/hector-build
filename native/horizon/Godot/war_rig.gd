extends VehicleBody3D
## Ghost Kart: Warzone. Jolt rigid body. Scrap upgrades thrust.

@export var thrust := 28.0
var hp := 100.0

func board(carry: Vector3) -> void:
	linear_velocity += carry

func _physics_process(dt: float) -> void:
	engine_force = Input.get_axis("brake", "throttle") * thrust
	steering = Input.get_axis("right", "left") * 0.4
	if Input.is_action_just_pressed("fire"):
		_hit(global_position, 12.0, linear_velocity.length())

func _hit(where: Vector3, mass: float, v: float) -> void:
	hp -= 4.0
	GameManager.on_environment_impact(where, mass, v)
	if GameManager.spend_scrap(40.0):
		thrust += 2.0
