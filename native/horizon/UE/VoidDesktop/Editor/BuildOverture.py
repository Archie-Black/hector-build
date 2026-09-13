# Unreal Editor 5.8. Level sequence: black, slit letters, 1-birth, credit, logo travel.
# Run: py BuildOverture.py inside the editor. Mirrors src/lib/v01d/overture.ts.

import unreal

DONE = 74.0
SPEECH_AT = 46.0
MARS = "/Game/Overture/T_Mars"
CREDIT = "a deltakingzero build"
HAWKING = "Look up at the stars and not down at your feet. Be curious."

def build():
    ls = unreal.AssetToolsHelpers.get_asset_tools().create_asset(
        "LS_V01D_Overture",
        "/Game/Overture",
        unreal.LevelSequence,
        unreal.LevelSequenceFactoryNew(),
    )
    ls.set_display_rate(unreal.FrameRate(24, 1))
    ls.set_playback_end(int(DONE * 24))
    unreal.EditorAssetLibrary.save_loaded_asset(ls)
    unreal.log("OS V01D overture sequence ready. Bind UVoidOverture + MI_AliensSlit.")

if __name__ == "__main__":
    build()
