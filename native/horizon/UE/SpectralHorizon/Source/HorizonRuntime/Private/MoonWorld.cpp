#include "MoonWorld.h"
#include "Engine/World.h"
#include "GameFramework/WorldSettings.h"

AMoonWorld::AMoonWorld()
{
	PrimaryActorTick.bCanEverTick = false;
}

void AMoonWorld::BeginPlay()
{
	Super::BeginPlay();
	UseBody(Body);
}

void AMoonWorld::UseBody(EHxBody InBody)
{
	Body = InBody;
	if (InBody == EHxBody::Luna) {
		Ellipsoid = TEXT("IAU2015_Moon");
		Gravity = 1.62f;
	} else if (InBody == EHxBody::Mars) {
		Ellipsoid = TEXT("IAU2015_Mars");
		Gravity = 3.71f;
	} else {
		Ellipsoid = TEXT("Phobos");
		Gravity = 0.0057f;
	}
	if (UWorld* W = GetWorld())
	{
		if (AWorldSettings* S = W->GetWorldSettings())
		{
			S->WorldGravityZ = -Gravity * 100.f;
		}
	}
}
