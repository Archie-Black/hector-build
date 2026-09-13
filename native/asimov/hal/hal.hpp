#pragma once
// V01D HAL. Vulkan command model. RDNA and CUDA submit the same list. DeltaKingZero.

namespace hx::hal {
inline constexpr const char* name = "V01D HAL";
inline constexpr const char* api = "Vulkan 1.3";
inline constexpr const char* queues[] = { "rdna0", "cuda0", "vk0" };
}