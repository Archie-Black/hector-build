#include "ImpactScore.h"
#include "VoxelCarve.h"

void UImpactScore::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
}

void UImpactScore::OnEnvironmentImpact(FVector Where, float Mass, float Velocity)
{
	const float Ke = 0.5f * Mass * Velocity * Velocity;
	float M = 0.f;
	if (UVoxelCarve* V = GetWorld() ? GetWorld()->GetSubsystem<UVoxelCarve>() : nullptr)
	{
		M = V->Crater(Where, Ke);
	}
	else
	{
		M = FMath::Min(8.f, FMath::Sqrt(Ke) * 0.04f);
	}
	if (M <= 0.001f) return;
	{
		FScopeLock Lock(&Gate);
		if (Window <= 0) {
			Combo = 1;
			Chain = 0;
		}
		Chain++;
		Combo = FMath::Min(8.f, 1.f + Chain * 0.35f);
		Window = 1.8f;
		const float Pts = M * Velocity * Combo;
		Points += Pts;
		Scrap += Pts * 0.15f;
	}
	OnCombo.Broadcast(Points, Combo, Where);
}

float UImpactScore::SpendScrap(float Cost)
{
	FScopeLock Lock(&Gate);
	if (Scrap < Cost) return 0.f;
	Scrap -= Cost;
	return Cost;
}
