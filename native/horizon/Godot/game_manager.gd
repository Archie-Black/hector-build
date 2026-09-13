extends Node
## Autoload. Arcade combo + scrap for the rig. Voxel regen.

var points := 0.0
var scrap := 0.0
var combo := 1.0
var chain := 0
var window := 0.0
signal combo_tick(points: float, combo: float, where: Vector3)

func _process(dt: float) -> void:
	window = max(0.0, window - dt)
	if window <= 0.0:
		combo = 1.0
		chain = 0
	VoxelHook.regenerate_zone(dt)

func on_environment_impact(where: Vector3, mass: float, velocity: float) -> void:
	var ke := 0.5 * mass * velocity * velocity
	var m := VoxelHook.crater(where, ke)
	if m <= 0.001:
		return
	if window <= 0.0:
		combo = 1.0
		chain = 0
	chain += 1
	combo = min(8.0, 1.0 + chain * 0.35)
	window = 1.8
	var pts := m * velocity * combo
	points += pts
	scrap += pts * 0.15
	combo_tick.emit(points, combo, where)

func spend_scrap(cost: float) -> bool:
	if scrap < cost:
		return false
	scrap -= cost
	return true
