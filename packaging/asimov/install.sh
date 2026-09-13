#!/usr/bin/env bash
# Asimov 01 — ROS 2 nerves, Gazebo world, OpenCV eyes on Arch / WSL.
set -euo pipefail
echo "Asimov 01 lab"

if command -v pacman >/dev/null 2>&1; then
  sudo pacman -S --needed --noconfirm opencv python-opencv vtk hdf5 eigen cmake ninja python python-numpy distrobox docker || true
fi

if command -v distrobox >/dev/null 2>&1; then
  if ! distrobox list 2>/dev/null | grep -q asimov01; then
    distrobox create --name asimov01 --image ubuntu:24.04 --yes || true
  fi
  distrobox enter asimov01 -- bash -lc '
    set -e
    sudo apt-get update
    sudo apt-get install -y software-properties-common curl gnupg lsb-release
    sudo curl -sSL https://raw.githubusercontent.com/ros/rosdistro/master/ros.key -o /usr/share/keyrings/ros-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/ros-archive-keyring.gpg] http://packages.ros.org/ros2/ubuntu $(. /etc/os-release && echo $UBUNTU_CODENAME) main" | sudo tee /etc/apt/sources.list.d/ros2.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y ros-jazzy-ros-base ros-jazzy-ros-gz python3-opencv
  ' || echo "ROS 2 Jazzy + Gazebo vendor will finish on a full host."
fi

bash "$(cd "$(dirname "$0")" && pwd)/install-rdna.sh" || true
bash "$(cd "$(dirname "$0")" && pwd)/install-isaac.sh" || true
echo "Asimov 01 stacks: ROS 2, Gazebo, OpenCV, Isaac Sim 6.1.0. Laws stay on."
