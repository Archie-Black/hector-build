using UnrealBuildTool;

public class SpectralHorizonEditorTarget : TargetRules
{
	public SpectralHorizonEditorTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Editor;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("HorizonRuntime");
	}
}
