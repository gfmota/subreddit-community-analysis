PYTHON := python3

run-pipeline:
	$(PYTHON) steps/load_interactions_step.py "$(DATE)"
	$(PYTHON) steps/user_interactions_step.py "$(DATE)"
	$(PYTHON) steps/subreddit_relations_step.py "$(DATE)"