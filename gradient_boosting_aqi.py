"""Train and evaluate a Gradient Boosting AQI classification model."""

import argparse
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import classification_report
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


DEFAULT_DATASET = Path("dataset") / "training" / "train_data.csv"
POLLUTANTS = ["PM2.5", "PM10", "SO2", "NO2", "CO", "O3"]
CATEGORICAL_FEATURES = ["wd", "station"]
NUMERIC_FEATURES = [
    "year",
    "month",
    "day",
    "hour",
    "TEMP",
    "PRES",
    "DEWP",
    "RAIN",
    "WSPM",
]
FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES
CLASS_NAMES = ["Good", "Moderate", "Unhealthy", "Hazardous"]

# EPA breakpoints use ppm or ppb for gaseous pollutants. The dataset stores
# every pollutant as micrograms per cubic meter, so convert before interpolation.
AQI_BREAKPOINTS = {
    "PM2.5": ([0, 12.0, 35.4, 55.4, 150.4, 250.4, 350.4, 500.4],
              [0, 50, 100, 150, 200, 300, 400, 500]),
    "PM10": ([0, 54, 154, 254, 354, 424, 504],
             [0, 50, 100, 150, 200, 300, 500]),
    "SO2": ([0, 35, 75, 185, 304, 604],
            [0, 50, 100, 150, 200, 300]),
    "NO2": ([0, 53, 100, 360, 649, 1249, 2049],
            [0, 50, 100, 150, 200, 300, 500]),
    "CO": ([0, 4.4, 9.4, 12.4, 15.4, 30.4, 50.4],
           [0, 50, 100, 150, 200, 300, 500]),
    "O3": ([0, 0.054, 0.070, 0.085, 0.105, 0.200, 0.400],
           [0, 50, 100, 150, 200, 300, 500]),
}
UNIT_CONVERTERS = {
    "PM2.5": lambda value: value,
    "PM10": lambda value: value,
    "SO2": lambda value: value / 2.62,
    "NO2": lambda value: value / 1.88,
    "CO": lambda value: value / 1145.0,
    "O3": lambda value: value / 1960.0,
}


def calculate_subindex(value, pollutant):
    """Calculate one AQI sub-index by linear interpolation."""
    if pd.isna(value):
        return np.nan

    concentrations, indices = AQI_BREAKPOINTS[pollutant]
    concentration = UNIT_CONVERTERS[pollutant](float(value))
    if concentration <= concentrations[0]:
        return float(indices[0])
    if concentration >= concentrations[-1]:
        return float(indices[-1])

    upper = np.searchsorted(concentrations, concentration)
    lower = upper - 1
    concentration_span = concentrations[upper] - concentrations[lower]
    index_span = indices[upper] - indices[lower]
    return (
        (index_span / concentration_span)
        * (concentration - concentrations[lower])
        + indices[lower]
    )


def interpolate_pollutants(dataframe):
    """Interpolate pollutant gaps in chronological order."""
    result = dataframe.sort_values("datetime").copy()
    result = result.set_index("datetime")
    result[POLLUTANTS] = result[POLLUTANTS].interpolate(
        method="time",
        limit_direction="both",
    )
    return result.reset_index()


def add_aqi_target(dataframe):
    """Create the overall AQI and four requested AQI categories."""
    result = dataframe.copy()
    subindex_columns = []
    for pollutant in POLLUTANTS:
        column = f"{pollutant}_AQI"
        result[column] = result[pollutant].apply(
            calculate_subindex,
            pollutant=pollutant,
        )
        subindex_columns.append(column)

    result["AQI"] = result[subindex_columns].max(axis=1, skipna=True)
    result["AQI_Category"] = pd.cut(
        result["AQI"],
        bins=[-np.inf, 50, 100, 200, np.inf],
        labels=CLASS_NAMES,
    )
    return result.dropna(subset=["AQI", "AQI_Category"])


def create_model():
    """Create preprocessing and Gradient Boosting steps."""
    numeric_preprocessor = SimpleImputer(strategy="median")
    categorical_preprocessor = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )
    preprocessor = ColumnTransformer(
        transformers=[
            ("numeric", numeric_preprocessor, NUMERIC_FEATURES),
            ("categorical", categorical_preprocessor, CATEGORICAL_FEATURES),
        ]
    )

    return Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            (
                "classifier",
                GradientBoostingClassifier(
                    learning_rate=0.1,
                    n_estimators=100,
                    max_depth=4,
                    random_state=42,
                ),
            ),
        ]
    )


def plot_feature_importances(model, top_n=25):
    """Plot the most important transformed features."""
    feature_names = model.named_steps[
        "preprocessor"
    ].get_feature_names_out()
    importances = model.named_steps["classifier"].feature_importances_
    top_features = pd.Series(importances, index=feature_names).nlargest(top_n)

    plt.figure(figsize=(10, 8))
    top_features.sort_values().plot(kind="barh")
    plt.title("Top Gradient Boosting Feature Importances")
    plt.xlabel("Importance")
    plt.tight_layout()
    plt.show()


def train_and_evaluate(dataset_path):
    """Train the model using a chronological 80/20 split."""
    dataframe = pd.read_csv(dataset_path, parse_dates=["datetime"])
    required_columns = {"datetime", *POLLUTANTS, *FEATURES}
    missing_columns = sorted(required_columns - set(dataframe.columns))
    if missing_columns:
        raise ValueError(
            f"Missing required columns: {', '.join(missing_columns)}"
        )

    dataframe = dataframe.sort_values("datetime")
    split_index = int(len(dataframe) * 0.8)
    if split_index <= 0 or split_index >= len(dataframe):
        raise ValueError("The dataset must contain enough rows to split.")

    train_data = interpolate_pollutants(dataframe.iloc[:split_index])
    test_data = interpolate_pollutants(dataframe.iloc[split_index:])
    train_data = add_aqi_target(train_data)
    test_data = add_aqi_target(test_data)

    model = create_model()
    model.fit(train_data[FEATURES], train_data["AQI_Category"])
    predictions = model.predict(test_data[FEATURES])

    print(classification_report(
        test_data["AQI_Category"],
        predictions,
        labels=CLASS_NAMES,
        target_names=CLASS_NAMES,
        zero_division=0,
    ))
    report = classification_report(
        test_data["AQI_Category"],
        predictions,
        labels=CLASS_NAMES,
        output_dict=True,
        zero_division=0,
    )
    print("Dangerous-class recall:")
    for class_name in ("Unhealthy", "Hazardous"):
        print(f"{class_name}: {report[class_name]['recall']:.3f}")
    plot_feature_importances(model)
    return model


def main():
    """Parse the optional dataset path and run training."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dataset",
        type=Path,
        default=DEFAULT_DATASET,
        help="Path to the AQI CSV dataset.",
    )
    args = parser.parse_args()
    train_and_evaluate(args.dataset)


if __name__ == "__main__":
    main()
