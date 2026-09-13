#include "HorizonSubsystem.h"
#include "hx/pathways.hpp"

void UHorizonSubsystem::Initialize(FSubsystemCollectionBase& Collection)
{
	Super::Initialize(Collection);
	Knot = 0x48584F41534953ll;
}

void UHorizonSubsystem::Tick(float DeltaTime)
{
	Heat = FMath::Fmod(Heat + DeltaTime * 0.37f, 1.f);
	Knot ^= static_cast<int64>(Heat * 16777619.f);
	Publish(EHxBurst::Drip, FVector(Heat, 1.f, 0.f), Heat);
	if (Channel.Num() > 64)
	{
		Channel.RemoveAt(0, Channel.Num() - 32);
	}
}

void UHorizonSubsystem::Publish(EHxBurst Kind, FVector Location, float InHeat)
{
	FHxEvent E;
	E.Kind = Kind;
	E.Location = Location;
	E.Heat = InHeat;
	Channel.Add(E);
}

void UHorizonSubsystem::OpenPortal()
{
	Publish(EHxBurst::Play, FVector::ZeroVector, 1.f);
	UE_LOG(LogTemp, Log, TEXT("Spectral Horizon 00:13. Channel %d. Knot %lld"), Channel.Num(), Knot);
}

int32 UHorizonSubsystem::Think(const FString& Text)
{
	const FTCHARToUTF8 Conv(*Text);
	Pathway = hx::think_id(Conv.Get());
	Publish(EHxBurst::Path, FVector(static_cast<float>(Pathway), Heat, 0.f), Heat);
	return Pathway;
}