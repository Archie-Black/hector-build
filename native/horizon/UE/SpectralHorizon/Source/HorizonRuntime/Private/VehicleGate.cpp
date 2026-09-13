#include "VehicleGate.h"
#include "GameFramework/Pawn.h"
#include "WheeledVehiclePawn.h"

void UVehicleGate::Board(AActor* Who, FVector Carry)
{
	Rider = Who;
	if (AWheeledVehiclePawn* Rig = Cast<AWheeledVehiclePawn>(GetOwner()))
	{
		if (UPawnMovementComponent* Move = Rig->GetMovementComponent())
		{
			Move->Velocity += Carry;
		}
	}
	if (Who) Who->SetActorHiddenInGame(true);
}

AActor* UVehicleGate::Bail()
{
	AActor* Who = Rider.Get();
	Rider.Reset();
	if (Who) Who->SetActorHiddenInGame(false);
	return Who;
}
