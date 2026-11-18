"""Run the SeatPilot contract tests in normal project discovery."""
import importlib.util
from pathlib import Path

spec=importlib.util.spec_from_file_location('seatpilot_contract_tests',Path(__file__).resolve().parents[1]/'examples/seatpilot/test_app.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
SeatPilotTests=module.SeatPilotTests
