PYTHON := python3

run-date-pipeline:
# 	$(PYTHON) steps/load_interactions_step.py "$(DATE)"
# 	$(PYTHON) steps/user_interactions_step.py "$(DATE)"
# 	$(PYTHON) steps/subreddit_relations_step.py "$(DATE)"
# 	$(PYTHON) steps/filter_relations_step.py "$(DATE)"
	$(PYTHON) steps/identify_communities.py "$(DATE)"
	$(PYTHON) steps/export_network_step.py "$(DATE)"

run-timeseries:
	$(PYTHON) steps/build_timeseries_step.py

run-trajectories:
	$(PYTHON) steps/community_trajectories_step.py

run-label-input:
	$(PYTHON) steps/export_community_labeling_input_step.py

apply-labels:
	$(PYTHON) steps/apply_community_labels_step.py "$(LABELS)"

DATES ?= 2020-12 2021-12 2022-12 2023-12 2024-12

run-pipeline:
	@for date in $(DATES); do \
		echo "Running pipeline for $$date..."; \
		$(MAKE) run-date-pipeline DATE=$$date; \
	done
	@$(MAKE) run-timeseries
	@$(MAKE) run-trajectories

run-notebooks:
	jupyter lab