import json


def test_lab(page, sdk):
    page.goto("https://nivguler-accessibe.github.io/")
    report = sdk.generate_report(sdk.audit())
    with open("report.json", "w") as f:
        json.dump(report, f, indent=2)
