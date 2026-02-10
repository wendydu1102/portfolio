import argparse
import os
import textwrap

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt


# ---------------------- Constants / Column Names ----------------------

STATE = "U.S. State"
RATE_PCT_CHG = "% change in abortion rate, 2017-2020"
CLINIC_COUNT_2020 = "No. of abortion clinics, 2020"
CLINIC_PCT_CHG = "% change in the no. of abortion clinics, 2017-2020"
ABORT_BY_OCC_2020 = "No. of abortions, by state of occurrence, 2020"
PUBLIC_COUNT_2010 = "Total no. of publicly funded abortions , 2010"
PUBLIC_EXP_TOTAL_2015 = "Total reported public expenditures for abortions (in 000s of dollars), 2015"

# Illustrative bucket of states often described as having strong restrictions post-Dobbs.
PRO_LIFE_STATES = {
    "Alabama","Arkansas","Idaho","Indiana","Kentucky","Louisiana","Mississippi","Missouri","North Dakota",
    "Oklahoma","South Dakota","Tennessee","Texas","West Virginia","Wisconsin","Wyoming"
}


# ----------------------------- Utilities -----------------------------

def hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return "#{:02x}{:02x}{:02x}".format(*rgb)


def load_data(path: str) -> pd.DataFrame:
    try:
        return pd.read_excel(path, sheet_name="Guttmacher")
    except Exception as e:
        raise SystemExit(f"Failed to open workbook: {e}")


# ---------------------------- Visualizations ----------------------------

def viz1_abortion_deserts(df: pd.DataFrame, outpath: str):
    """Visualization 1: 'Abortion Deserts' horizontal bar chart with sandy-brown→blue gradient."""
    d = df[[STATE, CLINIC_COUNT_2020]].dropna()
    d = d[~d[STATE].astype(str).str.contains("Total|United States", case=False, na=False)]
    d[CLINIC_COUNT_2020] = pd.to_numeric(d[CLINIC_COUNT_2020], errors="coerce")
    d = d.dropna()
    d = d.sort_values(CLINIC_COUNT_2020, ascending=True)

    # Color gradient sandy brown -> vibrant blue
    start = np.array(hex_to_rgb("#F4A460"), dtype=float)  # sandy brown
    end = np.array(hex_to_rgb("#1e90ff"), dtype=float)    # dodger blue
    vals = d[CLINIC_COUNT_2020].to_numpy(dtype=float)
    vmin, vmax = float(vals.min()), float(vals.max())
    norm = (vals - vmin) / (vmax - vmin + 1e-12)
    colors = []
    for n in norm:
        rgb = (start*(1-n) + end*n).astype(int)
        colors.append(rgb_to_hex(tuple(rgb)))

    fig, ax = plt.subplots(figsize=(8, 10))
    ax.barh(d[STATE], d[CLINIC_COUNT_2020], color=colors, edgecolor="none")
    ax.set_xlabel("Number of Abortion Clinics (2020)")
    ax.set_ylabel("State")
    ax.set_title('The Growing Burden of "Abortion Deserts"')

    # Callout Mississippi if present, else the minimum state
    row = d[d[STATE].str.fullmatch(r"(?i)mississippi")]
    if not row.empty:
        r = row.iloc[0]
        y = d.index.get_loc(r.name)
    else:
        r = d.iloc[0]
        y = 0

    ax.annotate(f"{r[STATE]}: {int(r[CLINIC_COUNT_2020])} clinic(s)",
                xy=(float(r[CLINIC_COUNT_2020]), y),
                xytext=(float(r[CLINIC_COUNT_2020]) + max(2, vmax*0.05), y + 3),
                arrowprops=dict(arrowstyle="->", lw=1.5),
                bbox=dict(boxstyle="round,pad=0.2", facecolor="#f5deb3", edgecolor="#8b7355"))

    cap = ('Loaded term "Abortion Deserts" with desert vs. blue colors primes scarcity vs. plenty.\n'
           "A single extreme callout anchors perception.")
    ax.text(0.01, -0.06, cap, transform=ax.transAxes, fontsize=9, va="top")

    plt.tight_layout()
    fig.savefig(outpath, dpi=200, bbox_inches="tight")
    plt.close(fig)


def viz2_unaffordable_barrier(df: pd.DataFrame, outpath: str):
    """Visualization 2: Human-icons infographic with a single 'headline' cost figure."""
    d = df[[STATE, PUBLIC_COUNT_2010, PUBLIC_EXP_TOTAL_2015]].copy()
    d[PUBLIC_COUNT_2010] = pd.to_numeric(d[PUBLIC_COUNT_2010], errors="coerce")
    d[PUBLIC_EXP_TOTAL_2015] = pd.to_numeric(d[PUBLIC_EXP_TOTAL_2015], errors="coerce")
    d = d.dropna()
    d = d[(d[PUBLIC_COUNT_2010] > 0) & (d[PUBLIC_EXP_TOTAL_2015] > 0)]
    if not d.empty:
        # expenditures in 000s dollars -> dollars
        d["cost_per_abortion_proxy"] = (d[PUBLIC_EXP_TOTAL_2015] * 1000) / d[PUBLIC_COUNT_2010]
        headline = float(np.nanmedian(d["cost_per_abortion_proxy"]))
        figure_cost = int(round(headline / 100.0) * 100)  # round to nearest $100
    else:
        figure_cost = 1500

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.set_xlim(-1, 11)
    ax.set_ylim(-1, 7)
    ax.axis("off")

    # Draw 5x10 grid of abstract "people"
    heads = []
    for row in range(5):
        for col in range(10):
            x = col
            y = 5 - row
            heads.append((x + 0.0, y + 0.5, 0.15))
            ax.plot([x, x], [y - 0.2, y + 0.3], lw=2)  # body

    hx = [h[0] for h in heads]
    hy = [h[1] for h in heads]
    hs = [600 * h[2] for h in heads]
    ax.scatter(hx, hy, s=hs)

    ax.text(5, 2.5, f"${figure_cost:,}+", ha="center", va="center", fontsize=36, fontweight="bold")
    ax.text(5, 1.8, "headline estimated total cost (illustrative)", ha="center", va="center", fontsize=12)

    ax.text(0, 6.5, "The Unaffordable Barrier for Those in Need", fontsize=16, fontweight="bold", ha="left")
    sub = ("Emotional appeal via human icons; framing emphasizes hardship. "
           "Single aggregated figure ignores variability to maximize impact.")
    ax.text(0, 6.2, sub, fontsize=9, ha="left")

    plt.tight_layout()
    fig.savefig(outpath, dpi=200, bbox_inches="tight")
    plt.close(fig)


