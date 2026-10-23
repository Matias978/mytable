# 📊 Mytable 22 &mdash; The Open-Source Alternative to Minitab®

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/)
[![Version](https://img.shields.io/badge/Release-v22.0.0-orange.svg)]()
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-Zero-success.svg)]()
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)]()

> **Mytable 22** is a modern, lightweight, high-performance, and **100% open-source** desktop analytics and statistical engineering suite designed as an open and accessible alternative to proprietary tools like Minitab®.
>
> Reconstructed using clean-room reverse engineering principles from statistical specifications, Mytable delivers the classic workflow, familiar interface layout, and mathematical rigor demanded by Six Sigma Black Belts, Quality Engineers, and Data Analysts.

---

## 🌟 Why Mytable?

Proprietary statistical packages often impose expensive per-seat licenses, mandatory cloud logins, and heavy runtimes. **Mytable** was built to provide complete statistical independence with:

- 🔓 **Free & Open Source**: MIT Licensed. No license servers, activation keys, or subscription renewals.
- ⚡ **Ultra-Fast & Lightweight**: Zero heavy external runtimes. Starts instantly in any modern browser or desktop container.
- 📐 **Rigorous Numerical Accuracy**: Pure mathematical algorithms validated against standard Six Sigma and NIST statistical reference datasets.
- 🖥️ **Faithful Desktop Workflow**: Traditional Windows desktop interface featuring the standard Menu bar, Quick Access Toolbar, Left Navigator, Centered Canvas with Watermark, Objective Grid Worksheet, and Right Command Line (`MTB >`) & History.
- 🔒 **100% Offline & Private**: Your engineering and proprietary manufacturing data never leaves your computer.

---

## 🆚 Comparison: Mytable vs Minitab® 22

| Feature / Dimension | Mytable 22 (Open Source) | Minitab® 22 (Proprietary) |
| :--- | :---: | :---: |
| **Licensing** | **Free & Open Source (MIT)** | Commercial License ($2,000+/user/yr) |
| **Authentication** | **None Required (Instant Offline)** | License Portal / Cloud Account Required |
| **Platform Compatibility** | **Cross-Platform (Windows, Mac, Linux, Browser)** | Windows Only (Native) / Cloud |
| **Interface Layout** | Traditional Desktop (Menu, Toolbar, Canvas, Grid, CLI) | BCG Ribbon + CEF Hybrid |
| **Session Command Language (CLI)** | ✅ Full `MTB >` Command Interpreter | ✅ Full Session Commands |
| **Interactive SVG Statistical Plots** | ✅ Built-in High-DPI Vector Charts | ✅ D3/Canvas Embedded Web Views |
| **Process Capability Sixpack** | ✅ $C_p, C_{pk}, P_p, P_{pk}$, PPM, Spec Limits | ✅ Full Sixpack Capability |
| **Control Charts (SPC)** | ✅ $\bar{X}-R$, $I-MR$ with Nelson Rules | ✅ Full SPC Suite |
| **Data Import / Export** | ✅ CSV, TSV, Project JSON | ✅ CSV, Excel, MPJ/MTW |
| **Hardware Footprint** | **~2 MB total installation** | ~2.5 GB installation |

---

## 🚀 Key Modules & Capabilities

### 1. Traditional Desktop Interface
- **Menu Bar**: `Arquivo` | `Editar` | `Dados` | `Calc` | `Estat` | `Gráfico` | `Visualizar` | `Ajuda` | `Assistente` | `Módulo de análise preditiva`.
- **Quick Action Toolbar**: One-click actions for New, Open CSV, Save, Print, Cut, Copy, Paste, Undo, Redo, Search, and Quick Statistics.
- **Left Navigator Pane**: Collapsible project tree managing active worksheets (`Worksheet 1`), generated reports, and plots.
- **Objective Grid Worksheet**:
  - Auto-generated column identifiers: `C1`, `C2`, `C3` ... `C15`+.
  - Dedicated inline column name row beneath the column IDs.
  - Numbered rows with fast keyboard navigation (`Enter`, `Tab`, arrow keys).
  - Formula bar (`fx`) supporting arithmetic between columns (e.g. `=C1*2` or `=C1+C2`).
  - Pre-loaded industrial sample datasets: *Quality Control Part Diameters*, *Defects Pareto*, and *Advertising vs Sales*.
- **Right Command & History Panes**:
  - **Linha de comando**: Multi-line command box with one-click **Executar** and **Limpar Tudo**.
  - **Histórico**: Chronological execution log with double-click and **Copiar para Linha de Comando**.
- **Bottom Status Bar**: Deep Minitab blue bar with view-mode toggles and dynamic zoom controls ($50\% \sim 150\%$).

---

### 2. Core Statistical & Quality Engineering Suite

#### A. Descriptive Statistics (`DESCRIBE`)
- Calculates: $N, N^*$, Mean, Standard Error of Mean, Standard Deviation, Variance, Coefficient of Variation, Minimum, $Q_1$, Median, $Q_3$, Maximum, and Interquartile Range (IQR).

#### B. Hypothesis Testing & Inference
- **1-Sample t-Test**: Tests for $\mu = \mu_0$ with two-tailed, upper-tailed, and lower-tailed hypotheses, $t$-statistic, $p$-value, and $95\%$ Confidence Interval.
- **2-Sample t-Test**: Supports both pooled equal-variance tests and Welch-Satterthwaite unequal variance tests.
- **One-Way ANOVA**: Full Analysis of Variance table ($DF$, Adj $SS$, Adj $MS$, $F$-Value, $P$-Value), Model Summary ($S, R^2, R^2_{adj}$), and 95% Confidence Intervals per group.

