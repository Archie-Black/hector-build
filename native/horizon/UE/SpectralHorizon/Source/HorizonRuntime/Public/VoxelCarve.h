#pragma once
#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "VoxelCarve.generated.h"

/** Hook for Voxel Plugin. We crater here if the plugin is absent. */
UCLASS()
class HORIZONRUNTIME_API UVoxelCarve : public UWorldSubsystem
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "Voxel")
	float Crater(FVector Where, float Kinetic);
	UFUNCTION(BlueprintCallable, Category = "Voxel")
	void RegenerateZone(float Dt);
};
