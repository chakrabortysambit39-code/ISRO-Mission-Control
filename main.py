import sys

from PySide6.QtWidgets import QApplication

from ui.dashboard import Dashboard
from simulation.mission import MissionController


def main():

    app = QApplication(sys.argv)

    app.setApplicationName(
        "ISRO Mission Control"
    )

    window = Dashboard()

    window.resize(
        1400,
        850
    )

    controller = MissionController()

    # -------------------------
    # LAUNCH
    # -------------------------

    window.launch_button.clicked.connect(
        controller.start
    )

    # -------------------------
    # ABORT
    # -------------------------

    window.abort_button.clicked.connect(
        controller.abort
    )

    # -------------------------
    # COUNTDOWN
    # -------------------------

    controller.countdown_changed.connect(
        lambda value:
        window.countdown.setText(
            f"T−{value}"
        )
    )

    # -------------------------
    # STATUS
    # -------------------------

    controller.status_changed.connect(
        lambda status:
        window.flight_status.setText(
            status
        )
    )

    # -------------------------
    # LOG
    # -------------------------

    controller.log_event.connect(
        lambda source, message:
        window.add_log(
            source,
            message
        )
    )

    # -------------------------
    # TELEMETRY
    # -------------------------

    def update_telemetry(data):

        window.set_telemetry(
            altitude=f"{data['altitude']:.1f}",
            velocity=f"{data['velocity']:.2f}",
            fuel=f"{data['fuel']:.1f}",
            temperature=f"{data['temperature']:.1f}"
        )

    controller.telemetry_updated.connect(
        update_telemetry
    )

    # -------------------------
    # MISSION COMPLETE
    # -------------------------

    controller.mission_finished.connect(
        lambda:
        window.add_log(
            "SUCCESS",
            "MISSION COMPLETED — JAI HIND 🇮🇳"
        )
    )

    window.show()

    sys.exit(
        app.exec()
    )


if __name__ == "__main__":
    main()