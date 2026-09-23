# PROMPT FOR ANTIGRAVITY — ROBUST ML EXPERIMENT: CATBOOST + LIGHTGBM + ENSEMBLE

## Role

Act as a senior Machine Learning engineer and research-oriented experiment designer.

Your job is to inspect the existing project, understand the dataset and prediction target, then build a **rigorous, reproducible ML experiment** using:

1. CatBoost
2. LightGBM
3. An ensemble of strong individual models

The goal is NOT to blindly maximize one validation score.

The goal is to determine:

- whether the models genuinely learn useful patterns;
- whether the evaluation is trustworthy;
- whether there is data leakage;
- whether the models overfit;
- which features/patterns drive predictions;
- whether the model can make **conditional predictions based on patterns present in the data**;
- and whether the final result generalizes to unseen data.

Do NOT fabricate results. Every conclusion must be supported by an actual experiment.

---

# 1. FIRST: INSPECT THE EXISTING PROJECT

Before changing code:

- Inspect the repository structure.
- Find the dataset loading/preprocessing code.
- Identify the target variable.
- Identify all feature columns.
- Identify how train/validation/test data are currently split.
- Identify existing feature engineering.
- Identify existing models and evaluation metrics.
- Identify whether the dataset is temporal/time-series data.
- Identify whether multiple stations/groups/entities exist.
- Identify missing-value handling.
- Identify categorical variables.
- Identify target-derived columns.
- Identify rolling/window/statistical features.
- Identify any feature that could contain future information.

Do NOT immediately rewrite everything.

First produce a short internal/project report:

```text
Dataset:
Target:
Prediction task:
Feature groups:
Temporal structure:
Group/station structure:
Potential leakage sources:
Current split strategy:
Current evaluation metrics:
Current baseline:
Main risks:
```

Then implement the experiment.

---

# 2. DEFINE THE PREDICTION TASK CORRECTLY

Determine whether the task is:

- regression,
- binary classification,
- multiclass classification,
- or another supervised learning problem.

Use the target definition already established in the project.

Do NOT silently redefine the target.

If the project predicts a future value, explicitly define the prediction horizon.

For example:

```text
X(t) -> y(t+1)
X(t) -> y(t+6)
X(t) -> y(t+24)
```

The exact horizon must come from the existing project/task.

If the target is derived from measurements, inspect whether any feature contains information calculated using the target or future observations.

---

# 3. DATA LEAKAGE AUDIT — VERY IMPORTANT

Perform a systematic leakage audit BEFORE model training.

Check all of the following:

## 3.1 Target leakage

Find features that are:

- the target itself;
- direct transformations of the target;
- values calculated from the target;
- labels encoded into features;
- future target values;
- target rolling statistics;
- target-centered windows.

Remove or redesign them if they leak information unavailable at prediction time.

## 3.2 Temporal leakage

If the data has timestamps:

- Never randomly mix future observations into training when the real task is future prediction.
- Sort by time before splitting.
- Ensure validation/test timestamps occur after training timestamps.
- Rolling features must only use information available at or before prediction time.
- Never use centered rolling windows.
- Never calculate normalization/scaling parameters using the entire dataset before splitting.

Use a chronological split or an appropriate time-series validation strategy.

## 3.3 Group/station leakage

If multiple stations/entities/groups exist:

Check whether the same entity appears in both train and validation/test in a way that creates unrealistic evaluation.

Perform an additional group-aware experiment when appropriate.

For example:

- temporal split within stations;
- group holdout;
- station-aware validation.

Do NOT automatically remove station information. Determine whether it is legitimately available at prediction time.

## 3.4 Preprocessing leakage

Any operation that learns from data must be fitted ONLY on the training portion:

- scaling;
- imputation statistics;
- encoding;
- feature selection;
- PCA;
- target encoding;
- feature construction involving aggregate statistics.

Transform validation/test using parameters learned from training only.

## 3.5 Feature engineering leakage

For every engineered feature, answer:

> "At prediction time, would this exact value actually be available?"

If not, remove or redesign it.

Create a leakage audit table:

```text
Feature | Source | Uses future data? | Uses target? | Safe? | Action
```

---

# 4. UNDERSTAND THE DATA PATTERNS

Do not treat the dataset as a meaningless matrix.

Analyze patterns that may legitimately help prediction.

Depending on the dataset, inspect:

### Temporal patterns
- hour of day
- day of week
- month
- season
- long-term trend
- recent history
- lag relationships
- rolling statistics

