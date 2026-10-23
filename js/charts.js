/**
 * Minitable 22 - Interactive High-DPI SVG Statistical Visualizer
 * Directly replicates Minitab 22's modern chart layouts, annotations, and palettes.
 */

const Charts = (() => {

    function createSvgElement(tag, attrs = {}) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, v);
        }
        return el;
    }

    // ------------------------------------------------------------------------
    // 1. Histogram with Normal Distribution Fit
    // ------------------------------------------------------------------------
    function renderHistogram(container, dataRaw, title = "Histogram of Data with Normal Curve") {
        container.innerHTML = "";
        const data = Statistics.filterNumeric(dataRaw);
        if (data.length < 2) {
            container.innerHTML = "<div class='chart-empty'>Insufficient data for Histogram</div>";
            return;
        }

        const stats = Statistics.describe(data);
        const width = 640, height = 380;
        const margin = { top: 40, right: 140, bottom: 50, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        // Sturges or Rice binning
        const numBins = Math.max(5, Math.min(25, Math.ceil(Math.sqrt(data.length))));
        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        const range = maxVal - minVal || 1;
        const binWidth = range / numBins;

        const bins = Array.from({ length: numBins }, (_, i) => ({
            x0: minVal + i * binWidth,
            x1: minVal + (i + 1) * binWidth,
            count: 0
        }));

        data.forEach(v => {
            let binIdx = Math.floor((v - minVal) / binWidth);
            if (binIdx >= numBins) binIdx = numBins - 1;
            bins[binIdx].count++;
        });

        const maxCount = Math.max(...bins.map(b => b.count));
        const svg = createSvgElement("svg", {
            viewBox: `0 0 ${width} ${height}`,
            class: "minitab-chart-svg"
        });

        // Background
        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", {
            x: margin.left + plotWidth / 2,
            y: 24,
            "text-anchor": "middle",
            class: "chart-title"
        });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        // Grid lines
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const y = margin.top + (plotHeight * (yTicks - i)) / yTicks;
            svg.appendChild(createSvgElement("line", {
                x1: margin.left,
                y1: y,
                x2: margin.left + plotWidth,
                y2: y,
                stroke: "#e8eaed",
                "stroke-width": 1
            }));
            const label = createSvgElement("text", {
                x: margin.left - 8,
                y: y + 4,
                "text-anchor": "end",
                class: "axis-tick-label"
            });
            label.textContent = Math.round((maxCount * i) / yTicks);
            svg.appendChild(label);
        }

        // Draw Bins
        bins.forEach(bin => {
            const x = margin.left + ((bin.x0 - minVal) / range) * plotWidth;
            const w = (binWidth / range) * plotWidth - 1;
            const h = (bin.count / maxCount) * plotHeight;
            const y = margin.top + plotHeight - h;

            const rect = createSvgElement("rect", {
                x,
                y,
                width: Math.max(0, w),
                height: h,
                fill: "#1b65d4",
                stroke: "#0d47a1",
                "stroke-width": 1,
                rx: 1
            });
            const tooltip = createSvgElement("title");
            tooltip.textContent = `Range: [${bin.x0.toFixed(2)}, ${bin.x1.toFixed(2)}]\nCount: ${bin.count}`;
            rect.appendChild(tooltip);
            svg.appendChild(rect);
        });

        // Draw Normal Distribution Curve
        if (stats.stdev > 0) {
            let curvePath = "";
            const points = 100;
            for (let i = 0; i <= points; i++) {
                const xVal = minVal + (range * i) / points;
                const z = (xVal - stats.mean) / stats.stdev;
                const pdf = (1 / (stats.stdev * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
                // Scale to frequency count: area = N * binWidth
                const expectedCount = pdf * stats.n * binWidth;
                const px = margin.left + (plotWidth * i) / points;
                const py = margin.top + plotHeight - (expectedCount / maxCount) * plotHeight;
                curvePath += (i === 0 ? "M " : " L ") + `${px.toFixed(1)} ${py.toFixed(1)}`;
            }
            svg.appendChild(createSvgElement("path", {
                d: curvePath,
                fill: "none",
                stroke: "#d9381e",
                "stroke-width": 2.2
            }));
        }

        // X Axis labels
        for (let i = 0; i <= 5; i++) {
            const xVal = minVal + (range * i) / 5;
            const x = margin.left + (plotWidth * i) / 5;
            const label = createSvgElement("text", {
                x,
                y: margin.top + plotHeight + 18,
                "text-anchor": "middle",
                class: "axis-tick-label"
            });
            label.textContent = xVal.toFixed(2);
            svg.appendChild(label);
        }

        // Summary Stats Box (Minitab classic side badge)
        const boxX = margin.left + plotWidth + 15;
        const boxY = margin.top + 10;
        svg.appendChild(createSvgElement("rect", {
            x: boxX,
            y: boxY,
            width: 115,
            height: 90,
            fill: "#f8f9fa",
            stroke: "#dadce0",
            rx: 4
        }));

        const statRows = [
            `Mean: ${stats.mean.toFixed(3)}`,
            `StDev: ${stats.stdev.toFixed(3)}`,
            `N: ${stats.n}`,
            `Min: ${stats.min.toFixed(2)}`,
            `Max: ${stats.max.toFixed(2)}`
        ];

        statRows.forEach((txt, idx) => {
            const tEl = createSvgElement("text", {
                x: boxX + 10,
                y: boxY + 20 + idx * 15,
                class: "stats-badge-text"
            });
            tEl.textContent = txt;
            svg.appendChild(tEl);
        });

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 2. Control Chart: Xbar-R Chart (Dual Plot)
    // ------------------------------------------------------------------------
    function renderXbarRChart(container, xbarData, title = "Xbar-R Control Chart") {
        container.innerHTML = "";
        const width = 640, height = 480;
        const margin = { top: 35, right: 90, bottom: 40, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const paneHeight = 160;

        const svg = createSvgElement("svg", {
            viewBox: `0 0 ${width} ${height}`,
            class: "minitab-chart-svg"
        });

        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Main Title
        const titleEl = createSvgElement("text", {
            x: width / 2,
            y: 22,
            "text-anchor": "middle",
            class: "chart-title"
        });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        function drawPane(yOffset, paneTitle, statsObj, yAxisLabel) {
            const { centerLine, ucl, lcl, values, violations } = statsObj;
            const n = values.length;

            const yMin = Math.min(lcl, Math.min(...values)) * 0.98;
            const yMax = Math.max(ucl, Math.max(...values)) * 1.02;
            const yRange = yMax - yMin || 1;

            const getY = val => yOffset + paneHeight - ((val - yMin) / yRange) * paneHeight;
            const getX = idx => margin.left + (plotWidth * idx) / (n - 1 || 1);

            // Pane title & background
            const pTitle = createSvgElement("text", {
                x: margin.left,
                y: yOffset - 6,
                class: "pane-title"
            });
            pTitle.textContent = paneTitle;
            svg.appendChild(pTitle);

            // Centerline & Limits
            const lines = [
                { val: ucl, color: "#d9381e", label: `UCL=${ucl.toFixed(2)}`, dash: "4 3" },
                { val: centerLine, color: "#0b8043", label: `_X=${centerLine.toFixed(2)}`, dash: "" },
                { val: lcl, color: "#d9381e", label: `LCL=${lcl.toFixed(2)}`, dash: "4 3" }
            ];

            lines.forEach(l => {
                const y = getY(l.val);
                svg.appendChild(createSvgElement("line", {
                    x1: margin.left,
                    y1: y,
                    x2: margin.left + plotWidth,
                    y2: y,
                    stroke: l.color,
                    "stroke-width": 1.5,
                    "stroke-dasharray": l.dash
                }));
                const lbl = createSvgElement("text", {
                    x: margin.left + plotWidth + 6,
                    y: y + 3,
                    fill: l.color,
                    class: "chart-limit-label"
                });
                lbl.textContent = l.label;
                svg.appendChild(lbl);
            });

            // Series Path
            let pathD = "";
            values.forEach((v, idx) => {
                const px = getX(idx);
                const py = getY(v);
                pathD += (idx === 0 ? "M " : " L ") + `${px} ${py}`;
            });
            svg.appendChild(createSvgElement("path", {
                d: pathD,
                fill: "none",
                stroke: "#1b65d4",
                "stroke-width": 1.8
            }));

            // Points
            values.forEach((v, idx) => {
                const px = getX(idx);
                const py = getY(v);
                const isViolated = violations.includes(idx + 1);

                const circle = createSvgElement("circle", {
                    cx: px,
                    cy: py,
                    r: isViolated ? 5.5 : 3.5,
                    fill: isViolated ? "#d9381e" : "#1b65d4",
                    stroke: isViolated ? "#8a1604" : "#ffffff",
                    "stroke-width": 1.5
                });

                const tip = createSvgElement("title");
                tip.textContent = `Subgroup ${idx + 1}: ${v.toFixed(3)}${isViolated ? " [Rule 1 Violated! Beyond limits]" : ""}`;
                circle.appendChild(tip);
                svg.appendChild(circle);

                if (isViolated) {
                    const tag = createSvgElement("text", {
                        x: px,
                        y: py - 8,
                        "text-anchor": "middle",
                        fill: "#d9381e",
                        "font-size": "10px",
                        "font-weight": "bold"
                    });
                    tag.textContent = "1";
                    svg.appendChild(tag);
                }
            });
        }

        // Draw Xbar pane
        drawPane(margin.top + 15, "Xbar Chart (Subgroup Means)", xbarData.xbar, "Mean");
        // Draw R pane
        drawPane(margin.top + paneHeight + 60, "R Chart (Subgroup Ranges)", xbarData.r, "Range");

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 3. Process Capability Sixpack / Capability Plot
    // ------------------------------------------------------------------------
    function renderProcessCapability(container, capa, title = "Process Capability of Data") {
        container.innerHTML = "";
        const width = 640, height = 400;
        const margin = { top: 40, right: 180, bottom: 50, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const svg = createSvgElement("svg", {
            viewBox: `0 0 ${width} ${height}`,
            class: "minitab-chart-svg"
        });

        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", {
            x: margin.left + plotWidth / 2,
            y: 24,
            "text-anchor": "middle",
            class: "chart-title"
        });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        const data = capa.data;
        const minVal = Math.min(...data, capa.lsl !== null ? capa.lsl : Infinity);
        const maxVal = Math.max(...data, capa.usl !== null ? capa.usl : -Infinity);
        const pad = (maxVal - minVal) * 0.1 || 1;
        const xMin = minVal - pad;
        const xMax = maxVal + pad;
        const xRange = xMax - xMin;

        // Bins
        const numBins = 14;
        const binW = (maxVal - minVal) / numBins;
        const bins = Array.from({ length: numBins }, (_, i) => ({
            x0: minVal + i * binW,
            x1: minVal + (i + 1) * binW,
            count: 0
        }));

        data.forEach(v => {
            let idx = Math.floor((v - minVal) / binW);
            if (idx >= numBins) idx = numBins - 1;
            if (idx >= 0) bins[idx].count++;
        });

        const maxCount = Math.max(...bins.map(b => b.count));

        // Draw Bins
        bins.forEach(bin => {
            const x = margin.left + ((bin.x0 - xMin) / xRange) * plotWidth;
            const w = (binW / xRange) * plotWidth - 1;
            const h = (bin.count / maxCount) * plotHeight;
            const y = margin.top + plotHeight - h;

            svg.appendChild(createSvgElement("rect", {
                x,
                y,
                width: Math.max(0, w),
                height: h,
                fill: "#e8f0fe",
                stroke: "#1b65d4",
                "stroke-width": 1
            }));
        });

        // Spec Lines (LSL, Target, USL)
        const specLines = [];
        if (capa.lsl !== null) specLines.push({ val: capa.lsl, label: "LSL", color: "#d9381e" });
        if (capa.target !== null) specLines.push({ val: capa.target, label: "Target", color: "#0b8043" });
        if (capa.usl !== null) specLines.push({ val: capa.usl, label: "USL", color: "#d9381e" });

        specLines.forEach(sl => {
            const x = margin.left + ((sl.val - xMin) / xRange) * plotWidth;
            svg.appendChild(createSvgElement("line", {
                x1: x,
                y1: margin.top,
                x2: x,
                y2: margin.top + plotHeight,
                stroke: sl.color,
                "stroke-width": 2,
                "stroke-dasharray": "5 4"
            }));
            const lbl = createSvgElement("text", {
                x,
                y: margin.top - 6,
                "text-anchor": "middle",
                fill: sl.color,
                "font-weight": "bold",
                "font-size": "11px"
            });
            lbl.textContent = `${sl.label}=${sl.val}`;
            svg.appendChild(lbl);
        });

        // Within and Overall Distribution Curves
        [
            { sd: capa.stdevWithin, color: "#1b65d4", dash: "" },
            { sd: capa.stdevOverall, color: "#d9381e", dash: "3 3" }
        ].forEach(curve => {
            let d = "";
            const pts = 80;
            for (let i = 0; i <= pts; i++) {
                const xVal = xMin + (xRange * i) / pts;
                const z = (xVal - capa.mean) / curve.sd;
                const pdf = (1 / (curve.sd * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z);
                const countEst = pdf * capa.n * binW;
                const px = margin.left + (plotWidth * i) / pts;
                const py = margin.top + plotHeight - (countEst / maxCount) * plotHeight;
                d += (i === 0 ? "M " : " L ") + `${px} ${py}`;
            }
            svg.appendChild(createSvgElement("path", {
                d,
                fill: "none",
                stroke: curve.color,
                "stroke-width": 2,
                "stroke-dasharray": curve.dash
            }));
        });

        // Side Metrics Box
        const sideX = margin.left + plotWidth + 15;
        const sideY = margin.top;
        svg.appendChild(createSvgElement("rect", {
            x: sideX,
            y: sideY,
            width: 155,
            height: 290,
            fill: "#f8f9fa",
            stroke: "#dadce0",
            rx: 4
        }));

        const items = [
            `Process Data:`,
            `LSL: ${capa.lsl !== null ? capa.lsl : "*"}`,
            `Target: ${capa.target !== null ? capa.target : "*"}`,
            `USL: ${capa.usl !== null ? capa.usl : "*"}`,
            `Sample Mean: ${capa.mean.toFixed(3)}`,
            `Sample N: ${capa.n}`,
            `StDev (Within): ${capa.stdevWithin.toFixed(3)}`,
            `StDev (Overall): ${capa.stdevOverall.toFixed(3)}`,
            `--- Potential (Within) ---`,
            `Cp: ${capa.cp !== null ? capa.cp.toFixed(2) : "*"}`,
            `Cpk: ${capa.cpk !== null ? capa.cpk.toFixed(2) : "*"}`,
            `--- Overall Capability ---`,
            `Pp: ${capa.pp !== null ? capa.pp.toFixed(2) : "*"}`,
            `Ppk: ${capa.ppk !== null ? capa.ppk.toFixed(2) : "*"}`,
            `Exp Total PPM: ${capa.ppmExpected.total}`,
            `Obs Total PPM: ${capa.ppmObserved}`
        ];

        items.forEach((txt, idx) => {
            const isHeader = txt.startsWith("---") || txt.startsWith("Process");
            const t = createSvgElement("text", {
                x: sideX + 8,
                y: sideY + 18 + idx * 17,
                fill: isHeader ? "#1a73e8" : "#3c4043",
                "font-weight": isHeader ? "bold" : "normal",
                "font-size": isHeader ? "11px" : "10px"
            });
            t.textContent = txt;
            svg.appendChild(t);
        });

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 4. Pareto Chart (Dual Axis)
    // ------------------------------------------------------------------------
    function renderPareto(container, paretoData, title = "Pareto Chart of Defects") {
        container.innerHTML = "";
        const width = 640, height = 380;
        const margin = { top: 40, right: 60, bottom: 70, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const svg = createSvgElement("svg", {
            viewBox: `0 0 ${width} ${height}`,
            class: "minitab-chart-svg"
        });

        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", {
            x: width / 2,
            y: 24,
            "text-anchor": "middle",
            class: "chart-title"
        });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        const items = paretoData.items;
        const n = items.length;
        const maxCount = items[0].count * 1.05;
        const barWidth = (plotWidth / n) * 0.7;
        const barStep = plotWidth / n;

        // 80% line
        const y80 = margin.top + plotHeight * 0.2;
        svg.appendChild(createSvgElement("line", {
            x1: margin.left,
            y1: y80,
            x2: margin.left + plotWidth,
            y2: y80,
            stroke: "#ea8600",
            "stroke-dasharray": "4 4",
            "stroke-width": 1.5
        }));
        const t80 = createSvgElement("text", {
            x: margin.left + plotWidth + 4,
            y: y80 + 4,
            fill: "#ea8600",
            "font-size": "10px",
            "font-weight": "bold"
        });
        t80.textContent = "80%";
        svg.appendChild(t80);

        // Bars
        items.forEach((item, idx) => {
            const x = margin.left + idx * barStep + (barStep - barWidth) / 2;
            const h = (item.count / maxCount) * plotHeight;
            const y = margin.top + plotHeight - h;

            const rect = createSvgElement("rect", {
                x,
                y,
                width: barWidth,
                height: h,
                fill: "#1b65d4",
                stroke: "#0d47a1"
            });
            const tip = createSvgElement("title");
            tip.textContent = `${item.category}\nCount: ${item.count} (${item.percent.toFixed(1)}%)\nCum: ${item.cumPercent.toFixed(1)}%`;
            rect.appendChild(tip);
            svg.appendChild(rect);

            // Category label (angled if long)
            const lbl = createSvgElement("text", {
                x: x + barWidth / 2,
                y: margin.top + plotHeight + 16,
                "text-anchor": "end",
                transform: `rotate(-35, ${x + barWidth / 2}, ${margin.top + plotHeight + 16})`,
                class: "axis-tick-label"
            });
            lbl.textContent = item.category;
            svg.appendChild(lbl);

            // Count label on top of bar
            const cLbl = createSvgElement("text", {
                x: x + barWidth / 2,
                y: y - 4,
                "text-anchor": "middle",
                "font-size": "10px",
                fill: "#3c4043"
            });
            cLbl.textContent = item.count;
            svg.appendChild(cLbl);
        });

        // Cumulative Line
        let lineD = "";
        items.forEach((item, idx) => {
            const px = margin.left + idx * barStep + barStep / 2;
            const py = margin.top + plotHeight * (1.0 - item.cumPercent / 100);
            lineD += (idx === 0 ? "M " : " L ") + `${px} ${py}`;
        });

        svg.appendChild(createSvgElement("path", {
            d: lineD,
            fill: "none",
            stroke: "#d9381e",
            "stroke-width": 2.2
        }));

        items.forEach((item, idx) => {
            const px = margin.left + idx * barStep + barStep / 2;
            const py = margin.top + plotHeight * (1.0 - item.cumPercent / 100);
            const dot = createSvgElement("circle", {
                cx: px,
                cy: py,
                r: 4,
                fill: "#d9381e",
                stroke: "#ffffff",
                "stroke-width": 1.5
            });
            svg.appendChild(dot);
        });

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 5. Fitted Line Plot / Scatterplot with Regression
    // ------------------------------------------------------------------------
    function renderFittedLinePlot(container, reg, title = "Fitted Line Plot") {
        container.innerHTML = "";
        const width = 640, height = 380;
        const margin = { top: 40, right: 140, bottom: 50, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const svg = createSvgElement("svg", {
            viewBox: `0 0 ${width} ${height}`,
            class: "minitab-chart-svg"
        });

        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", {
            x: margin.left + plotWidth / 2,
            y: 24,
            "text-anchor": "middle",
            class: "chart-title"
        });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        const xMin = Math.min(...reg.x);
        const xMax = Math.max(...reg.x);
        const yMin = Math.min(...reg.y);
        const yMax = Math.max(...reg.y);
        const xPad = (xMax - xMin) * 0.08 || 1;
        const yPad = (yMax - yMin) * 0.08 || 1;

        const getX = v => margin.left + ((v - (xMin - xPad)) / ((xMax - xMin) + 2 * xPad)) * plotWidth;
        const getY = v => margin.top + plotHeight - ((v - (yMin - yPad)) / ((yMax - yMin) + 2 * yPad)) * plotHeight;

        // Points
        for (let i = 0; i < reg.n; i++) {
            const px = getX(reg.x[i]);
            const py = getY(reg.y[i]);
            const c = createSvgElement("circle", {
                cx: px,
                cy: py,
                r: 4,
                fill: "#1b65d4",
                stroke: "#0d47a1",
                "stroke-width": 1
            });
            const tip = createSvgElement("title");
            tip.textContent = `X: ${reg.x[i]}, Y: ${reg.y[i]}\nFit: ${reg.fitted[i].toFixed(2)}\nRes: ${reg.residuals[i].toFixed(2)}`;
            c.appendChild(tip);
            svg.appendChild(c);
        }

        // Regression Line
        const x1 = xMin - xPad;
        const x2 = xMax + xPad;
        const y1Hat = reg.intercept + reg.slope * x1;
        const y2Hat = reg.intercept + reg.slope * x2;

        svg.appendChild(createSvgElement("line", {
            x1: getX(x1),
            y1: getY(y1Hat),
            x2: getX(x2),
            y2: getY(y2Hat),
            stroke: "#d9381e",
            "stroke-width": 2.2
        }));

        // Side Equation Box
        const sideX = margin.left + plotWidth + 15;
        const sideY = margin.top + 10;
        svg.appendChild(createSvgElement("rect", {
            x: sideX,
            y: sideY,
            width: 120,
            height: 95,
            fill: "#f8f9fa",
            stroke: "#dadce0",
            rx: 4
        }));

        const lines = [
            "Model Summary",
            `S: ${reg.modelSummary.s.toFixed(3)}`,
            `R-Sq: ${reg.modelSummary.rSq.toFixed(1)}%`,
            `R-Sq(adj): ${reg.modelSummary.rSqAdj.toFixed(1)}%`
        ];

        lines.forEach((txt, idx) => {
            const t = createSvgElement("text", {
                x: sideX + 8,
                y: sideY + 18 + idx * 18,
                class: "stats-badge-text",
                "font-weight": idx === 0 ? "bold" : "normal"
            });
            t.textContent = txt;
            svg.appendChild(t);
        });

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 6. Scatter Plot (Gráfico de Dispersão)
    // ------------------------------------------------------------------------
    function renderScatterPlot(container, xRaw, yRaw, title = "Gráfico de Dispersão", xLabel = "Variável X", yLabel = "Variável Y") {
        container.innerHTML = "";
        const pairs = [];
        for (let i = 0; i < Math.min(xRaw.length, yRaw.length); i++) {
            const x = parseFloat(xRaw[i]), y = parseFloat(yRaw[i]);
            if (!isNaN(x) && !isNaN(y)) pairs.push({ x, y });
        }
        if (pairs.length < 2) {
            container.innerHTML = "<div class='chart-empty'>Dados insuficientes para Gráfico de Dispersão (mínimo 2 pares).</div>";
            return;
        }

        const width = 640, height = 380;
        const margin = { top: 40, right: 40, bottom: 50, left: 65 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const xMin = Math.min(...pairs.map(p => p.x));
        const xMax = Math.max(...pairs.map(p => p.x));
        const yMin = Math.min(...pairs.map(p => p.y));
        const yMax = Math.max(...pairs.map(p => p.y));
        const xSpan = xMax - xMin || 1;
        const ySpan = yMax - yMin || 1;

        const getX = v => margin.left + ((v - xMin) / xSpan) * plotWidth;
        const getY = v => margin.top + plotHeight - ((v - yMin) / ySpan) * plotHeight;

        const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "minitab-chart-svg" });
        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", { x: margin.left + plotWidth / 2, y: 24, "text-anchor": "middle", class: "chart-title" });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        // Y Grid & Axis
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const val = yMin + (ySpan * i) / yTicks;
            const y = getY(val);
            svg.appendChild(createSvgElement("line", { x1: margin.left, y1: y, x2: margin.left + plotWidth, y2: y, stroke: "#e8eaed" }));
            const lbl = createSvgElement("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-tick-label" });
            lbl.textContent = val.toFixed(2);
            svg.appendChild(lbl);
        }

        // X Grid & Axis
        const xTicks = 6;
        for (let i = 0; i <= xTicks; i++) {
            const val = xMin + (xSpan * i) / xTicks;
            const x = getX(val);
            svg.appendChild(createSvgElement("line", { x1: x, y1: margin.top, x2: x, y2: margin.top + plotHeight, stroke: "#e8eaed" }));
            const lbl = createSvgElement("text", { x: x, y: margin.top + plotHeight + 18, "text-anchor": "middle", class: "axis-tick-label" });
            lbl.textContent = val.toFixed(2);
            svg.appendChild(lbl);
        }

        // Axis Titles
        const xTitle = createSvgElement("text", { x: margin.left + plotWidth / 2, y: height - 12, "text-anchor": "middle", class: "axis-title" });
        xTitle.textContent = xLabel;
        svg.appendChild(xTitle);

        const yTitle = createSvgElement("text", { x: 18, y: margin.top + plotHeight / 2, "text-anchor": "middle", transform: `rotate(-90 18 ${margin.top + plotHeight / 2})`, class: "axis-title" });
        yTitle.textContent = yLabel;
        svg.appendChild(yTitle);

        // Plot Points
        pairs.forEach(p => {
            svg.appendChild(createSvgElement("circle", {
                cx: getX(p.x),
                cy: getY(p.y),
                r: 4.5,
                fill: "#0078d4",
                stroke: "#ffffff",
                "stroke-width": 1.2
            }));
        });

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 7. Boxplot
    // ------------------------------------------------------------------------
    function renderBoxplot(container, dataRaw, title = "Boxplot", colName = "Variável") {
        container.innerHTML = "";
        const data = Statistics.filterNumeric(dataRaw);
        if (data.length < 3) {
            container.innerHTML = "<div class='chart-empty'>Dados insuficientes para Boxplot (mínimo 3 observações).</div>";
            return;
        }

        const stats = Statistics.describe(data);
        const q1 = stats.q1, q3 = stats.q3, med = stats.median, iqr = stats.iqr, mean = stats.mean;
        const lowerFence = q1 - 1.5 * iqr;
        const upperFence = q3 + 1.5 * iqr;

        const normalVals = data.filter(v => v >= lowerFence && v <= upperFence);
        const outliers = data.filter(v => v < lowerFence || v > upperFence);

        const lowerWhisker = Math.min(...normalVals);
        const upperWhisker = Math.max(...normalVals);

        const width = 580, height = 380;
        const margin = { top: 40, right: 60, bottom: 50, left: 70 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const allMin = Math.min(stats.min, lowerWhisker);
        const allMax = Math.max(stats.max, upperWhisker);
        const span = allMax - allMin || 1;
        const getY = v => margin.top + plotHeight - ((v - allMin) / span) * plotHeight;

        const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "minitab-chart-svg" });
        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", { x: margin.left + plotWidth / 2, y: 24, "text-anchor": "middle", class: "chart-title" });
        titleEl.textContent = `${title}: ${colName}`;
        svg.appendChild(titleEl);

        // Y Axis & Ticks
        const yTicks = 6;
        for (let i = 0; i <= yTicks; i++) {
            const val = allMin + (span * i) / yTicks;
            const y = getY(val);
            svg.appendChild(createSvgElement("line", { x1: margin.left, y1: y, x2: margin.left + plotWidth, y2: y, stroke: "#e8eaed" }));
            const lbl = createSvgElement("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-tick-label" });
            lbl.textContent = val.toFixed(2);
            svg.appendChild(lbl);
        }

        const boxCenterX = margin.left + plotWidth / 2;
        const boxWidth = 90;
        const boxLeft = boxCenterX - boxWidth / 2;

        // Whiskers vertical line
        svg.appendChild(createSvgElement("line", {
            x1: boxCenterX, y1: getY(upperWhisker),
            x2: boxCenterX, y2: getY(q3),
            stroke: "#222222", "stroke-width": 1.5, "stroke-dasharray": "3,3"
        }));
        svg.appendChild(createSvgElement("line", {
            x1: boxCenterX, y1: getY(lowerWhisker),
            x2: boxCenterX, y2: getY(q1),
            stroke: "#222222", "stroke-width": 1.5, "stroke-dasharray": "3,3"
        }));

        // Whisker Caps
        const capWidth = 36;
        svg.appendChild(createSvgElement("line", { x1: boxCenterX - capWidth / 2, y1: getY(upperWhisker), x2: boxCenterX + capWidth / 2, y2: getY(upperWhisker), stroke: "#222222", "stroke-width": 1.5 }));
        svg.appendChild(createSvgElement("line", { x1: boxCenterX - capWidth / 2, y1: getY(lowerWhisker), x2: boxCenterX + capWidth / 2, y2: getY(lowerWhisker), stroke: "#222222", "stroke-width": 1.5 }));

        // IQR Box
        const boxY = getY(q3);
        const boxH = Math.max(2, getY(q1) - boxY);
        svg.appendChild(createSvgElement("rect", {
            x: boxLeft, y: boxY, width: boxWidth, height: boxH,
            fill: "#d4e9fc", stroke: "#0078d4", "stroke-width": 2
        }));

        // Median Line
        const medY = getY(med);
        svg.appendChild(createSvgElement("line", {
            x1: boxLeft, y1: medY, x2: boxLeft + boxWidth, y2: medY,
            stroke: "#d9381e", "stroke-width": 2.5
        }));

        // Outliers
        outliers.forEach(outVal => {
            const outY = getY(outVal);
            svg.appendChild(createSvgElement("circle", {
                cx: boxCenterX, cy: outY, r: 4.5,
                fill: "#d9381e", stroke: "#ffffff", "stroke-width": 1
            }));
        });

        // X Label
        const xLbl = createSvgElement("text", { x: boxCenterX, y: height - 15, "text-anchor": "middle", class: "axis-title" });
        xLbl.textContent = `${colName} (N = ${data.length})`;
        svg.appendChild(xLbl);

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 8. Bar Chart (Gráfico de Barras)
    // ------------------------------------------------------------------------
    function renderBarChart(container, categories, counts, title = "Gráfico de Barras") {
        container.innerHTML = "";
        if (!categories || categories.length === 0) {
            container.innerHTML = "<div class='chart-empty'>Sem categorias para Gráfico de Barras.</div>";
            return;
        }

        const width = 640, height = 380;
        const margin = { top: 40, right: 40, bottom: 65, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const maxCount = Math.max(...counts, 1);
        const numBars = categories.length;
        const barWidth = Math.min(65, (plotWidth / numBars) * 0.7);
        const slotWidth = plotWidth / numBars;

        const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "minitab-chart-svg" });
        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", { x: margin.left + plotWidth / 2, y: 24, "text-anchor": "middle", class: "chart-title" });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        // Y Grid
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const val = (maxCount * i) / yTicks;
            const y = margin.top + plotHeight - (plotHeight * i) / yTicks;
            svg.appendChild(createSvgElement("line", { x1: margin.left, y1: y, x2: margin.left + plotWidth, y2: y, stroke: "#e8eaed" }));
            const lbl = createSvgElement("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-tick-label" });
            lbl.textContent = Math.round(val);
            svg.appendChild(lbl);
        }

        // Draw Bars
        categories.forEach((cat, idx) => {
            const count = counts[idx] || 0;
            const barH = (count / maxCount) * plotHeight;
            const x = margin.left + idx * slotWidth + (slotWidth - barWidth) / 2;
            const y = margin.top + plotHeight - barH;

            svg.appendChild(createSvgElement("rect", {
                x, y, width: barWidth, height: barH,
                fill: "#0078d4", stroke: "#005a9e", "stroke-width": 1
            }));

            // Value label above bar
            const vLbl = createSvgElement("text", { x: x + barWidth / 2, y: y - 5, "text-anchor": "middle", class: "axis-tick-label", "font-weight": "bold" });
            vLbl.textContent = count;
            svg.appendChild(vLbl);

            // Category Label below
            const cLbl = createSvgElement("text", { x: x + barWidth / 2, y: margin.top + plotHeight + 18, "text-anchor": "middle", class: "axis-tick-label" });
            cLbl.textContent = cat;
            svg.appendChild(cLbl);
        });

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 9. Time Series Plot (Gráfico de Séries Temporais)
    // ------------------------------------------------------------------------
    function renderTimeSeries(container, dataRaw, title = "Gráfico de Séries Temporais", label = "Série") {
        container.innerHTML = "";
        const data = Statistics.filterNumeric(dataRaw);
        if (data.length < 2) {
            container.innerHTML = "<div class='chart-empty'>Dados insuficientes para Séries Temporais.</div>";
            return;
        }

        const width = 640, height = 380;
        const margin = { top: 40, right: 40, bottom: 50, left: 60 };
        const plotWidth = width - margin.left - margin.right;
        const plotHeight = height - margin.top - margin.bottom;

        const yMin = Math.min(...data);
        const yMax = Math.max(...data);
        const ySpan = yMax - yMin || 1;

        const getX = idx => margin.left + (idx / (data.length - 1)) * plotWidth;
        const getY = v => margin.top + plotHeight - ((v - yMin) / ySpan) * plotHeight;

        const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "minitab-chart-svg" });
        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", { x: margin.left + plotWidth / 2, y: 24, "text-anchor": "middle", class: "chart-title" });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        // Y Grid
        const yTicks = 5;
        for (let i = 0; i <= yTicks; i++) {
            const val = yMin + (ySpan * i) / yTicks;
            const y = getY(val);
            svg.appendChild(createSvgElement("line", { x1: margin.left, y1: y, x2: margin.left + plotWidth, y2: y, stroke: "#e8eaed" }));
            const lbl = createSvgElement("text", { x: margin.left - 8, y: y + 4, "text-anchor": "end", class: "axis-tick-label" });
            lbl.textContent = val.toFixed(2);
            svg.appendChild(lbl);
        }

        // Connecting Line
        let pathD = `M ${getX(0)} ${getY(data[0])}`;
        for (let i = 1; i < data.length; i++) {
            pathD += ` L ${getX(i)} ${getY(data[i])}`;
        }
        svg.appendChild(createSvgElement("path", {
            d: pathD,
            fill: "none",
            stroke: "#0078d4",
            "stroke-width": 2
        }));

        // Dots
        data.forEach((val, i) => {
            svg.appendChild(createSvgElement("circle", {
                cx: getX(i),
                cy: getY(val),
                r: 3.5,
                fill: "#0078d4",
                stroke: "#ffffff",
                "stroke-width": 1
            }));
        });

        // X Axis Label
        const xTitle = createSvgElement("text", { x: margin.left + plotWidth / 2, y: height - 12, "text-anchor": "middle", class: "axis-title" });
        xTitle.textContent = "Índice / Tempo";
        svg.appendChild(xTitle);

        container.appendChild(svg);
    }

    // ------------------------------------------------------------------------
    // 10. Pie Chart (Gráfico de Setores)
    // ------------------------------------------------------------------------
    function renderPieChart(container, categories, counts, title = "Gráfico de Setores") {
        container.innerHTML = "";
        const total = counts.reduce((a, b) => a + b, 0);
        if (total <= 0) {
            container.innerHTML = "<div class='chart-empty'>Sem dados para Gráfico de Setores.</div>";
            return;
        }

        const width = 600, height = 380;
        const centerX = 210, centerY = 200, radius = 130;
        const colors = ["#0078d4", "#2b88d8", "#00bcf2", "#004b87", "#002050", "#5c2d91", "#008272", "#107c41"];

        const svg = createSvgElement("svg", { viewBox: `0 0 ${width} ${height}`, class: "minitab-chart-svg" });
        svg.appendChild(createSvgElement("rect", { width, height, fill: "#ffffff" }));

        // Title
        const titleEl = createSvgElement("text", { x: width / 2, y: 28, "text-anchor": "middle", class: "chart-title" });
        titleEl.textContent = title;
        svg.appendChild(titleEl);

        let currentAngle = -Math.PI / 2;
        categories.forEach((cat, idx) => {
            const count = counts[idx] || 0;
            const sliceAngle = (count / total) * 2 * Math.PI;
            const endAngle = currentAngle + sliceAngle;

            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);

            const largeArc = sliceAngle > Math.PI ? 1 : 0;
            const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            svg.appendChild(createSvgElement("path", {
                d: pathData,
                fill: colors[idx % colors.length],
                stroke: "#ffffff",
                "stroke-width": 1.5
            }));

            // Legend item
            const legY = 70 + idx * 24;
            svg.appendChild(createSvgElement("rect", { x: 390, y: legY, width: 14, height: 14, fill: colors[idx % colors.length] }));
            const legTxt = createSvgElement("text", { x: 412, y: legY + 11, class: "axis-tick-label" });
            const pct = ((count / total) * 100).toFixed(1);
            legTxt.textContent = `${cat}: ${count} (${pct}%)`;
            svg.appendChild(legTxt);

            currentAngle = endAngle;
        });

        container.appendChild(svg);
    }

    return {
        renderHistogram,
        renderXbarRChart,
        renderProcessCapability,
        renderPareto,
        renderFittedLinePlot,
        renderScatterPlot,
        renderBoxplot,
        renderBarChart,
        renderTimeSeries,
        renderPieChart
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Charts;
}
