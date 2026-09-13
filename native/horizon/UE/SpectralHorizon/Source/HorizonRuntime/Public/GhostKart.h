#pragma once
#include "CoreMinimal.h"
#include "WheeledVehiclePawn.h"
#include "NiagaraComponent.h"
#include "GhostKart.generated.h"

UCLASS()
class HORIZONRUNTIME_API AGhostKart : public AWheeledVehiclePawn
{
	GENERATED_BODY()
public:
	AGhostKart();
	virtual void Tick(float DeltaTime) override;
	UFUNCTION(BlueprintCallable, Category = "GhostKart")
	void Fire();
	UFUNCTION(BlueprintCallable, Category = "GhostKart")
	void Wreck();
	UPROPERTY(BlueprintReadOnly) float Rpm = 800.f;
	UPROPERTY(BlueprintReadOnly) float Heat = 0.f;
	UPROPERTY(BlueprintReadOnly) float Hp = 100.f;
	UPROPERTY(VisibleAnywhere) TObjectPtr<UNiagaraComponent> Carnage;
};