### Spatial/group patterns
- station/entity differences
- geographic/group effects
- persistent station-specific behavior

### Environmental/domain patterns
Use only variables actually present in the dataset.

For example, for air-quality data:

- PM2.5
- PM10
- NO2
- SO2
- CO
- O3
- temperature
- pressure
- dew point
- wind direction
- wind speed
- rainfall

Do NOT assume that every variable is available or valid for the actual prediction time.

---

# 5. CONDITIONAL PREDICTION BASED ON DATA PATTERNS

The model should be capable of making predictions conditioned on patterns that are legitimately observable at prediction time.

Create meaningful features where justified, such as:

```text
lag_1
lag_3
lag_6
lag_12
lag_24
rolling_mean_3
rolling_mean_6
rolling_mean_12
rolling_std_6
rolling_std_24
trend
change_from_previous
hour
day_of_week
month
```

BUT:

Every temporal feature must be constructed strictly from past/current information.

For example:

Correct:

```text
rolling_mean_24(t)
=
mean(values from t-23 through t)
```

Potentially leaked:

```text
centered_rolling_mean_24(t)
=
mean(values before AND after t)
```

Do not create arbitrary features just to increase the score.

Every engineered feature should have a reason.

---

# 6. BASELINES FIRST

Before CatBoost and LightGBM, create meaningful baselines.

At minimum, where applicable:

- naive baseline;
- historical mean/median baseline;
- simple linear model;
- a simple tree-based model.

For time-series forecasting, include a persistence/lag baseline when meaningful:

```text
prediction(t+h) = value(t)
```

The purpose is to answer:

> "Does the sophisticated model actually learn something beyond a simple rule?"

Record all baseline metrics.

---

# 7. CATBOOST EXPERIMENT

Train a strong CatBoost model.

Do NOT simply use default parameters.

Investigate relevant hyperparameters such as:

```text
iterations
learning_rate
depth
l2_leaf_reg
random_strength
bagging_temperature
border_count
loss_function
subsample
rsm
early_stopping_rounds
```

Only tune parameters applicable to the actual task/model version.

Use:

- validation-based early stopping;
- reproducible random seeds;
- appropriate objective/loss;
- appropriate categorical handling if categorical features exist.

Do not use target-derived categorical encodings that leak validation/test information.

---

# 8. LIGHTGBM EXPERIMENT

Train a strong LightGBM model.

Investigate relevant parameters such as:

```text
n_estimators
learning_rate
num_leaves
max_depth
min_child_samples
min_split_gain
subsample
subsample_freq
colsample_bytree
reg_alpha
reg_lambda
max_bin
```

Also consider:

```text
feature_fraction
bagging_fraction
bagging_freq
```

when applicable.

Use:

- early stopping;
- reproducible seeds;
- validation-based tuning;
- an objective appropriate for the prediction task.

Do not blindly maximize training performance.

---

# 9. HYPERPARAMETER SEARCH

Do not claim that "all parameters" were checked if they were not.

Interpret "check all parameters" as:

> systematically investigate all **relevant high-impact parameters** for the selected model and task.

Use a sensible search strategy:

1. broad search;
2. identify promising regions;
3. refine around promising configurations;
4. confirm the selected configuration on an untouched test set.

Prefer:

- RandomizedSearch;
- Optuna;
- Bayesian optimization;
- or another principled search method

over an enormous brute-force grid.

Keep the search computationally realistic.

Record:

```text
experiment_id
model
parameters
validation_metric
training_metric
training_time
best_iteration
```

---

# 10. OVERFITTING DETECTION

Do not judge overfitting only by intuition.

For every model, compare:

```text
Train performance
Validation performance
Test performance
```

For example:

```text
Model       Train RMSE   Val RMSE   Test RMSE
CatBoost       ...          ...        ...
LightGBM       ...          ...        ...
Ensemble       ...          ...        ...
```

Also inspect learning curves where possible.

Look for:

```text
Training error keeps improving
while validation error stops improving or worsens
```

Use early stopping.

Compare performance across multiple validation windows/folds when the data structure allows it.

Do not tune directly on the final test set.

---

# 11. ENSEMBLE

Build an ensemble only after strong individual models exist.

At minimum investigate:

### Simple averaging

```text
prediction =
0.5 * CatBoost +
0.5 * LightGBM
```

### Weighted averaging

Search for weights using validation data ONLY.

Example:

```text
prediction =
w * CatBoost +
(1-w) * LightGBM
```

