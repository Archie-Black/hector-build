#include "OmniMoveComponent.h"
#include "GameFramework/Actor.h"

UOmniMoveComponent::UOmniMoveComponent()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UOmniMoveComponent::Wish(FVector2D InAxis, bool bSlide, bool bDash, bool bDive)
{
	Axis = InAxis;
	Flags = (bSlide ? 1 : 0) | (bDash ? 2 : 0) | (bDive ? 4 : 0);
}

FVector UOmniMoveComponent::TakeVelocity()
{
	const FVector Out = Vel;
	Vel = FVector::ZeroVector;
	Gait = EHxGait::Run;
	return Out;
}

void UOmniMoveComponent::TickComponent(float Dt, ELevelTick TickType, FActorComponentTickFunction* Fn)
{
	Super::TickComponent(Dt, TickType, Fn);
	AActor* Owner = GetOwner();
	if (!Owner) return;
	Cool = FMath::Max(0.f, Cool - Dt);
	const bool Slide = Flags & 1;
	const bool Dash = Flags & 2;
	const bool Dive = Flags & 4;
	if (Dive && Cool <= 0) {
		Gait = EHxGait::Dive;
		Vel *= 1.35f;
		Vel.Z = 220.f;
		Cool = 0.7f;
	} else if (Dash && Cool <= 0) {
		Gait = EHxGait::Dash;
		const FVector2D N = Axis.GetSafeNormal();
		Vel += FVector(N.X, N.Y, 0) * 1800.f;
		Cool = 0.45f;
	} else if (Slide) {
		Gait = EHxGait::Slide;
	} else {
		Gait = EHxGait::Run;
	}
	const float Acc = Gait == EHxGait::Slide ? 800.f : 2200.f;
	const float Drag = Gait == EHxGait::Slide ? 0.4f : 6.f;
	Vel.X += (Axis.X * Acc - Vel.X * Drag) * Dt;
	Vel.Y += (Axis.Y * Acc - Vel.Y * Drag) * Dt;
	Vel.Z -= 980.f * GravityScale * Dt;
	Owner->AddActorWorldOffset(Vel * Dt, true);
	Flags = 0;
}
