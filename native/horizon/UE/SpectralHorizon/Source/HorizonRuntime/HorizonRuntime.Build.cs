using UnrealBuildTool;

public class HorizonRuntime : ModuleRules
{
	public HorizonRuntime(ReadOnlyTargetRules Target) : base(Target)
	{
		PCHUsage = PCHUsageMode.UseExplicitOrSharedPCHs;
		bUseUnity = false;
		OptimizeCode = CodeOptimization.Always;
		PublicIncludePaths.AddRange(new string[] { "HorizonRuntime/Public", "../../../../../include" });
		PublicDependencyModuleNames.AddRange(new string[] { "Core", "CoreUObject", "Engine", "RenderCore", "RHI" });
	}
}