where:

```text
0 <= w <= 1
```

If appropriate, investigate:

- weighted averaging;
- stacking;
- blending.

For stacking:

- generate out-of-fold predictions;
- train the meta-model only on out-of-fold predictions;
- never train the meta-model directly on predictions generated from data the base model was trained on.

This is critical to avoid ensemble leakage.

---

# 12. ROBUST VALIDATION

Use the validation method that matches the actual prediction problem.

## If temporal:

Prefer:

```text
Train:      [--------]
Validation:          [----]
Test:                    [----]
```

or walk-forward validation:

```text
Fold 1: Train -> Validation
Fold 2: Train --------> Validation
Fold 3: Train ----------------> Validation
```

## If non-temporal:

Use appropriate stratified/group-aware cross-validation.

Do NOT randomly shuffle time-series observations merely because it gives a better score.

---

# 13. FINAL TEST SET

The final test set must remain untouched during:

- feature selection;
- hyperparameter tuning;
- ensemble weight optimization;
- threshold optimization;
- model selection.

Use it only for final evaluation.

Report:

```text
Final model:
Test metrics:
Confidence/uncertainty if available:
```

Do not repeatedly inspect the test score and then modify the model.

---

# 14. EVALUATION METRICS

Choose metrics based on the actual task.

## Regression

At minimum consider:

```text
MAE
RMSE
R²
```

Also consider:

```text
Median Absolute Error
MAPE
sMAPE
```

only when mathematically appropriate for the target.

Do not use MAPE blindly when target values can be zero or near zero.

## Classification

At minimum consider:

```text
Accuracy
Precision
Recall
F1
Confusion Matrix
```

For imbalanced classification also consider:

```text
Balanced Accuracy
ROC-AUC
PR-AUC
```

Use macro/weighted metrics appropriately.

---

# 15. ERROR ANALYSIS

Do not stop at one final metric.

Analyze errors by meaningful conditions.

For example:

```text
Low target range
Medium target range
High target range
Extreme target range
```

For temporal data:

```text
hour
day of week
month
season
```

For grouped data:

```text
station
region
entity
```

Identify where the model performs poorly.

Produce tables such as:

```text
Condition | Samples | MAE | RMSE | Bias
```

This is essential for determining whether the model genuinely captures patterns or only performs well on easy cases.

---

# 16. RESIDUAL / ERROR PATTERN ANALYSIS

For regression, inspect:

```text
actual vs predicted
residual distribution
residual vs predicted
residual vs time
residual by target range
```

Look specifically for:

- systematic underprediction;
- systematic overprediction;
- poor performance on extremes;
- temporal drift;
- station/group bias;
- heteroscedasticity;
- clusters of large errors.

If the model systematically underestimates extreme values, explicitly report that instead of hiding it behind the overall RMSE.

---

# 17. FEATURE IMPORTANCE AND PATTERN INTERPRETATION

Use multiple methods where appropriate:

- CatBoost feature importance;
- LightGBM feature importance;
- permutation importance;
- SHAP, if computationally practical.

Do not interpret feature importance as causality.

Answer:

> Which observable patterns does the model actually use?

For example:

```text
Feature                  Importance
recent_lag               ...
rolling_mean             ...
temperature              ...
wind_speed               ...
station                  ...
hour                     ...
```

Then investigate whether these patterns are plausible and available at prediction time.

---

# 18. ABLATION EXPERIMENTS

Run controlled experiments.

For example:

### Experiment A
Raw features only.

### Experiment B
Raw + temporal features.

### Experiment C
Raw + lag features.

### Experiment D
Raw + rolling features.

### Experiment E
All legitimate features.

Compare them using the same evaluation strategy.

This answers:

> "Which type of information actually improves prediction?"

Do not add features just because they increase the score once.

---

# 19. LEAKAGE STRESS TEST

Create a deliberate leakage test.

Temporarily identify suspicious features and compare:

```text
Model with suspicious feature
vs
Model without suspicious feature
```

If performance changes dramatically, investigate why.

Do NOT keep a feature merely because it improves the score.

The final model must contain only features available at prediction time.

---

# 20. GENERALIZATION STRESS TEST

Perform additional robustness checks where possible:

- different time periods;
- different stations/groups;
- high/low target ranges;
- different random seeds;
- multiple validation windows.

The objective is to determine whether the model's performance is stable.

Report variance across runs/folds when applicable.

---

# 21. REPRODUCIBILITY

Every experiment must be reproducible.

