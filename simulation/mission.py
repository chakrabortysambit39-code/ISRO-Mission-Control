from pathlib import Path
import subprocess
import threading
import queue
import winsound

import pygame

from PySide6.QtCore import QObject, QTimer, Signal

from .physics import FlightPhysics


class MissionController(QObject):

    countdown_changed = Signal(int)
    telemetry_updated = Signal(dict)
    status_changed = Signal(str)
    log_event = Signal(str, str)
    mission_finished = Signal()

    def __init__(self):
        super().__init__()

        # ==========================================================
        # MISSION TIMER
        # ==========================================================

        self.timer = QTimer()
        self.timer.timeout.connect(self.update)

        # ==========================================================
        # PHYSICS
        # ==========================================================

        self.physics = FlightPhysics()

        # ==========================================================
        # MISSION STATE
        # ==========================================================

        self.phase = "IDLE"
        self.countdown = 10
        self.running = False
        self.orbit_seconds = 0

        # ==========================================================
        # VOICE QUEUE
        # ==========================================================

        self.voice_queue = queue.Queue()

        self.voice_thread = threading.Thread(
            target=self.voice_worker,
            daemon=True
        )

        self.voice_thread.start()

        # ==========================================================
        # MUSIC
        # ==========================================================

        pygame.mixer.init()

        self.song_path = (
            Path(__file__).resolve().parent.parent
            / "assets"
            / "maa_tujhe_salaam.mp3"
        )

    # ==============================================================
    # COUNTDOWN BEEP
    # ==============================================================

    def countdown_beep(self):

        try:

            winsound.Beep(
                950,
                100
            )

        except Exception:
            pass

    # ==============================================================
    # IGNITION SOUND
    # ==============================================================

    def ignition_beep(self):

        try:

            winsound.Beep(
                700,
                120
            )

            winsound.Beep(
                1200,
                180
            )

        except Exception:
            pass

    # ==============================================================
    # WINDOWS VOICE WORKER
    # ==============================================================

    def voice_worker(self):

        while True:

            text = self.voice_queue.get()

            if text is None:
                break

            try:

                safe_text = text.replace(
                    "'",
                    "''"
                )

                command = (
                    "Add-Type -AssemblyName System.Speech; "
                    "$speaker = New-Object "
                    "System.Speech.Synthesis.SpeechSynthesizer; "
                    "$speaker.Rate = 1; "
                    "$speaker.Volume = 100; "
                    f"$speaker.Speak('{safe_text}'); "
                    "$speaker.Dispose();"
                )

                subprocess.run(
                    [
                        "powershell",
                        "-NoProfile",
                        "-ExecutionPolicy",
                        "Bypass",
                        "-Command",
                        command
                    ],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    creationflags=subprocess.CREATE_NO_WINDOW
                )

            except Exception as error:

                print(
                    f"Voice error: {error}"
                )

            finally:

                self.voice_queue.task_done()

    # ==============================================================
    # SPEAK
    # ==============================================================

    def speak(self, text):

        self.voice_queue.put(text)

    # ==============================================================
    # START MISSION
    # ==============================================================

    def start(self):

        if self.running:
            return

        # Reset physics
        self.physics = FlightPhysics()

        # Reset mission
        self.phase = "COUNTDOWN"
        self.countdown = 10
        self.running = True
        self.orbit_seconds = 0

        # Reset telemetry
        self.telemetry_updated.emit({
            "altitude": 0.0,
            "velocity": 0.0,
            "fuel": 100.0,
            "temperature": 28.0
        })

        self.status_changed.emit(
            "COUNTDOWN INITIATED"
        )

        self.log_event.emit(
            "FLIGHT",
            "Launch sequence initiated"
        )

        # ==========================================================
        # T-10
        # ==========================================================

        self.countdown_changed.emit(
            10
        )

        self.log_event.emit(
            "COUNTDOWN",
            "T−10"
        )

        self.countdown_beep()

        # One second per countdown step
        self.timer.start(
            1000
        )

    # ==============================================================
    # ABORT
    # ==============================================================

    def abort(self):

        if not self.running:
            return

        self.running = False

        self.timer.stop()

        self.phase = "ABORTED"

        self.status_changed.emit(
            "MISSION ABORTED"
        )

        self.log_event.emit(
            "WARNING",
            "MISSION ABORT COMMAND RECEIVED"
        )

        try:

            pygame.mixer.music.stop()

        except Exception:
            pass

    # ==============================================================
    # MAIN MISSION LOOP
    # ==============================================================

    def update(self):

        if not self.running:
            return

        # ==========================================================
        # COUNTDOWN
        # ==========================================================

        if self.phase == "COUNTDOWN":

            self.countdown -= 1

            # ------------------------------------------------------
            # T-9 TO T-1
            # ------------------------------------------------------

            if self.countdown >= 1:

                self.countdown_changed.emit(
                    self.countdown
                )

                self.log_event.emit(
                    "COUNTDOWN",
                    f"T−{self.countdown}"
                )

                self.countdown_beep()

            # ------------------------------------------------------
            # T-0
            # ------------------------------------------------------

            else:

                self.countdown_changed.emit(
                    0
                )

                self.phase = "IGNITION"

                self.status_changed.emit(
                    "ENGINE IGNITION"
                )

                self.log_event.emit(
                    "ENGINE",
                    "T−0 — MAIN ENGINE IGNITION"
                )

                self.ignition_beep()

                self.speak(
                    "Ignition."
                )

        # ==========================================================
        # IGNITION
        # ==========================================================

        elif self.phase == "IGNITION":

            self.phase = "LIFTOFF"

            self.status_changed.emit(
                "LIFTOFF CONFIRMED"
            )

            self.log_event.emit(
                "FLIGHT",
                "Vehicle has cleared launch tower"
            )

            self.speak(
                "Liftoff confirmed."
            )

            self.update_physics()

        # ==========================================================
        # LIFTOFF
        # ==========================================================

        elif self.phase == "LIFTOFF":

            self.phase = "ASCENT"

            self.status_changed.emit(
                "ASCENT"
            )

            self.log_event.emit(
                "FLIGHT",
                "Vehicle ascending"
            )

            self.update_physics()

        # ==========================================================
        # ASCENT
        # ==========================================================

        elif self.phase == "ASCENT":

            self.update_physics()

            if self.physics.altitude >= 100:

                self.phase = "ORBIT"

                self.orbit_seconds = 0

                self.status_changed.emit(
                    "ORBIT INSERTION"
                )

                self.log_event.emit(
                    "FLIGHT",
                    "Stable orbital trajectory achieved"
                )

                self.speak(
                    "Orbit insertion confirmed."
                )

        # ==========================================================
        # ORBIT
        # ==========================================================

        elif self.phase == "ORBIT":

            self.orbit_seconds += 1

            self.update_physics()

            self.log_event.emit(
                "ORBIT",
                f"Orbital operations T+{self.orbit_seconds}s"
            )

            # Deploy satellite after 5 seconds
            if self.orbit_seconds >= 5:

                self.deploy_satellite()

    # ==============================================================
    # PHYSICS UPDATE
    # ==============================================================

    def update_physics(self):

        data = self.physics.update(
            self.phase
        )

        self.telemetry_updated.emit(
            data
        )

    # ==============================================================
    # SATELLITE DEPLOYMENT
    # ==============================================================

    def deploy_satellite(self):

        if not self.running:
            return

        self.running = False

        self.timer.stop()

        self.phase = "SATELLITE_DEPLOYED"

        self.status_changed.emit(
            "SATELLITE DEPLOYED"
        )

        self.log_event.emit(
            "MISSION",
            "SATELLITE DEPLOYMENT SUCCESSFUL"
        )

        self.speak(
            "Satellite deployed successfully."
        )

        # Wait before final announcement
        QTimer.singleShot(
            3000,
            self.finish_mission
        )

    # ==============================================================
    # MISSION SUCCESS
    # ==============================================================

    def finish_mission(self):

        self.status_changed.emit(
            "MISSION SUCCESS"
        )

        self.log_event.emit(
            "SUCCESS",
            "MISSION ACCOMPLISHED"
        )

        # Phonetic spelling for clearer pronunciation
        self.speak(
            "Mission accomplished. Jai Heend!"
        )

        # Start song after announcement
        QTimer.singleShot(
            3500,
            self.play_song
        )

        self.mission_finished.emit()

    # ==============================================================
    # PLAY MAA TUJHE SALAAM
    # ==============================================================

    def play_song(self):

        if not self.song_path.exists():

            self.log_event.emit(
                "AUDIO",
                "maa_tujhe_salaam.mp3 not found"
            )

            return

        try:

            pygame.mixer.music.load(
                str(self.song_path)
            )

            pygame.mixer.music.play()

            self.log_event.emit(
                "AUDIO",
                "PATRIOTIC AUDIO PLAYBACK STARTED"
            )

        except Exception as error:

            self.log_event.emit(
                "AUDIO",
                f"Audio playback error: {error}"
            )

    # ==============================================================
    # RESET
    # ==============================================================

    def reset(self):

        self.running = False

        self.timer.stop()

        self.phase = "IDLE"

        self.countdown = 10

        self.orbit_seconds = 0

        self.physics = FlightPhysics()

        try:

            pygame.mixer.music.stop()

        except Exception:
            pass

    # ==============================================================
    # SHUTDOWN
    # ==============================================================

    def shutdown(self):

        self.timer.stop()

        try:

            pygame.mixer.music.stop()

        except Exception:
            pass

        self.voice_queue.put(
            None
        )