#pragma once
#include "CoreMinimal.h"
#include "Components/ActorComponent.h"
#include "VoidOverture.generated.h"

UCLASS(ClassGroup = (V01D), meta = (BlueprintSpawnableComponent))
class VOIDDESKTOP_API UVoidOverture : public UActorComponent
{
	GENERATED_BODY()
public:
	UVoidOverture();
	virtual void TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction) override;

	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float Time = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float Black = 1;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float Letters = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float Credit = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float Logo = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float LogoTop = 50;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float LogoScale = 1.55f;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float GhostMail = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	bool Done = false;

	UFUNCTION(BlueprintCallable, Category = "Overture")
	void Play();

	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float MarsPan = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	float Speech = 0;
	UPROPERTY(BlueprintReadOnly, Category = "Overture")
	FString Typed;

	static constexpr float DoneAt = 82.f;
	static constexpr float SpeechAt = 44.f;
};
