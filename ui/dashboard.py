from PySide6.QtCore import Qt
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QGridLayout,
    QLabel,
    QPushButton,
    QFrame,
    QProgressBar,
    QTextEdit,
)


class TelemetryCard(QFrame):
    def __init__(self, title, value, unit):
        super().__init__()

        self.setObjectName("TelemetryCard")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(18, 14, 18, 14)
        layout.setSpacing(3)

        title_label = QLabel(title)
        title_label.setObjectName("CardTitle")

        self.value_label = QLabel(value)
        self.value_label.setObjectName("CardValue")

        unit_label = QLabel(unit)
        unit_label.setObjectName("CardUnit")

        layout.addWidget(title_label)
        layout.addWidget(self.value_label)
        layout.addWidget(unit_label)

    def set_value(self, value):
        self.value_label.setText(str(value))


class Dashboard(QWidget):

    def __init__(self):
        super().__init__()

        self.setObjectName("Dashboard")

        self.setStyleSheet("""
            QWidget#Dashboard {
                background-color: #05080f;
                color: #e8f1ff;
            }

            QFrame#Panel {
                background-color: #0b111c;
                border: 1px solid #1b2a3d;
                border-radius: 8px;
            }

            QFrame#TelemetryCard {
                background-color: #0b111c;
                border: 1px solid #1b2a3d;
                border-radius: 8px;
            }

            QLabel#Title {
                color: #f1f6ff;
                font-size: 25px;
                font-weight: bold;
            }

            QLabel#Subtitle {
                color: #687b94;
                font-size: 11px;
            }

            QLabel#SystemReady {
                color: #00e676;
                font-size: 12px;
                font-weight: bold;
            }

            QLabel#SectionTitle {
                color: #71859f;
                font-size: 11px;
                font-weight: bold;
            }

            QLabel#CardTitle {
                color: #71859f;
                font-size: 10px;
                font-weight: bold;
            }

            QLabel#CardValue {
                color: #f1f6ff;
                font-size: 25px;
                font-weight: bold;
            }

            QLabel#CardUnit {
                color: #51657e;
                font-size: 9px;
            }

            QLabel#MissionName {
                color: #ffffff;
                font-size: 20px;
                font-weight: bold;
            }

            QLabel#MissionType {
                color: #71859f;
                font-size: 10px;
            }

            QLabel#MissionStatus {
                color: #00e676;
                font-size: 27px;
                font-weight: bold;
            }

            QLabel#Countdown {
                color: #00b7ff;
                font-size: 44px;
                font-weight: bold;
            }

            QTextEdit {
                background-color: #070d16;
                border: 1px solid #18283a;
                border-radius: 5px;
                color: #8da0b8;
                font-family: Consolas;
                font-size: 10px;
                padding: 8px;
            }

            QProgressBar {
                background-color: #101a28;
                border: none;
                border-radius: 4px;
                height: 8px;
                text-align: center;
            }

            QProgressBar::chunk {
                background-color: #00aaff;
                border-radius: 4px;
            }

            QPushButton {
                background-color: #101b2a;
                color: #dce9f7;
                border: 1px solid #263a52;
                border-radius: 6px;
                padding: 12px 28px;
                font-size: 12px;
                font-weight: bold;
            }

            QPushButton:hover {
                background-color: #16283c;
                border: 1px solid #00aaff;
            }

            QPushButton#LaunchButton {
                background-color: #123c2b;
                border: 1px solid #1e8050;
                color: #6dffb0;
            }

            QPushButton#LaunchButton:hover {
                background-color: #185a3d;
            }

            QPushButton#AbortButton {
                background-color: #3b1518;
                border: 1px solid #8d3035;
                color: #ff777d;
            }

            QPushButton#AbortButton:hover {
                background-color: #591d22;
            }
        """)

        self.build_ui()

    def build_ui(self):

        main_layout = QVBoxLayout(self)

        main_layout.setContentsMargins(
            24, 20, 24, 20
        )

        main_layout.setSpacing(12)

        # ==========================================================
        # HEADER
        # ==========================================================

        header = QHBoxLayout()

        title_box = QVBoxLayout()
        title_box.setSpacing(2)

        title = QLabel(
            "🛰  ISRO MISSION CONTROL"
        )

        title.setObjectName("Title")

        subtitle = QLabel(
            "INDIAN SPACE RESEARCH ORGANISATION  •  "
            "FLIGHT OPERATIONS"
        )

        subtitle.setObjectName("Subtitle")

        title_box.addWidget(title)
        title_box.addWidget(subtitle)

        system_status = QLabel(
            "●  SYSTEM NOMINAL"
        )

        system_status.setObjectName(
            "SystemReady"
        )

        header.addLayout(title_box)
        header.addStretch()
        header.addWidget(system_status)

        main_layout.addLayout(header)

        # ==========================================================
        # MISSION INFORMATION
        # ==========================================================

        mission_panel = QFrame()
        mission_panel.setObjectName("Panel")

        mission_layout = QHBoxLayout(
            mission_panel
        )

        mission_layout.setContentsMargins(
            20, 16, 20, 16
        )

        mission_info = QVBoxLayout()

        section = QLabel(
            "CURRENT MISSION"
        )

        section.setObjectName(
            "SectionTitle"
        )

        mission_name = QLabel(
            "CHANDRAYAAN-X"
        )

        mission_name.setObjectName(
            "MissionName"
        )

        mission_type = QLabel(
            "LUNAR EXPLORATION • SIMULATION"
        )

        mission_type.setObjectName(
            "MissionType"
        )

        mission_info.addWidget(section)
        mission_info.addWidget(mission_name)
        mission_info.addWidget(mission_type)

        mission_layout.addLayout(
            mission_info
        )

        mission_layout.addStretch()

        timer_info = QVBoxLayout()

        timer_title = QLabel(
            "MISSION ELAPSED TIME"
        )

        timer_title.setObjectName(
            "SectionTitle"
        )

        self.mission_timer = QLabel(
            "T+ 00:00:00"
        )

        self.mission_timer.setObjectName(
            "MissionName"
        )

        timer_info.addWidget(timer_title)
        timer_info.addWidget(
            self.mission_timer
        )

        mission_layout.addLayout(
            timer_info
        )

        main_layout.addWidget(
            mission_panel
        )

        # ==========================================================
        # TELEMETRY
        # ==========================================================

        telemetry_grid = QGridLayout()

        telemetry_grid.setSpacing(10)

        self.altitude = TelemetryCard(
            "ALTITUDE",
            "0.0",
            "KM"
        )

        self.velocity = TelemetryCard(
            "VELOCITY",
            "0.00",
            "KM/S"
        )

        self.fuel = TelemetryCard(
            "FUEL",
            "100.0",
            "%"
        )

        self.temperature = TelemetryCard(
            "TEMPERATURE",
            "28.0",
            "°C"
        )

        telemetry_grid.addWidget(
            self.altitude,
            0,
            0
        )

        telemetry_grid.addWidget(
            self.velocity,
            0,
            1
        )

        telemetry_grid.addWidget(
            self.fuel,
            0,
            2
        )

        telemetry_grid.addWidget(
            self.temperature,
            0,
            3
        )

        main_layout.addLayout(
            telemetry_grid
        )

        # ==========================================================
        # OPERATIONS
        # ==========================================================

        operations = QHBoxLayout()

        operations.setSpacing(12)

        # ----------------------------------------------------------
        # VEHICLE
        # ----------------------------------------------------------

        vehicle_panel = QFrame()

        vehicle_panel.setObjectName(
            "Panel"
        )

        vehicle_layout = QVBoxLayout(
            vehicle_panel
        )

        vehicle_layout.setContentsMargins(
            20, 18, 20, 18
        )

        vehicle_title = QLabel(
            "LAUNCH VEHICLE"
        )

        vehicle_title.setObjectName(
            "SectionTitle"
        )

        vehicle_name = QLabel(
            "LVM3"
        )

        vehicle_name.setObjectName(
            "MissionName"
        )

        vehicle_status = QLabel(
            "VEHICLE READY"
        )

        vehicle_status.setObjectName(
            "MissionStatus"
        )

        vehicle_layout.addWidget(
            vehicle_title
        )

        vehicle_layout.addWidget(
            vehicle_name
        )

        vehicle_layout.addSpacing(8)

        vehicle_layout.addWidget(
            vehicle_status
        )

        vehicle_layout.addStretch()

        rocket = QLabel("🚀")

        rocket.setAlignment(
            Qt.AlignCenter
        )

        rocket.setFont(
            QFont(
                "Segoe UI Emoji",
                55
            )
        )

        vehicle_layout.addWidget(
            rocket
        )

        operations.addWidget(
            vehicle_panel,
            1
        )

        # ----------------------------------------------------------
        # FLIGHT STATUS
        # ----------------------------------------------------------

        status_panel = QFrame()

        status_panel.setObjectName(
            "Panel"
        )

        status_layout = QVBoxLayout(
            status_panel
        )

        status_layout.setContentsMargins(
            20, 18, 20, 18
        )

        status_title = QLabel(
            "FLIGHT STATUS"
        )

        status_title.setObjectName(
            "SectionTitle"
        )

        self.flight_status = QLabel(
            "READY FOR LAUNCH"
        )

        self.flight_status.setObjectName(
            "MissionStatus"
        )

        self.countdown = QLabel(
            "T−10"
        )

        self.countdown.setObjectName(
            "Countdown"
        )

        self.countdown.setAlignment(
            Qt.AlignCenter
        )

        status_layout.addWidget(
            status_title
        )

        status_layout.addWidget(
            self.flight_status
        )

        status_layout.addStretch()

        status_layout.addWidget(
            self.countdown
        )

        status_layout.addStretch()

        operations.addWidget(
            status_panel,
            1
        )

        # ----------------------------------------------------------
        # MISSION LOG
        # ----------------------------------------------------------

        log_panel = QFrame()

        log_panel.setObjectName(
            "Panel"
        )

        log_layout = QVBoxLayout(
            log_panel
        )

        log_layout.setContentsMargins(
            20, 18, 20, 18
        )

        log_title = QLabel(
            "MISSION LOG"
        )

        log_title.setObjectName(
            "SectionTitle"
        )

        self.log = QTextEdit()

        self.log.setReadOnly(True)

        self.add_log(
            "SYSTEM",
            "Mission control initialized"
        )

        self.add_log(
            "SYSTEM",
            "Telemetry link established"
        )

        self.add_log(
            "SYSTEM",
            "Launch vehicle awaiting command"
        )

        log_layout.addWidget(
            log_title
        )

        log_layout.addWidget(
            self.log
        )

        operations.addWidget(
            log_panel,
            1
        )

        main_layout.addLayout(
            operations
        )

        # ==========================================================
        # FUEL BAR
        # ==========================================================

        fuel_box = QFrame()

        fuel_box.setObjectName(
            "Panel"
        )

        fuel_layout = QVBoxLayout(
            fuel_box
        )

        fuel_layout.setContentsMargins(
            18, 10, 18, 10
        )

        fuel_label = QLabel(
            "PROPULSION FUEL"
        )

        fuel_label.setObjectName(
            "SectionTitle"
        )

        self.fuel_bar = QProgressBar()

        self.fuel_bar.setRange(
            0,
            100
        )

        self.fuel_bar.setValue(
            100
        )

        self.fuel_bar.setTextVisible(
            False
        )

        fuel_layout.addWidget(
            fuel_label
        )

        fuel_layout.addWidget(
            self.fuel_bar
        )

        main_layout.addWidget(
            fuel_box
        )

        # ==========================================================
        # CONTROLS
        # ==========================================================

        controls = QHBoxLayout()

        controls.setSpacing(10)

        self.launch_button = QPushButton(
            "🚀  LAUNCH"
        )

        self.launch_button.setObjectName(
            "LaunchButton"
        )

        self.abort_button = QPushButton(
            "⛔  ABORT"
        )

        self.abort_button.setObjectName(
            "AbortButton"
        )

        fullscreen_button = QPushButton(
            "⛶  FULLSCREEN"
        )

        controls.addStretch()

        controls.addWidget(
            self.launch_button
        )

        controls.addWidget(
            self.abort_button
        )

        controls.addWidget(
            fullscreen_button
        )

        controls.addStretch()

        main_layout.addLayout(
            controls
        )

        fullscreen_button.clicked.connect(
            self.toggle_fullscreen
        )

    # ==============================================================
    # LOGGING
    # ==============================================================

    def add_log(
        self,
        source,
        message
    ):

        self.log.append(
            f"[{source}]  {message}"
        )

    # ==============================================================
    # FULLSCREEN
    # ==============================================================

    def toggle_fullscreen(self):

        window = self.window()

        if window.isFullScreen():

            window.showNormal()

        else:

            window.showFullScreen()

    # ==============================================================
    # TELEMETRY
    # ==============================================================

    def set_telemetry(
        self,
        altitude=None,
        velocity=None,
        fuel=None,
        temperature=None
    ):

        if altitude is not None:

            self.altitude.set_value(
                altitude
            )

        if velocity is not None:

            self.velocity.set_value(
                velocity
            )

        if fuel is not None:

            self.fuel.set_value(
                fuel
            )

            # FIX:
            # Convert decimal values such as
            # "99.6" safely to an integer.

            try:

                fuel_value = float(fuel)

                fuel_value = max(
                    0,
                    min(
                        100,
                        fuel_value
                    )
                )

                self.fuel_bar.setValue(
                    int(fuel_value)
                )

            except (
                ValueError,
                TypeError
            ):

                self.fuel_bar.setValue(
                    0
                )

        if temperature is not None:

            self.temperature.set_value(
                temperature
            )