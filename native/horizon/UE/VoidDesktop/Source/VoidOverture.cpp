#include "VoidOverture.h"

static float Spring01(float t)
{
	t = FMath::Max(0.f, t);
	return 1.f - FMath::Exp(-3.05f * t) * FMath::Cos(8.2f * t);
}

UVoidOverture::UVoidOverture()
{
	PrimaryComponentTick.bCanEverTick = true;
}

void UVoidOverture::Play()
{
	Time = 0;
	Done = false;
	SetComponentTickEnabled(true);
}

void UVoidOverture::TickComponent(float DeltaTime, ELevelTick TickType, FActorComponentTickFunction* ThisTickFunction)
{
	Super::TickComponent(DeltaTime, TickType, ThisTickFunction);
	Time += DeltaTime;
	const float S = Time;
	const float Travel = Spring01((S - 68.f) / 8.2f);
	Black = 0.78f * (1.f - Smooth01((S - 58.f) / 8.f));
	Letters = FMath::Clamp((S - 2.2f) / 0.6f, 0.f, 1.f) * (1.f - Smooth01((S - 22.f) / 3.f));
	Credit = FMath::Clamp((S - 18.f) / 2.4f, 0.f, 1.f) * (1.f - Smooth01((S - 26.f) / 2.f));
	Logo = FMath::Clamp((S - 20.f) / 2.2f, 0.f, 1.f);
	LogoTop = 50.f + Travel * 41.f;
	LogoScale = 1.15f - Travel * 0.72f;
	GhostMail = Logo;
	MarsPan = -(S / DoneAt) * 16.f;
	Speech = FMath::Clamp((S - SpeechAt) / 0.6f, 0.f, 1.f);
	const TCHAR* Words = TEXT("I am Hector. I help. I do not rule. Stephen Hawking said: Look up at the stars and not down at your feet. Be curious. Welcome to OS VOID.");
	const int32 N = FCString::Strlen(Words);
	const int32 Take = FMath::Clamp(FMath::FloorToInt(FMath::Max(0.f, S - SpeechAt) * 9.f), 0, N);
	Typed = FString(Take, Words);
	Done = S >= DoneAt;
	if (Done) SetComponentTickEnabled(false);
}
