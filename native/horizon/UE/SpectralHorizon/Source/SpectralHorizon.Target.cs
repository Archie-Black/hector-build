using UnrealBuildTool;

public class SpectralHorizonTarget : TargetRules
{
	public SpectralHorizonTarget(TargetInfo Target) : base(Target)
	{
		Type = TargetType.Game;
		DefaultBuildSettings = BuildSettingsVersion.V5;
		IncludeOrderVersion = EngineIncludeOrderVersion.Latest;
		ExtraModuleNames.Add("HorizonRuntime");
	}
}
