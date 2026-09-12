/** Surfaces we wrap. Same envelope, native language. */
export const STACKS = ["rust", "go", "cpp", "k8s"] as const;
export type Stack = (typeof STACKS)[number];

export const STACK_NOTE: Record<Stack, string> = {
  rust: "horsemen + chimera crate. Constant-time eq. Enclave in process.",
  go: "sidecar morphs gRPC and REST. No cleartext logs.",
  cpp: "header-only enclave. Wipe on scope exit.",
  k8s: "default-deny NetworkPolicy. Mutating hop port. Sidecar chaff.",
};
