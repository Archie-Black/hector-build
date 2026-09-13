#!/usr/bin/env python3
"""Headless Isaac Sim 6.1 ROS 2 bridge for Asimov 01. Import only after SimulationApp."""
import os

os.environ.setdefault("OMNI_KIT_ACCEPT_EULA", "YES")
os.environ.setdefault("PRIVACY_CONSENT", "Y")


def main() -> None:
    try:
        from isaacsim.simulation_app import SimulationApp
    except ImportError:
        print("Isaac Sim 6.1.0 Python packages are not in this environment yet.")
        print("On an RTX host: packaging/asimov/install-isaac.sh")
        return
    app = SimulationApp({"headless": True})
    try:
        print("Asimov 01 Isaac Sim 6.1.0 headless is up. ROS 2 extra should attach /cmd_vel /odom /scan /imu.")
        while app.is_running():
            app.update()
    finally:
        app.close()


if __name__ == "__main__":
    main()
