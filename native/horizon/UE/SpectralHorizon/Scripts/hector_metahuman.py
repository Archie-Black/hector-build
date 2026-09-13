# Hector in MetaHuman Creator. Unreal 5.8.
# UnrealEditor SpectralHorizon.uproject -ExecutePythonScript=this_file
# DeltaKingZero.

import unreal

PLUGINS = (
    "MetaHumanCreator",
    "MetaHumanCharacter",
    "MetaHumanCoreTech",
    "MetaHumanSDK",
    "MetaHumanLiveLink",
)

ASSET = "/Game/OSV01D/Hector"


def log(msg: str) -> None:
    unreal.log(f"[OSV01D MetaHuman] {msg}")


def enable_plugins() -> list[str]:
    mgr = unreal.PluginManager.get()
    on = []
    for name in PLUGINS:
        plug = mgr.find_plugin(name)
        if not plug:
            log(f"missing plugin {name}")
            continue
        if not plug.is_enabled():
            mgr.set_plugin_enabled(name, True)
            log(f"enabled {name}")
        on.append(name)
    return on


def ensure_folder() -> None:
    if not unreal.EditorAssetLibrary.does_directory_exist("/Game/OSV01D"):
        unreal.EditorAssetLibrary.make_directory("/Game/OSV01D")


def make_hector() -> str:
    ensure_folder()
    if unreal.EditorAssetLibrary.does_asset_exist(ASSET):
        log(f"already {ASSET}")
        return ASSET
    factory = getattr(unreal, "MetaHumanCharacterFactory", None)
    if factory is None:
        log("MetaHumanCharacterFactory not loaded. Enable MetaHuman Creator Core Data and the Creator plugin.")
        return ""
    asset_tools = unreal.AssetToolsHelpers.get_asset_tools()
    char = asset_tools.create_asset("Hector", "/Game/OSV01D", unreal.MetaHumanCharacter, factory())
    if char:
        unreal.EditorAssetLibrary.save_asset(ASSET)
        log(f"wrote {ASSET}")
        return ASSET
    log("factory ran but no asset")
    return ""


def run() -> None:
    enabled = enable_plugins()
    log("plugins " + (", ".join(enabled) or "none"))
    make_hector()


run()
