import pytest
from accessflow_sdk import AccessFlowSDK, finalize_reports


@pytest.fixture
def sdk(page):
    return AccessFlowSDK(page)


def pytest_sessionfinish(session, exitstatus):
    finalize_reports()
