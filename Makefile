PYTHON := python3

run-pipeline:
	$(PYTHON) steps/load_interactions_step.py "$(DATE)"
	$(PYTHON) steps/user_interactions_step.py "$(DATE)"
	$(PYTHON) steps/subreddit_relations_step.py "$(DATE)"
	$(PYTHON) steps/filter_relations_step.py "$(DATE)"
	$(PYTHON) steps/identify_communities.py "$(DATE)"
	$(PYTHON) steps/export_network_step.py "$(DATE)"

run-timeseries:
	$(PYTHON) steps/build_timeseries_step.py

run-notebooks:
	jupyter lab