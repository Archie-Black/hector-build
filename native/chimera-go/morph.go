package chimera

import "crypto/sha256"

func HopPort(epoch uint32, base uint16) uint16 {
	return base + uint16((epoch*7919)%400)
}

func PadBucket(body []byte) []byte {
	need := len(body) + 4
	bucket := 256
	for _, b := range []int{256, 512, 1024, 2048, 4096} {
		if b >= need {
			bucket = b
			break
		}
	}
	out := make([]byte, bucket)
	n := len(body)
	out[0] = byte(n)
	out[1] = byte(n >> 8)
	out[2] = byte(n >> 16)
	out[3] = byte(n >> 24)
	copy(out[4:], body)
	return out
}

func Tag(msg []byte) [32]byte {
	return sha256.Sum256(msg)
}
