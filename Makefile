PYTHON ?= python3
SKILL_DIR := skills/data-charts-visualization

.PHONY: example example-data-charts-visualization

example: example-data-charts-visualization

example-data-charts-visualization:
	$(PYTHON) $(SKILL_DIR)/scripts/run_examples.py
