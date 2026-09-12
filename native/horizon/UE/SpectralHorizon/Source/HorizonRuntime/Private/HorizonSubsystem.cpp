#include "HorizonSubsystem.h"

void UHorizonSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	Knot = 0x48584F41534953ll; // HXOASIS
}

void UHorizonSubsystem::Tick(float DeltaTime)
{
	Heat = FMath::Fmod(Heat + DeltaTime * 0.37f, 1.f);
	Knot ^= static_cast<int64>(Heat * 16777619.f);
}

void UHorizonSubsystem::OpenPortal()
{
	UE_LOG(LogTemp, Log, TEXT("Spectral Horizon portal open. Knot %lld"), Knot);
}