def viz3_pro_life_protections(df: pd.DataFrame, outpath: str):
    """Visualization 3: Two-bar comparison of average % changes in abortion rates (2017–2020)."""
    d = df[[STATE, RATE_PCT_CHG]].dropna()
    d[RATE_PCT_CHG] = pd.to_numeric(d[RATE_PCT_CHG], errors="coerce")
    d = d.dropna()
    d["Group"] = np.where(d[STATE].isin(PRO_LIFE_STATES),
                          "States with Strong Pro-Life Protections",
                          "States with Unrestricted Access")
    summary = d.groupby("Group", as_index=False)[RATE_PCT_CHG].mean().sort_values(RATE_PCT_CHG, ascending=False)

    fig, ax = plt.subplots(figsize=(7, 5))
    ax.bar(summary["Group"], summary[RATE_PCT_CHG])
    ax.set_ylabel("Average % Decrease in Abortion Rate (2017–2020)")
    ax.set_title("Pro-Life Protections Are Working")
    for i, v in enumerate(summary[RATE_PCT_CHG]):
        ax.text(i, v + 0.5, f"{v:.1f}%", ha="center")
    cap = ("Uses percent rate change (not absolute counts), loaded labels, and implies causation.\n"
           "Baseline differences are obscured.")
    ax.text(0.5, -0.18, cap, transform=ax.transAxes, ha="center", fontsize=9)

    plt.tight_layout()
    fig.savefig(outpath, dpi=200, bbox_inches="tight")
    plt.close(fig)


def viz4_national_tragedy(df: pd.DataFrame, outpath: str):
    """Visualization 4: Demonstrate cumulative 'always increasing' effect using 2020 state totals."""
    d = df[[STATE, ABORT_BY_OCC_2020]].dropna()
    d = d[~d[STATE].astype(str).str.contains("Total|United States", case=False, na=False)]
    d[ABORT_BY_OCC_2020] = pd.to_numeric(d[ABORT_BY_OCC_2020], errors="coerce")
    d = d.dropna().sort_values(ABORT_BY_OCC_2020, ascending=True)
    d["Cumulative"] = d[ABORT_BY_OCC_2020].cumsum()

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(range(len(d)), d["Cumulative"], lw=2, color="#8B0000")  # dark red
    ax.set_facecolor("#f2f2f2")
    ax.grid(True, which="both", axis="y", linewidth=0.6, color="#cccccc")

    ax.set_title("A National Tragedy: Over 63 Million Lives Lost", fontsize=16, fontweight="bold")
    ax.set_xlabel("States (sorted by 2020 abortions)")
    ax.set_ylabel("Cumulative Abortions (across states, 2020)")

    final_total = int(d["Cumulative"].iloc[-1])
    ax.text(0.5, 1.035, "Cumulative plots always go up; annual rates have different trends.",
            transform=ax.transAxes, ha="center", fontsize=10)

    txt = textwrap.fill(
        f"Emotional comparison: Total in this chart = {final_total:,}. "
        "Title invokes a larger multi-decade figure for impact (an apples-to-oranges comparison).",
        width=60
    )
    ax.annotate(txt, xy=(len(d)-1, d["Cumulative"].iloc[-1]),
                xytext=(len(d)*0.55, d["Cumulative"].max()*0.6),
                arrowprops=dict(arrowstyle='->', lw=1.5, color="#555555"),
                bbox=dict(boxstyle="round,pad=0.3", facecolor="#dddddd", edgecolor="#666666"))

    plt.tight_layout()
    fig.savefig(outpath, dpi=200, bbox_inches="tight")
    plt.close(fig)


# ----------------------------- Main -----------------------------

def main():
    parser = argparse.ArgumentParser(description="Generate four abortion-related visualizations from an Excel workbook.")
    parser.add_argument("--input", default="GuttmacherInstituteAbortionDataByState.xlsx",
                        help="Path to the Excel file (default: GuttmacherInstituteAbortionDataByState.xlsx)")
    parser.add_argument("--outdir", default=".",
                        help="Directory to save output figures (default: current directory)")
    args = parser.parse_args()

    df = load_data(args.input)

    os.makedirs(args.outdir, exist_ok=True)

    viz1_abortion_deserts(df, os.path.join(args.outdir, "viz1_abortion_deserts.png"))
    viz2_unaffordable_barrier(df, os.path.join(args.outdir, "viz2_unaffordable_barrier.png"))
    viz3_pro_life_protections(df, os.path.join(args.outdir, "viz3_pro_life_protections.png"))
    viz4_national_tragedy(df, os.path.join(args.outdir, "viz4_national_tragedy_cumulative.png"))

    print("Saved figures to:", os.path.abspath(args.outdir))


if __name__ == "__main__":
    main()
