#pragma once
#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "MoonWorld.generated.h"

UENUM(BlueprintType)
enum class EHxBody : uint8 { Luna, Phobos, Mars };

UCLASS()
class HORIZONRUNTIME_API AMoonWorld : public AActor
{
	GENERATED_BODY()
public:
	AMoonWorld();
	virtual void BeginPlay() override;
	UFUNCTION(BlueprintCallable, Category = "Moon")
	void UseBody(EHxBody Body);
	UPROPERTY(EditAnywhere, BlueprintReadWrite) EHxBody Body = EHxBody::Luna;
	UPROPERTY(EditAnywhere, BlueprintReadWrite) FString Ellipsoid = TEXT("IAU2015_Moon");
	UPROPERTY(EditAnywhere, BlueprintReadWrite) float Gravity = 1.62f;
};
