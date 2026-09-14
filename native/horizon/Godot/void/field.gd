extends ColorRect
## Desk field. Feeds the Godot nebula the same uniforms the WebGL field uses.

func _ready() -> void:
	mouse_filter = MOUSE_FILTER_IGNORE
	set_anchors_preset(Control.PRESET_FULL_RECT)


func _process(_dt: float) -> void:
	var mat := material as ShaderMaterial
	if mat == null:
		return
	var sz := get_viewport_rect().size
	mat.set_shader_parameter("u_t", Time.get_ticks_msec() * 0.001)
	mat.set_shader_parameter("u_look", Vector2.ZERO)
	mat.set_shader_parameter("u_q", 1.0)
	mat.set_shader_parameter("u_res", sz)
