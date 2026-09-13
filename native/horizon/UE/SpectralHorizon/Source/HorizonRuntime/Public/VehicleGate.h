#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "VehicleGate.generated.h"

UCLASS(ClassGroup = (Horizon), meta = (BlueprintSpawnableComponent))
class HORIZONRUNTIME_API UVehicleGate : public UActorComponent
{
	GENERATED_BODY()
public:
	UFUNCTION(BlueprintCallable, Category = "Vehicle")
	void Board(AActor* Rider, FVector Carry);
	UFUNCTION(BlueprintCallable, Category = "Vehicle")
	AActor* Bail();
	UPROPERTY(BlueprintReadOnly) TWeakObjectPtr<AActor> Rider;
};
