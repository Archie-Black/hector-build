#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "OmniMoveComponent.generated.h"

UENUM(BlueprintType)
enum class EHxGait : uint8 { Run, Slide, Dash, Dive, Air };

UCLASS(ClassGroup = (Horizon), meta = (BlueprintSpawnableComponent))
class HORIZONRUNTIME_API UOmniMoveComponent : public UActorComponent
{
	GENERATED_BODY()
public:
	UOmniMoveComponent();
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;
	UFUNCTION(BlueprintCallable, Category = "Omni")
	void Wish(FVector2D Axis, bool bSlide, bool bDash, bool bDive);
	UFUNCTION(BlueprintCallable, Category = "Omni")
	FVector TakeVelocity();
	UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Omni")
	float GravityScale = 0.16f;
	UPROPERTY(BlueprintReadOnly) EHxGait Gait = EHxGait::Run;
	UPROPERTY(BlueprintReadOnly) FVector Vel = FVector::ZeroVector;
private:
	float Cool = 0;
	FVector2D Axis;
	uint8 Flags = 0;
};