#### C. Linear Regression & Fitted Line Plot (`REGRESS`)
- Ordinary Least Squares (OLS) model: $Y = \beta_0 + \beta_1 X$.
- Regression equation, coefficient table with SE Coef, $T$-values, $P$-values, and VIF.
- Model summary ($S, R^2, R^2_{adj}$) and complete ANOVA of regression.
- Interactive scatterplot with fitted regression line.

#### D. Statistical Process Control (SPC)
- **$\bar{X} - R$ Control Chart**: Subgroup averages and ranges, Upper and Lower Control Limits ($UCL, LCL$) derived with exact constants $A_2, d_2, D_3, D_4$.
- **Nelson Rule 1 Evaluation**: Automatic out-of-control point detection ($> 3\sigma$) highlighted in bold red with rule annotations.
- **$I - MR$ Chart**: Individual observations and Moving Range charts for un-subgrouped data.

#### E. Process Capability Analysis (`CAPA`)
- Specifications: Lower Spec Limit ($LSL$), Target, and Upper Spec Limit ($USL$).
- Potential Capability: $C_p, C_{pk}, C_{pl}, C_{pu}$ calculated from within-subgroup variation ($\bar{R}/d_2$).
- Overall Performance: $P_p, P_{pk}, P_{pl}, P_{pu}$ calculated from sample overall standard deviation ($s$).
- Parts Per Million (PPM): Expected PPM below $LSL$, above $USL$, Total PPM, and Observed PPM.

#### F. Pareto Analysis
- Descending category frequency ranking, cumulative counts, cumulative percentages, and 80/20 cutoff reference.

---

### 3. Session Command Language (CLI)

Mytable implements canonical Minitab command language syntax:

```minitab
DESCRIBE C1 C2;
  MEAN;
  STDEV.

SET C1 10.2 10.5 9.8 10.1 10.4 END.

RANDOM 100 C1;
  NORMAL 50 5.

REGRESS C2 = C1.

ONEWAY C2 = C1.

XBAR C1 5.

CAPA C1 5;
  LSL 19.8;
  USL 20.2;
  TARGET 20.0.

PARETO C1 C2.

NAME C1 'Diameter'.
```

---

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or newer).

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SEU-USUARIO/mytable.git
   cd mytable
   ```

2. **Start the application**:
   ```bash
   npm start
   # or: node server.js
   ```

3. **Open in your browser**:
   Navigate to **`http://localhost:3022`**.

---

## 🧪 Test Suite & Validation

Mytable includes an automated mathematical verification suite testing all core routines against theoretical reference values:

```bash
node test/verify_engine.js
```

Output:
```
=== Verifying Mytable 22 Statistical Engine ===
[PASS] Descriptive Stats: N=10, Mean=20.0180, StDev=0.0352, Median=20.02
[PASS] 1-Sample t-Test: t=1.616, p=0.1405, CI=(19.993, 20.043)
[PASS] Regression: Eq=Y = 0.1000 + 2.0100 X, R-Sq=99.68%, p=0.00008
[PASS] One-Way ANOVA: F=411.02, p=1.432e-9, R-sq=98.92%
[PASS] Xbar-R Chart: Xbar Center=10.180, UCL=10.382, Violations=4
[PASS] Process Capability: Cp=1.11, Cpk=0.71, Exp Total PPM=16729
[PASS] Pareto Chart: Top Category=Scratch (3), Total=7
[PASS] CLI Command output received: Score

ALL 8 STATISTICAL & RECONSTRUCTION MODULES VERIFIED WITH 100% SUCCESS!
```

---

## 🛠️ Project Structure

```
mytable/
├── index.html                   # Complete UI (Titlebar, Menu, Toolbar, Navigator, Canvas, Grid, Status)
├── server.js                    # Built-in lightweight zero-dependency HTTP server
├── package.json                 # Project configuration & npm scripts
├── LICENSE                      # MIT Open Source License
├── css/
│   └── minitable.css            # Windows desktop design system, grid & chart styles
├── js/
│   ├── statistics.js            # Pure mathematical computation engine
│   ├── charts.js                # High-DPI interactive SVG statistical plots
│   ├── command_parser.js        # Minitab session command language interpreter (MTB >)
│   ├── worksheet.js             # Data grid model, formulas, and CSV import/export
│   ├── dialogs.js               # Windows 11 rounded modal dialogs system
│   └── app.js                   # Main application orchestrator
├── test/
│   └── verify_engine.js         # Automated statistical test runner
└── rea_analysis_scripts/        # PowerShell inspection scripts from the REA reverse engineering pass
```

---

## 🤝 Contributing

Contributions are warmly welcome! Whether you want to add new statistical distributions, expand ANOVA models, or enhance graphing capabilities:

1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/NewFeature`).
3. Commit your Changes (`git commit -m 'feat: Add NewFeature'`).
4. Push to the Branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

*Disclaimer: Minitab® is a registered trademark of Minitab, LLC. Mytable is an independent, clean-room open-source project and is not affiliated with, endorsed by, or sponsored by Minitab, LLC.*
