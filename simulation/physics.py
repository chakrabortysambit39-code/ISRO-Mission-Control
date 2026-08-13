import random


class FlightPhysics:

    def __init__(self):
        self.altitude = 0.0
        self.velocity = 0.0
        self.fuel = 100.0
        self.temperature = 28.0

    def update(self, phase):

        if phase == "COUNTDOWN":
            self.temperature += random.uniform(-0.05, 0.05)

        elif phase == "IGNITION":
            self.temperature += random.uniform(0.5, 1.5)
            self.fuel -= random.uniform(0.1, 0.3)

        elif phase == "LIFTOFF":
            self.altitude += random.uniform(0.8, 2.0)
            self.velocity += random.uniform(0.05, 0.15)
            self.fuel -= random.uniform(0.15, 0.3)
            self.temperature += random.uniform(0.1, 0.5)

        elif phase == "ASCENT":
            self.altitude += random.uniform(2.0, 6.0)
            self.velocity += random.uniform(0.05, 0.12)
            self.fuel -= random.uniform(0.1, 0.2)
            self.temperature += random.uniform(-0.2, 0.3)

        elif phase == "ORBIT":
            self.altitude += random.uniform(-0.5, 0.5)
            self.velocity += random.uniform(-0.01, 0.01)
            self.temperature += random.uniform(-0.1, 0.1)

        self.fuel = max(0, min(100, self.fuel))
        self.temperature = max(20, min(100, self.temperature))

        return {
            "altitude": self.altitude,
            "velocity": self.velocity,
            "fuel": self.fuel,
            "temperature": self.temperature,
        }