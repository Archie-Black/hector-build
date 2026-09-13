extends Node
## Cognitive metamorphic pathways. Same class as src/lib/v01d/pathways.ts

var live_class := 0
var live_writhe := 0

func reduce_word(w: PackedInt32Array) -> PackedInt32Array:
	var s: PackedInt32Array = PackedInt32Array()
	for g in w:
		if s.size() and s[s.size() - 1] == -g:
			s.remove_at(s.size() - 1)
		else:
			s.append(g)
	if s.is_empty():
		s.append(1)
	return s

func think_heat(text: String) -> float:
	var h := 0
	for c in text.to_utf8_buffer():
		h = (h * 31 + c) & 0x7fffffff
	var writhe := 1 if (h & 1) else -1
	if live_class != 0 and writhe == live_writhe:
		return 0.2
	live_writhe = writhe
	live_class = h
	return 0.55

func _process(delta: float) -> void:
	var k := think_heat(str(Time.get_ticks_msec()))
	if has_node("/root/GameManager"):
		pass
	# Heat only. No extra chrome.
	if Engine.get_frames_drawn() % 120 == 0:
		print_verbose("hector_brain heat ", k, " class ", live_class)
