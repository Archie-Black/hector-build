#pragma once
#include "CoreMinimal.h"
#include "Subsystems/WorldSubsystem.h"
#include "HorizonSubsystem.generated.h"

UENUM(BlueprintType)
enum class EHxBurst : uint8
{
	Drip,
	Lava,
	Play,
	Heat,
	Path
};

USTRUCT(BlueprintType)
struct FHxEvent
{
	GENERATED_BODY()
	UPROPERTY(BlueprintReadWrite) EHxBurst Kind = EHxBurst::Drip;
	UPROPERTY(BlueprintReadWrite) FVector Location = FVector::ZeroVector;
	UPROPERTY(BlueprintReadWrite) float Heat = 0.37f;
};

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
	UFUNCTION(BlueprintCallable, Category = "Horizon")
	void Publish(EHxBurst Kind, FVector Location, float Heat);
	UFUNCTION(BlueprintCallable, Category = "Horizon")
	float GetHeat() const { return Heat; }
	UFUNCTION(BlueprintCallable, Category = "Horizon")
	int32 Think(const FString& Text);
	UFUNCTION(BlueprintCallable, Category = "Horizon")
	int32 GetPathway() const { return Pathway; }
private:
	int64 Knot = 0;
	float Heat = 0;
	int32 Pathway = 0;
	TArray<FHxEvent> Channel;
};
