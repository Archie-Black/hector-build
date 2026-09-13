#pragma once
#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "ImpactScore.generated.h"

DECLARE_DYNAMIC_MULTICAST_DELEGATE_ThreeParams(FHxCombo, float, Points, float, Combo, FVector, Where);

UCLASS()
class HORIZONRUNTIME_API UImpactScore : public UWorldSubsystem
{
	GENERATED_BODY()
public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	UFUNCTION(BlueprintCallable, Category = "Score")
	void OnEnvironmentImpact(FVector Where, float Mass, float Velocity);
	UFUNCTION(BlueprintCallable, Category = "Score")
	float SpendScrap(float Cost);
	UPROPERTY(BlueprintAssignable) FHxCombo OnCombo;
	UPROPERTY(BlueprintReadOnly) float Points = 0;
	UPROPERTY(BlueprintReadOnly) float Scrap = 0;
	UPROPERTY(BlueprintReadOnly) float Combo = 1;
	UPROPERTY(BlueprintReadOnly) int32 Chain = 0;
private:
	FCriticalSection Gate;
	float Window = 0;
};