Set seeds where applicable.

Save:

```text
random_seed
feature_list
preprocessing configuration
model parameters
validation strategy
evaluation metrics
best iteration
```

Create an experiment configuration rather than scattering magic numbers throughout the code.

---

# 22. EXPERIMENT TRACKING

Create a structured experiment results table.

Example:

```text
Experiment
Model
Feature Set
Split Strategy
Parameters
Train Score
Validation Score
Test Score
Overfit Gap
Training Time
Notes
```

Save the results to CSV/JSON if appropriate.

Do not overwrite previous experiment results.

---

# 23. MODEL SELECTION

Do NOT select a model solely because it has the highest validation score.

Consider:

- validation performance;
- test performance;
- train-validation gap;
- stability across folds/windows;
- performance on difficult cases;
- leakage risk;
- complexity;
- inference cost;
- interpretability;
- robustness.

Do not create a subjective "winner score".

Present the evidence so the researcher can decide.

---

# 24. FINAL REPORT

At the end, generate a concise but complete report containing:

## A. Dataset
- number of samples;
- number of features;
- target;
- missing values;
- groups/stations;
- temporal range.

## B. Leakage audit
List every identified risk and how it was handled.

## C. Validation strategy
Explain exactly how train/validation/test were separated.

## D. Baselines
Show baseline metrics.

## E. CatBoost
Show:

- best parameters;
- validation metrics;
- test metrics;
- overfitting analysis.

## F. LightGBM
Show the same.

## G. Ensemble
Show:

- ensemble method;
- weights/meta-model;
- validation result;
- final test result;
- how leakage was prevented.

## H. Error analysis
Show where predictions fail.

## I. Pattern analysis
Show which observable patterns/features drive predictions.

## J. Ablation study
Show which feature groups actually help.

## K. Final conclusion

The conclusion MUST be evidence-based.

Use language like:

```text
The experiment provides evidence that...
Performance decreases when...
The largest errors occur under...
The feature group contributes...
The model appears sensitive to...
```

Avoid unsupported statements such as:

```text
This model is definitely accurate.
This model understands the data perfectly.
This model will work in production.
```

---

# 25. IMPORTANT RULES

1. NEVER fabricate metrics.
2. NEVER fabricate experiment results.
3. NEVER hide poor results.
4. NEVER use the test set for tuning.
5. NEVER leak future information into features.
6. NEVER use target-derived information unless it is legitimately available at prediction time.
7. NEVER randomly shuffle time-series data without justification.
8. NEVER claim "no leakage" without performing an actual audit.
9. NEVER claim "no overfitting" from a single metric.
10. NEVER optimize only for training performance.
11. NEVER create arbitrary features solely to improve the score.
12. NEVER change the target definition without documenting it.
13. NEVER delete difficult samples just because they hurt performance.
14. NEVER silently drop rows unless there is a documented reason.
15. Preserve the original dataset.
16. Keep preprocessing and feature engineering reproducible.
17. Keep the final test set untouched until the final evaluation.
18. If something cannot be verified from the available data/code, explicitly state that it could not be verified.

---

# 26. REQUIRED OUTPUTS

Create/modify the project so that it produces:

```text
experiments/
    experiment_results.csv
    leakage_audit.csv
    error_analysis.csv
    feature_importance.csv
    ablation_results.csv
    final_report.md
    models/
        catboost/
        lightgbm/
        ensemble/
```

Adjust the exact structure if the existing project has a better organization.

Also create a single reproducible entry point, for example:

```text
run_experiment.py
```

or an appropriate notebook/script structure.

The entry point should be capable of rerunning the complete experiment.

---

# 27. FINAL RESPONSE TO THE USER

After implementation, report:

1. What you inspected.
2. What the prediction task actually is.
3. What leakage risks were found.
4. How the data was split.
5. What baselines were used.
6. CatBoost results.
7. LightGBM results.
8. Ensemble results.
9. Overfitting evidence.
10. Error/pattern analysis.
11. Ablation results.
12. Remaining uncertainties.
13. Exact files created/modified.
14. Exact command needed to reproduce the experiment.

If something failed, say exactly what failed and why.

Do not hide failures behind a vague "completed successfully."

---

# CORE PRINCIPLE

The objective is NOT:

> "Get the highest possible score."

The objective is:

> "Build an experiment whose score can be trusted, determine what patterns the model is learning, identify where it fails, and establish whether the performance generalizes to genuinely unseen data."

Treat every metric as evidence, not as truth.
