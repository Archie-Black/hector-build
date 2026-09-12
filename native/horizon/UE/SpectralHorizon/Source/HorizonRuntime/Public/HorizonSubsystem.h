#pragma once
#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "HorizonSubsystem.generated.h"

UCLASS()
class HORIZONRUNTIME_API UHorizonSubsystem : public UWorldSubsystem
{
	GENERATED_BODY()
public:
	virtual void Initialize(FSubsystemCollectionBase& Collection) override;
	virtual void Tick(float DeltaTime);
	UFUNCTION(BlueprintCallable, Category = "Horizon")
	int64 GetKnot() const { return Knot; }
	UFUNCTION(BlueprintCallable, Category = "Horizon")
	void OpenPortal();
private:
	int64 Knot = 0;
	float Heat = 0;
};
