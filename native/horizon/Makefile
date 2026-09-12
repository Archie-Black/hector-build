CXX ?= g++
CXXFLAGS ?= -std=c++20 -O3 -march=native -ffast-math -fno-exceptions -fno-rtti -Wall -Wextra -Iinclude
LDFLAGS ?= -lrt

horizon: src/horizon.cpp
	$(CXX) $(CXXFLAGS) -o $@ src/horizon.cpp $(LDFLAGS)

.PHONY: test clean
test: horizon
	./horizon

clean:
	rm -f horizon
