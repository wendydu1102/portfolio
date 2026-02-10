import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path


csv_path = Path("grocerydb.csv")  
df = pd.read_csv(csv_path)

need = ["FPro_class", "Protein", "Fiber, total dietary", "Sugars, total", "Sodium"]
df = df[need].dropna()
df["FPro_class"] = pd.to_numeric(df["FPro_class"], errors="coerce").astype("Int64")
df = df[df["FPro_class"].between(0, 3)]


grp = (
    df.groupby("FPro_class")[["Protein", "Fiber, total dietary", "Sugars, total", "Sodium"]]
      .mean()
      .rename(columns={"Fiber, total dietary": "Fiber", "Sugars, total": "Sugar"})
)

plot_df = grp[["Sugar", "Sodium", "Protein", "Fiber"]].copy()

plot_df[["Sugar", "Sodium"]] *= -1

plot_df = plot_df.reindex([3, 2, 1, 0])


fig, ax = plt.subplots(figsize=(12, 6.5))

colors = ["#ef8a62", "#fddbc7", "#67a9cf", "#c7eae5"]  

plot_df.plot(
    kind="barh",
    stacked=True,
    ax=ax,
    width=0.75,
    color=colors,
    edgecolor="none",
    legend=True,
)

ax.axvline(0, color="black", linewidth=2)

ax.set_title(
    "The Nutritional Tradeoff: Processing Swaps Protein & Fiber for Sugar and Sodium",
    pad=14,
)
ax.set_xlabel("Average Nutrient Content (g per 100g)")
ax.set_ylabel("NOVA Processing Class")

ax.set_yticklabels(plot_df.index.tolist())

ax.legend(title="Nutrient Type", bbox_to_anchor=(1.02, 1.02), loc="upper left", frameon=True)

ax.xaxis.grid(True, linestyle="--", alpha=0.35)
ax.yaxis.grid(False)

plt.tight_layout()
plt.show()
