extends Node
## OpenXR when a headset is there. Same omni vectors.

func _ready() -> void:
	if OpenXRInterface and OpenXRInterface.new().is_initialized():
		get_viewport().use_xr = true
