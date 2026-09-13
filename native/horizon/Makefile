CXX ?= g++
CXXFLAGS ?= -std=c++20 -O3 -march=native -ffast-math -fno-exceptions -fno-rtti -Wall -Wextra -Iinclude
LDFLAGS ?= -lrt

horizon: src/horizon.cpp
	$(CXX) $(CXXFLAGS) -o $@ src/horizon.cpp $(LDFLAGS)

ghostkart: src/kart.cpp
	$(CXX) $(CXXFLAGS) -o $@ src/kart.cpp $(LDFLAGS)

chaos: src/chaos.cpp
	$(CXX) $(CXXFLAGS) -o $@ src/chaos.cpp $(LDFLAGS)

war: src/war.cpp
	$(CXX) $(CXXFLAGS) -o $@ src/war.cpp $(LDFLAGS)

.PHONY: test clean
test: horizon ghostkart chaos war
	./horizon
	./ghostkart
	./chaos
	./war

clean:
	rm -f horizon ghostkart chaos war


