#include "VoxelCarve.h"

float UVoxelCarve::Crater(FVector Where, float Kinetic)
{
	const float R = FMath::Min(800.f, 60.f + FMath::Sqrt(Kinetic) * 4.f);
	// Voxel Plugin: call VoxelWorld->AddModifier if bound. Ours always returns mass proxy.
	return FMath::Min(24.f, R * 0.02f);
}

void UVoxelCarve::RegenerateZone(float Dt)
{
	(void)Dt;
}
