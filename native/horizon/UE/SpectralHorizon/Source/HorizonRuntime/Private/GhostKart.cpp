#include "GhostKart.h"
#include "ChaosWheeledVehicleMovementComponent.h"
#include "ImpactScore.h"

AGhostKart::AGhostKart()
{
	PrimaryActorTick.bCanEverTick = true;
	Carnage = CreateDefaultSubobject<UNiagaraComponent>(TEXT("Carnage"));
	Carnage->SetupAttachment(RootComponent);
	Carnage->SetAutoActivate(false);
}

void AGhostKart::Tick(float DeltaTime)
{
	Super::Tick(DeltaTime);
	const FVector V = GetVelocity();
	Rpm = FMath::Clamp(800.f + V.Size() * 0.42f, 800.f, 14500.f);
	Heat *= FMath::Exp(-DeltaTime * 3.2f);
	if (Carnage)
	{
		Carnage->SetFloatParameter(TEXT("Heat"), Heat);
		Carnage->SetFloatParameter(TEXT("Rpm"), Rpm);
	}
}

void AGhostKart::Fire()
{
	Heat = 1.f;
	Hp = FMath::Max(0.f, Hp - 4.f);
	if (Carnage) Carnage->Activate(true);
	if (UWorld* W = GetWorld())
	{
		if (UImpactScore* S = W->GetSubsystem<UImpactScore>())
		{
			S->OnEnvironmentImpact(GetActorLocation(), 1200.f, GetVelocity().Size() * 0.01f);
		}
	}
}

void AGhostKart::Wreck()
{
	Hp = 0.f;
	Heat = 1.f;
	if (UChaosWheeledVehicleMovementComponent* Move = Cast<UChaosWheeledVehicleMovementComponent>(GetVehicleMovement()))
	{
		Move->SetHandbrakeInput(true);
		Move->SetThrottleInput(0.f);
	}
	if (Carnage) Carnage->Activate(true);
}
