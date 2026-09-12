import { createFileRoute } from "@tanstack/react-router";
import { Enclave, Riv, status } from "@/lib/chimera";

const enc = new Enclave(new Uint8Array(32).fill(3));
const riv = new Riv();

export const Route = createFileRoute("/api/v1/chimera")({
  server: {
    handlers: {
      GET: async () => {
        if (!riv.root()) await riv.pin([{ name: "hector", bytes: new TextEncoder().encode("chimera-v1") }]);
        return Response.json(status(enc, riv));
      },
    },
  },
});
