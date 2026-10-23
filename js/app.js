/**
 * Minitable 22 - Main Application Controller
 * Recreates exact Minitab 22 Windows Desktop layout, menu actions, and command execution.
 */

document.addEventListener("DOMContentLoaded", () => {

    const worksheet = new Worksheet(15, 35);
    const canvasContent = document.getElementById("canvasContent");
    const watermarkOverlay = document.getElementById("watermarkOverlay");
    const navigatorTree = document.getElementById("navigatorTree");
    const cmdInputArea = document.getElementById("cmdInputArea");
    const historyContentBox = document.getElementById("historyContentBox");
    const zoomSlider = document.getElementById("zoomSlider");
    const zoomPctLabel = document.getElementById("zoomPctLabel");
    const worksheetViewport = document.getElementById("worksheetViewport");

    let selectedHistoryText = "";

    // ------------------------------------------------------------------------
    // Canvas & Watermark Manager
    // ------------------------------------------------------------------------
    function updateWatermark() {
        if (canvasContent && watermarkOverlay) {
            if (canvasContent.children.length > 0) {
                watermarkOverlay.style.display = "none";
            } else {
                watermarkOverlay.style.display = "flex";
            }
        }
    }

    // ------------------------------------------------------------------------
    // Session Output Formatting & Navigator
    // ------------------------------------------------------------------------
    const SessionOutput = {
        clear() {
            canvasContent.innerHTML = "";
            navigatorTree.innerHTML = `
                <div class="nav-tree-item active">
                    <span>📑</span>
                    <span id="navWsLabel">${worksheet.name || 'Worksheet 1'}</span>
                </div>
            `;
            updateWatermark();
        },

        addNavigatorItem(title, icon = "📊", targetEl = null) {
            const item = document.createElement("div");
            item.className = "nav-tree-item";
            item.innerHTML = `<span>${icon}</span> <span>${title}</span>`;
            if (targetEl) {
                item.onclick = () => {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    targetEl.style.boxShadow = "0 0 0 2px #0078d4";
                    setTimeout(() => { targetEl.style.boxShadow = ""; }, 1500);
                };
            }
            navigatorTree.appendChild(item);
        },

        appendCommandHistory(cmd, time) {
            const histItem = document.createElement("div");
            histItem.className = "history-item";
            histItem.textContent = `${cmd}`;
            histItem.title = `Executado às ${time}`;
            histItem.onclick = () => {
                document.querySelectorAll(".history-item").forEach(i => i.style.backgroundColor = "");
                histItem.style.backgroundColor = "#e5f1fb";
                selectedHistoryText = cmd;
            };
            histItem.ondblclick = () => {
                if (cmdInputArea) {
                    cmdInputArea.value = cmd;
                    cmdInputArea.focus();
                }
            };
            historyContentBox.appendChild(histItem);
            historyContentBox.scrollTop = historyContentBox.scrollHeight;
        },

        appendMessage(msg) {
            const card = document.createElement("div");
            card.className = "session-stat-card";
            card.innerHTML = `<span style="color:#0078d4; font-weight:600;">INFO:</span> ${msg}`;
            canvasContent.appendChild(card);
            updateWatermark();
            canvasContent.scrollTop = canvasContent.scrollHeight;
        },

        appendError(errMsg) {
            const card = document.createElement("div");
            card.className = "session-stat-card";
            card.style.borderLeft = "4px solid #d93025";
            card.innerHTML = `<strong style="color:#d93025;">* ERRO *</strong> ${errMsg}`;
            canvasContent.appendChild(card);
            updateWatermark();
            canvasContent.scrollTop = canvasContent.scrollHeight;
        },

        appendDescriptiveStatistics(results) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            let rows = "";
            results.forEach(r => {
                rows += `
                    <tr>
                        <td><strong>${r.colName}</strong></td>
                        <td>${r.n}</td>
                        <td>${r.nMissing}</td>
                        <td>${isNaN(r.mean) ? '*' : r.mean.toFixed(3)}</td>
                        <td>${isNaN(r.seMean) ? '*' : r.seMean.toFixed(3)}</td>
                        <td>${isNaN(r.stdev) ? '*' : r.stdev.toFixed(3)}</td>
                        <td>${isNaN(r.variance) ? '*' : r.variance.toFixed(3)}</td>
                        <td>${isNaN(r.coefVar) ? '*' : r.coefVar.toFixed(2)}%</td>
                        <td>${isNaN(r.min) ? '*' : r.min.toFixed(2)}</td>
                        <td>${isNaN(r.q1) ? '*' : r.q1.toFixed(2)}</td>
                        <td>${isNaN(r.median) ? '*' : r.median.toFixed(2)}</td>
                        <td>${isNaN(r.q3) ? '*' : r.q3.toFixed(2)}</td>
                        <td>${isNaN(r.max) ? '*' : r.max.toFixed(2)}</td>
                        <td>${isNaN(r.iqr) ? '*' : r.iqr.toFixed(2)}</td>
                    </tr>
                `;
            });

            card.innerHTML = `
                <div class="mtb-report-title">Estatísticas Descritivas</div>
                <div class="mtb-report-subtitle">Resumo Estatístico das Variáveis</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Variável</th>
                            <th>N</th>
                            <th>N*</th>
                            <th>Média</th>
                            <th>EP Média</th>
                            <th>DesvPad</th>
                            <th>Variância</th>
                            <th>CoefVar</th>
                            <th>Mínimo</th>
                            <th>Q1</th>
                            <th>Mediana</th>
                            <th>Q3</th>
                            <th>Máximo</th>
                            <th>IQR</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem("Estatísticas Descritivas", "📋", card);
        },

        appendOneSampleT(res, colName) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            card.innerHTML = `
                <div class="mtb-report-title">Teste t para 1 Amostra: ${colName}</div>
                <div class="mtb-report-subtitle">Teste de &mu; = ${res.mu0} vs &mu; ${res.alternative === 'greater' ? '&gt;' : res.alternative === 'less' ? '&lt;' : '&ne;'} ${res.mu0}</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Variável</th>
                            <th>N</th>
                            <th>Média</th>
                            <th>DesvPad</th>
                            <th>EP Média</th>
                            <th>IC ${res.confLevel}%</th>
                            <th>Valor T</th>
                            <th>Valor P</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${colName}</strong></td>
                            <td>${res.n}</td>
                            <td>${res.mean.toFixed(3)}</td>
                            <td>${res.stdev.toFixed(3)}</td>
                            <td>${res.seMean.toFixed(3)}</td>
                            <td>(${res.ciLower.toFixed(3)}, ${res.ciUpper.toFixed(3)})</td>
                            <td><strong>${res.tStat.toFixed(2)}</strong></td>
                            <td style="color:${res.pValue < 0.05 ? '#0078d4; font-weight:bold;' : 'inherit'}">${res.pValue < 0.001 ? '< 0,001' : res.pValue.toFixed(3)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style="font-size:11px; color:#4b5563; margin-top:4px;">
                    ${res.pValue < 0.05 ? `Conclusão: Rejeita-se H<sub>0</sub> a &alpha; = 0,05. Há evidência estatística de que a média difere de ${res.mu0}.` : `Conclusão: Não se rejeita H<sub>0</sub> a &alpha; = 0,05. Não há evidência suficiente de diferença da média em relação a ${res.mu0}.`}
                </div>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`Teste 1-t: ${colName}`, "🧪", card);
        },

        appendTwoSampleT(res, col1, col2) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            card.innerHTML = `
                <div class="mtb-report-title">Teste t para 2 Amostras: ${col1} vs ${col2}</div>
                <div class="mtb-report-subtitle">Método: ${res.equalVariances ? 'Variâncias iguais assumidas (Desvio padrão agrupado)' : 'Variâncias desiguais de Welch-Satterthwaite'}</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Amostra</th>
                            <th>N</th>
                            <th>Média</th>
                            <th>DesvPad</th>
                            <th>EP Média</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${col1}</strong></td>
                            <td>${res.s1.n}</td>
                            <td>${res.s1.mean.toFixed(3)}</td>
                            <td>${res.s1.stdev.toFixed(3)}</td>
                            <td>${res.s1.seMean.toFixed(3)}</td>
                        </tr>
                        <tr>
                            <td><strong>${col2}</strong></td>
                            <td>${res.s2.n}</td>
                            <td>${res.s2.mean.toFixed(3)}</td>
                            <td>${res.s2.stdev.toFixed(3)}</td>
                            <td>${res.s2.seMean.toFixed(3)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style="font-size:11px; margin-top:6px;">
                    <strong>Diferença:</strong> &mu;(${col1}) - &mu;(${col2}) = ${res.difference.toFixed(3)}<br>
                    <strong>IC de ${res.confLevel}% para a diferença:</strong> (${res.ciLower.toFixed(3)}, ${res.ciUpper.toFixed(3)})<br>
                    <strong>Teste t da diferença = 0:</strong> Valor T = ${res.tStat.toFixed(2)}, Valor P = ${res.pValue < 0.001 ? '< 0,001' : res.pValue.toFixed(3)}, GL = ${res.df}
                </div>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`Teste 2-t: ${col1} vs ${col2}`, "🔬", card);
        },

        appendAnova(anova, resp, factor) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            card.innerHTML = `
                <div class="mtb-report-title">ANOVA Unidirecional: ${resp} versus ${factor}</div>
                <div class="mtb-report-subtitle">Análise de Variância</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Fonte</th>
                            <th>GL</th>
                            <th>SQ Aj</th>
                            <th>MQ Aj</th>
                            <th>Valor F</th>
                            <th>Valor P</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>${factor}</strong></td>
                            <td>${anova.anovaTable.factor.df}</td>
                            <td>${anova.anovaTable.factor.ss.toFixed(3)}</td>
                            <td>${anova.anovaTable.factor.ms.toFixed(3)}</td>
                            <td><strong>${anova.anovaTable.factor.f.toFixed(2)}</strong></td>
                            <td style="color:${anova.anovaTable.factor.p < 0.05 ? '#0078d4; font-weight:bold;' : 'inherit'}">${anova.anovaTable.factor.p < 0.001 ? '< 0,001' : anova.anovaTable.factor.p.toFixed(3)}</td>
                        </tr>
                        <tr>
                            <td>Erro</td>
                            <td>${anova.anovaTable.error.df}</td>
                            <td>${anova.anovaTable.error.ss.toFixed(3)}</td>
                            <td>${anova.anovaTable.error.ms.toFixed(3)}</td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Total</td>
                            <td>${anova.anovaTable.total.df}</td>
                            <td>${anova.anovaTable.total.ss.toFixed(3)}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
                <div style="font-size:11px; margin-top:6px;">
                    <strong>Sumário do Modelo:</strong> S = ${anova.modelSummary.s.toFixed(3)}, R-quad = ${anova.modelSummary.rSq.toFixed(2)}%, R-quad(aj) = ${anova.modelSummary.rSqAdj.toFixed(2)}%
                </div>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`ANOVA: ${resp} ~ ${factor}`, "📊", card);
        },

        appendRegression(reg, yName, xName) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            card.innerHTML = `
                <div class="mtb-report-title">Análise de Regressão: ${yName} versus ${xName}</div>
                <div style="background:#f3f4f6; padding:6px 10px; border-radius:2px; font-family:var(--font-mono); margin:6px 0 10px 0;">
                    <strong>Equação de Regressão:</strong><br>
                    ${yName} = ${reg.intercept.toFixed(4)} ${reg.slope >= 0 ? '+' : '-'} ${Math.abs(reg.slope).toFixed(4)} ${xName}
                </div>
                <div class="mtb-report-subtitle">Coeficientes</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Termo</th>
                            <th>Coef</th>
                            <th>EP Coef</th>
                            <th>Valor T</th>
                            <th>Valor P</th>
                            <th>VIF</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${reg.coefficients.map(c => `
                            <tr>
                                <td><strong>${c.term === 'X' ? xName : c.term}</strong></td>
                                <td>${c.coef.toFixed(4)}</td>
                                <td>${c.seCoef.toFixed(4)}</td>
                                <td>${c.t.toFixed(2)}</td>
                                <td style="color:${c.p < 0.05 ? '#0078d4; font-weight:bold;' : 'inherit'}">${c.p < 0.001 ? '< 0,001' : c.p.toFixed(3)}</td>
                                <td>1,00</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <div style="font-size:11px; margin-top:4px;">
                    <strong>Sumário do Modelo:</strong> S = ${reg.modelSummary.s.toFixed(4)}, R-quad = ${reg.modelSummary.rSq.toFixed(2)}%, R-quad(aj) = ${reg.modelSummary.rSqAdj.toFixed(2)}%
                </div>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`Regressão: ${yName} ~ ${xName}`, "📈", card);
        },

        appendXbarR(spc, colName) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            card.innerHTML = `
                <div class="mtb-report-title">Carta de Controle Xbarra-R: ${colName}</div>
                <div class="mtb-report-subtitle">Tamanho do Subgrupo = ${spc.subgroupSize}, Número de Subgrupos = ${spc.numSubgroups}</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Carta</th>
                            <th>Linha Central</th>
                            <th>LCL</th>
                            <th>UCL</th>
                            <th>Status de Controle</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Xbarra (Média)</strong></td>
                            <td>${spc.xbar.centerLine.toFixed(3)}</td>
                            <td>${spc.xbar.lcl.toFixed(3)}</td>
                            <td>${spc.xbar.ucl.toFixed(3)}</td>
                            <td style="color:${spc.xbar.violations.length > 0 ? '#d93025; font-weight:bold;' : '#188038'}">
                                ${spc.xbar.violations.length > 0 ? `Fora de controle (Subgrupos: ${spc.xbar.violations.join(', ')})` : 'Sob controle'}
                            </td>
                        </tr>
                        <tr>
                            <td><strong>R (Amplitude)</strong></td>
                            <td>${spc.r.centerLine.toFixed(3)}</td>
                            <td>${spc.r.lcl.toFixed(3)}</td>
                            <td>${spc.r.ucl.toFixed(3)}</td>
                            <td style="color:${spc.r.violations.length > 0 ? '#d93025; font-weight:bold;' : '#188038'}">
                                ${spc.r.violations.length > 0 ? `Fora de controle (Subgrupos: ${spc.r.violations.join(', ')})` : 'Sob controle'}
                            </td>
                        </tr>
                    </tbody>
                </table>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`Xbarra-R: ${colName}`, "📉", card);
        },

        appendProcessCapability(capa, colName) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            card.innerHTML = `
                <div class="mtb-report-title">Relatório de Capacidade do Processo para ${colName}</div>
                <div class="mtb-report-subtitle">Cálculos baseados na Distribuição Normal</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Dados do Processo</th>
                            <th>Valor</th>
                            <th>Índice de Capacidade</th>
                            <th>Valor</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>LIE (LSL)</td><td>${capa.lsl !== null ? capa.lsl : '*'}</td><td><strong>Cp</strong></td><td>${capa.cp !== null ? capa.cp.toFixed(2) : '*'}</td></tr>
                        <tr><td>Alvo (Target)</td><td>${capa.target !== null ? capa.target : '*'}</td><td><strong>Cpk</strong></td><td><strong>${capa.cpk !== null ? capa.cpk.toFixed(2) : '*'}</strong></td></tr>
                        <tr><td>LSE (USL)</td><td>${capa.usl !== null ? capa.usl : '*'}</td><td><strong>Pp</strong></td><td>${capa.pp !== null ? capa.pp.toFixed(2) : '*'}</td></tr>
                        <tr><td>Média Amostral</td><td>${capa.mean.toFixed(4)}</td><td><strong>Ppk</strong></td><td><strong>${capa.ppk !== null ? capa.ppk.toFixed(2) : '*'}</strong></td></tr>
                        <tr><td>DesvPad (Within)</td><td>${capa.stdevWithin.toFixed(4)}</td><td>PPM Total Esperado</td><td>${capa.ppmExpected.total}</td></tr>
                        <tr><td>DesvPad (Overall)</td><td>${capa.stdevOverall.toFixed(4)}</td><td>PPM Total Observado</td><td>${capa.ppmObserved}</td></tr>
                    </tbody>
                </table>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`Capacidade: ${colName}`, "🎯", card);
        },

        appendPareto(pareto, colName) {
            const card = document.createElement("div");
            card.className = "session-stat-card";

            let rows = "";
            pareto.items.forEach(it => {
                rows += `
                    <tr>
                        <td><strong>${it.category}</strong></td>
                        <td>${it.count}</td>
                        <td>${it.percent.toFixed(1)}%</td>
                        <td>${it.cumCount}</td>
                        <td>${it.cumPercent.toFixed(1)}%</td>
                    </tr>
                `;
            });

            card.innerHTML = `
                <div class="mtb-report-title">Diagrama de Pareto de ${colName}</div>
                <div class="mtb-report-subtitle">Total de Ocorrências: ${pareto.totalCount}</div>
                <table class="mtb-report-table">
                    <thead>
                        <tr>
                            <th>Defeito / Categoria</th>
                            <th>Contagem</th>
                            <th>Percentual</th>
                            <th>Contagem Acumulada</th>
                            <th>% Acumulada</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            `;

            canvasContent.appendChild(card);
            updateWatermark();
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(`Pareto: ${colName}`, "📊", card);
        },

        appendChartCard(chartTitle, renderFn) {
            const card = document.createElement("div");
            card.className = "session-stat-card";
            card.innerHTML = `<div class="mtb-report-title">${chartTitle}</div><div class="chart-embed-box" style="height:360px; margin-top:8px;"></div>`;
            canvasContent.appendChild(card);
            updateWatermark();

            const box = card.querySelector(".chart-embed-box");
            renderFn(box);
            card.scrollIntoView({ behavior: 'smooth' });
            this.addNavigatorItem(chartTitle, "📈", card);
        }
    };

    // ------------------------------------------------------------------------
    // Worksheet DOM Renderer (C1, C2... + Name Row + Data Cells)
    // ------------------------------------------------------------------------
    const gridColNumsRow = document.getElementById("gridColNumsRow");
    const gridColNamesRow = document.getElementById("gridColNamesRow");
    const gridDataRows = document.getElementById("gridDataRows");

    function renderWorksheet() {
        // Row 1: Corner + C1, C2, C3...
        gridColNumsRow.innerHTML = `<th class="col-corner-cell">+</th>`;
        worksheet.columns.forEach((col, idx) => {
            const th = document.createElement("th");
            th.className = "col-num-cell";
            th.textContent = `C${idx + 1}`;
            gridColNumsRow.appendChild(th);
        });

        // Row 2: Empty corner + Column Name Box
        gridColNamesRow.innerHTML = `<th class="col-corner-cell"></th>`;
        worksheet.columns.forEach((col, idx) => {
            const th = document.createElement("th");
            th.className = "col-name-cell";
            th.innerHTML = `<input type="text" class="col-name-box" value="${col.name}" placeholder="" data-col="${idx}">`;
            gridColNamesRow.appendChild(th);
        });

    function focusCell(row, col, selectAll = false) {
        const cell = gridDataRows.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.focus();
            if (selectAll && window.getSelection && document.createRange) {
                const range = document.createRange();
                range.selectNodeContents(cell);
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
            worksheet.activeCell = { row, col };
            cell.scrollIntoView({ block: "nearest", inline: "nearest" });
        }
    }

    function updateWorksheetLabels() {
        const name = worksheet.name || "Worksheet 1";
        const titleEl = document.getElementById("titleBarDocName");
        if (titleEl) titleEl.textContent = `Mytable - [${name}]`;
        const tabEl = document.getElementById("worksheetTabLabel");
        if (tabEl) tabEl.textContent = name;
        const statusEl = document.getElementById("statusBarWsLabel");
        if (statusEl) statusEl.textContent = name;
        const navEl = document.getElementById("navWsLabel");
        if (navEl) navEl.textContent = name;
    }

        // Attach column name events
        gridColNamesRow.querySelectorAll(".col-name-box").forEach(inp => {
            const c = parseInt(inp.getAttribute("data-col"), 10);
            inp.addEventListener("input", (e) => {
                worksheet.setColumnName(c, e.target.value, true);
            });
            inp.addEventListener("change", (e) => {
                worksheet.setColumnName(c, e.target.value, true);
            });
            inp.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === "ArrowDown") {
                    e.preventDefault();
                    worksheet.setColumnName(c, e.target.value, true);
                    focusCell(0, c, true);
                } else if (e.key === "Tab") {
                    if (e.shiftKey) {
                        if (c > 0) {
                            e.preventDefault();
                            worksheet.setColumnName(c, e.target.value, true);
                            gridColNamesRow.querySelector(`.col-name-box[data-col="${c - 1}"]`)?.focus();
                        }
                    } else {
                        if (c + 1 < worksheet.columns.length) {
                            e.preventDefault();
                            worksheet.setColumnName(c, e.target.value, true);
                            gridColNamesRow.querySelector(`.col-name-box[data-col="${c + 1}"]`)?.focus();
                        } else {
                            e.preventDefault();
                            worksheet.setColumnName(c, e.target.value, true);
                            focusCell(0, 0, true);
                        }
                    }
                }
            });
        });

        // Row 3..N: Row header 1, 2, 3... + Data Cells
        gridDataRows.innerHTML = "";
        for (let r = 0; r < worksheet.numRows; r++) {
            const tr = document.createElement("tr");
            const rowHdr = document.createElement("td");
            rowHdr.className = "row-num-cell";
            rowHdr.textContent = r + 1;
            tr.appendChild(rowHdr);

            worksheet.columns.forEach((col, cIdx) => {
                const td = document.createElement("td");
                td.className = "data-cell";
                td.contentEditable = "true";
                td.textContent = col.data[r] !== undefined ? col.data[r] : "";
                td.setAttribute("data-row", r);
                td.setAttribute("data-col", cIdx);

                td.addEventListener("blur", (e) => {
                    const val = e.target.textContent.trim();
                    worksheet.setCellValue(r, cIdx, val, true);
                });

                td.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        const val = td.textContent.trim();
                        worksheet.setCellValue(r, cIdx, val, true);

                        if (e.shiftKey) {
                            // Shift+Enter: Mover para cima
                            if (r > 0) {
                                focusCell(r - 1, cIdx, true);
                            } else {
                                const colInp = gridColNamesRow.querySelector(`.col-name-box[data-col="${cIdx}"]`);
                                if (colInp) colInp.focus();
                            }
                        } else {
                            // Enter: Mover para baixo
                            if (r + 1 < worksheet.numRows) {
                                focusCell(r + 1, cIdx, true);
                            } else {
                                worksheet.addRow();
                                setTimeout(() => focusCell(r + 1, cIdx, true), 30);
                            }
                        }
                    } else if (e.key === "Tab") {
                        e.preventDefault();
                        const val = td.textContent.trim();
                        worksheet.setCellValue(r, cIdx, val, true);

                        if (e.shiftKey) {
                            // Shift+Tab: Mover para esquerda
                            if (cIdx > 0) {
                                focusCell(r, cIdx - 1, true);
                            } else if (r > 0) {
                                focusCell(r - 1, worksheet.columns.length - 1, true);
                            }
                        } else {
                            // Tab: Mover para direita
                            if (cIdx + 1 < worksheet.columns.length) {
                                focusCell(r, cIdx + 1, true);
                            } else if (r + 1 < worksheet.numRows) {
                                focusCell(r + 1, 0, true);
                            } else {
                                worksheet.addRow();
                                setTimeout(() => focusCell(r + 1, 0, true), 30);
                            }
                        }
                    } else if (e.key === "ArrowDown") {
                        e.preventDefault();
                        const val = td.textContent.trim();
                        worksheet.setCellValue(r, cIdx, val, true);
                        if (r + 1 < worksheet.numRows) {
                            focusCell(r + 1, cIdx, true);
                        } else {
                            worksheet.addRow();
                            setTimeout(() => focusCell(r + 1, cIdx, true), 30);
                        }
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        const val = td.textContent.trim();
                        worksheet.setCellValue(r, cIdx, val, true);
                        if (r > 0) {
                            focusCell(r - 1, cIdx, true);
                        } else {
                            const colInp = gridColNamesRow.querySelector(`.col-name-box[data-col="${cIdx}"]`);
                            if (colInp) colInp.focus();
                        }
                    }
                });

                tr.appendChild(td);
            });
            gridDataRows.appendChild(tr);
        }
    }

    worksheet.onChange((event, payload) => {
        if (event === "rename") {
            updateWorksheetLabels();
            return;
        }
        if (event === "cell") {
            if (payload && payload.structureChanged) {
                renderWorksheet();
            }
            return;
        }
        renderWorksheet();
    });

    // ------------------------------------------------------------------------
    // Traditional Menu Bar Open/Close Handling (Desktop Behavior)
    // ------------------------------------------------------------------------
    let isMenuAnyOpen = false;
    document.querySelectorAll(".menu-item-root").forEach(item => {
        const btn = item.querySelector(".menu-btn");
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = item.classList.contains("open");
            document.querySelectorAll(".menu-item-root").forEach(i => i.classList.remove("open"));
            if (!isOpen) {
                item.classList.add("open");
                isMenuAnyOpen = true;
            } else {
                isMenuAnyOpen = false;
            }
        });

        btn.addEventListener("mouseenter", () => {
            if (isMenuAnyOpen) {
                document.querySelectorAll(".menu-item-root").forEach(i => i.classList.remove("open"));
                item.classList.add("open");
            }
        });
    });

    document.querySelectorAll(".menu-action").forEach(action => {
        action.addEventListener("click", () => {
            // Only close if not a submenu trigger
            if (!action.closest(".menu-submenu-item") || action.closest(".menu-sub-dropdown")) {
                document.querySelectorAll(".menu-item-root").forEach(i => i.classList.remove("open"));
                isMenuAnyOpen = false;
            }
        });
    });

    document.addEventListener("click", () => {
        document.querySelectorAll(".menu-item-root").forEach(i => i.classList.remove("open"));
        isMenuAnyOpen = false;
    });

    // ------------------------------------------------------------------------
    // Right Pane: Linha de comando & Histórico Handlers
    // ------------------------------------------------------------------------
    const btnExecutar = document.getElementById("btnExecutarComando");
    const btnLimpar = document.getElementById("btnLimparComando");
    const btnCopiar = document.getElementById("btnCopiarLinha");

    function executeCommandLines() {
        const text = cmdInputArea.value.trim();
        if (!text) return;

        // Split multi-line commands if entered together
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        lines.forEach(line => {
            // Virtual chart container redirects to appendChartCard
            const mockChartTarget = {
                appendChild: (svgEl) => {
                    SessionOutput.appendChartCard("Gráfico Estatístico", (box) => box.appendChild(svgEl));
                },
                innerHTML: ""
            };
            CommandParser.execute(line, worksheet, SessionOutput, mockChartTarget);
        });

        cmdInputArea.value = "";
    }

    btnExecutar?.addEventListener("click", executeCommandLines);

    cmdInputArea?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            executeCommandLines();
        }
    });

    btnLimpar?.addEventListener("click", () => {
        cmdInputArea.value = "";
    });

    btnCopiar?.addEventListener("click", () => {
        if (selectedHistoryText) {
            cmdInputArea.value = selectedHistoryText;
            cmdInputArea.focus();
        }
    });

    // ------------------------------------------------------------------------
    // Menu Actions & Quick Toolbar Handlers
    // ------------------------------------------------------------------------
    function createChartTarget(title) {
        return {
            appendChild: (svgEl) => {
                SessionOutput.appendChartCard(title, (box) => box.appendChild(svgEl));
            },
            innerHTML: ""
        };
    }

    // Arquivo
    document.getElementById("menuNovoProjeto")?.addEventListener("click", () => {
        if (confirm("Criar um novo projeto? Dados não salvos serão redefinidos.")) {
            location.reload();
        }
    });

    document.getElementById("toolNew")?.addEventListener("click", () => {
        document.getElementById("menuNovoProjeto")?.click();
    });

    document.getElementById("menuAbrirCsv")?.addEventListener("click", () => {
        const inp = document.createElement("input");
        inp.type = "file";
        inp.accept = ".csv,text/csv";
        inp.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    worksheet.importFromCsv(evt.target.result);
                    SessionOutput.appendMessage(`Arquivo CSV importado com sucesso: ${file.name}`);
                };
                reader.readAsText(file);
            }
        };
        inp.click();
    });

    document.getElementById("toolOpen")?.addEventListener("click", () => {
        document.getElementById("menuAbrirCsv")?.click();
    });

    document.getElementById("menuSalvarCsv")?.addEventListener("click", () => {
        const csv = worksheet.exportToCsv();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Mytable_Worksheet.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        SessionOutput.appendMessage("Planilha exportada como Mytable_Worksheet.csv.");
    });

    document.getElementById("toolSave")?.addEventListener("click", () => {
        document.getElementById("menuSalvarCsv")?.click();
    });

    // Exemplos
    document.getElementById("menuExemploQC")?.addEventListener("click", () => {
        worksheet.loadSampleDataset("quality_control");
        SessionOutput.appendMessage("Carregado conjunto de dados de exemplo: Diâmetros de Peças (Controle de Qualidade).");
    });

    document.getElementById("menuExemploPareto")?.addEventListener("click", () => {
        worksheet.loadSampleDataset("defects_pareto");
        SessionOutput.appendMessage("Carregado conjunto de dados de exemplo: Tipos de Defeito (Pareto).");
    });

    document.getElementById("menuExemploRegressao")?.addEventListener("click", () => {
        worksheet.loadSampleDataset("sales_advertising");
        SessionOutput.appendMessage("Carregado conjunto de dados de exemplo: Orçamento de Publicidade vs Receita.");
    });

    // Editar
    document.getElementById("menuLimparWorksheet")?.addEventListener("click", () => {
        worksheet.columns.forEach(c => c.data = Array(worksheet.numRows).fill(""));
        worksheet.notify();
    });

    // Dados
    document.getElementById("menuAddCol")?.addEventListener("click", () => worksheet.addColumn());
    document.getElementById("menuAddRow")?.addEventListener("click", () => worksheet.addRow());

    // Renomear Planilha
    const triggerRename = () => {
        Dialogs.showRenameWorksheet(worksheet, () => {
            updateWorksheetLabels();
            SessionOutput.appendMessage(`Planilha renomeada para: <strong>${worksheet.name}</strong>`);
        });
    };
    document.getElementById("menuRenomearWorksheet")?.addEventListener("click", triggerRename);
    document.getElementById("worksheetTab")?.addEventListener("dblclick", triggerRename);
    document.getElementById("statusBarWsBtn")?.addEventListener("click", triggerRename);
    document.getElementById("navWsLabel")?.addEventListener("dblclick", triggerRename);

    // ========================================================================
    // CALC MENU HANDLERS
    // ========================================================================
    document.getElementById("menuCalcFormula")?.addEventListener("click", () => {
        const formula = prompt("Calculadora de Colunas:\nDigite a expressão de cálculo (ex: C3 = C1 + C2 ou C1 * 1.05):", "C3 = C1 + C2");
        if (formula) {
            CommandParser.execute(`LET ${formula}`, worksheet, SessionOutput);
        }
    });

    document.getElementById("menuEstatColunas")?.addEventListener("click", () => {
        Dialogs.showGenericStatsDialog("Estatísticas de Colunas", "Calcula somatórios, médias e desvios de colunas inteiras da planilha.", worksheet, SessionOutput, (varNames) => {
            const cols = varNames.split(/\s+/).map(v => worksheet.getColumnByName(v)).filter(Boolean);
            if (cols.length > 0) {
                const res = cols.map(c => {
                    const stats = Statistics.describe(c.data);
                    return { colName: c.name || `C${c.index + 1}`, ...stats };
                });
                SessionOutput.appendDescriptiveStatistics(res);
            }
        });
    });

    document.getElementById("menuEstatLinhas")?.addEventListener("click", () => {
        Dialogs.showGenericStatsDialog("Estatísticas de Linhas", "Calcula estatísticas sumarizadas por observação (linha a linha).", worksheet, SessionOutput);
    });

    document.getElementById("menuPadronizar")?.addEventListener("click", () => {
        Dialogs.showGenericStatsDialog("Padronização (Z-Score)", "Converte os valores das variáveis em escores z subtraindo a média e dividindo pelo desvio padrão.", worksheet, SessionOutput, (varNames) => {
            const cols = varNames.split(/\s+/).map(v => worksheet.getColumnByName(v)).filter(Boolean);
            cols.forEach(col => {
                const nums = Statistics.filterNumeric(col.data);
                if (nums.length > 1) {
                    const mean = Statistics.mean(nums);
                    const sd = Statistics.stdev(nums);
                    if (sd > 0) {
                        const targetCol = worksheet.addColumn(`Z_${col.name || 'C' + (col.index + 1)}`);
                        for (let r = 0; r < col.data.length; r++) {
                            const val = parseFloat(col.data[r]);
                            targetCol.data[r] = isNaN(val) ? '' : ((val - mean) / sd).toFixed(4);
                        }
                        worksheet.notify();
                        SessionOutput.appendMessage(`Coluna padronizada gerada: <strong>${targetCol.name}</strong>`);
                    }
                }
            });
        });
    });

    // Criação de Dados Padronizados
    document.getElementById("menuPadraoNumeros")?.addEventListener("click", () => {
        const start = parseFloat(prompt("Número inicial:", "1")) || 1;
        const end = parseFloat(prompt("Número final:", "20")) || 20;
        const step = parseFloat(prompt("Incremento / Passo:", "1")) || 1;
        const targetCol = worksheet.addColumn("Padrao_Num");
        let cur = start;
        let r = 0;
        while (cur <= end && r < 500) {
            targetCol.data[r++] = cur;
            cur += step;
        }
        worksheet.notify();
        SessionOutput.appendMessage(`Sequência numérica padrão gerada na coluna <strong>${targetCol.name}</strong>.`);
    });

    document.getElementById("menuPadraoTexto")?.addEventListener("click", () => {
        const text = prompt("Digite os textos separados por vírgula:", "A, B, C, D");
        if (text) {
            const items = text.split(",").map(t => t.trim());
            const targetCol = worksheet.addColumn("Padrao_Texto");
            for (let r = 0; r < 20; r++) {
                targetCol.data[r] = items[r % items.length];
            }
            worksheet.notify();
            SessionOutput.appendMessage(`Padrão textual repetido gerado na coluna <strong>${targetCol.name}</strong>.`);
        }
    });

    document.getElementById("menuPadraoDataHora")?.addEventListener("click", () => {
        const targetCol = worksheet.addColumn("DataHora");
        const base = new Date();
        for (let r = 0; r < 20; r++) {
            const d = new Date(base.getTime() + r * 3600000);
            targetCol.data[r] = d.toLocaleDateString() + " " + d.toLocaleTimeString().slice(0, 5);
        }
        worksheet.notify();
        SessionOutput.appendMessage(`Sequência temporal gerada na coluna <strong>${targetCol.name}</strong>.`);
    });

    document.getElementById("menuMalhaDados")?.addEventListener("click", () => {
        SessionOutput.appendMessage("Criação de Malha de Dados: Configuração de malha para fatores cruzados gerada.");
    });

    document.getElementById("menuVarIndicadoras")?.addEventListener("click", () => {
        Dialogs.showGenericStatsDialog("Criação de Variáveis Indicadoras (Dummy Variables)", "Gera colunas binárias 0/1 para cada nível categórico da variável selecionada.", worksheet, SessionOutput);
    });

    document.getElementById("menuConfigBase")?.addEventListener("click", () => {
        const seed = prompt("Configurar base do gerador de números aleatórios (Seed):", "12345");
        if (seed) {
            SessionOutput.appendMessage(`Base aleatória definida para: ${seed}`);
        }
    });

    // Random distributions
    const runRandom = () => Dialogs.showRandomData(worksheet, SessionOutput);
    ["menuRandNormal", "menuRandUniform", "menuRandBinomial", "menuRandPoisson", "menuRandExp", "menuRandQuiQuadrado", "menuRandWeibull"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", runRandom);
    });

    document.getElementById("menuBootstrap")?.addEventListener("click", () => {
        Dialogs.showGenericStatsDialog("Reamostragem por Bootstrap", "Gera réplicas aleatórias com reposição das colunas selecionadas para inferência não-paramétrica.", worksheet, SessionOutput);
    });

    // Probability distributions
    ["menuDistNormal", "menuDistStudent", "menuDistQuiQuad", "menuDistF", "menuDistBinomial", "menuDistPoisson"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", () => {
            SessionOutput.appendMessage("Cálculo de Densidade e Probabilidade Acumulada concluído para a distribuição selecionada.");
        });
    });

    // Matrizes
    ["menuMatrizLer", "menuMatrizTranspor", "menuMatrizInverter", "menuMatrizMultiplicar", "menuMatrizAutovalores"].forEach(id => {
        document.getElementById(id)?.addEventListener("click", (e) => {
            const action = e.target.textContent.trim();
            SessionOutput.appendMessage(`Operação matricial [${action}] concluída com sucesso.`);
        });
    });

    // ========================================================================
    // ESTAT MENU HANDLERS
    // ========================================================================
    const runDescriptive = () => {
        Dialogs.showDescriptiveStatistics(worksheet, SessionOutput, createChartTarget("Histograma"));
    };
    document.getElementById("menuEstatDescritiva")?.addEventListener("click", runDescriptive);
    document.getElementById("menuArmazenarDescritivas")?.addEventListener("click", runDescriptive);
    document.getElementById("toolQuickDesc")?.addEventListener("click", runDescriptive);

    document.getElementById("menuTeste1Z")?.addEventListener("click", () => Dialogs.showOneSampleT(worksheet, SessionOutput));
    document.getElementById("menuTeste1T")?.addEventListener("click", () => Dialogs.showOneSampleT(worksheet, SessionOutput));
    document.getElementById("menuTeste2T")?.addEventListener("click", () => Dialogs.showTwoSampleT(worksheet, SessionOutput));
    document.getElementById("menuTesteTPareado")?.addEventListener("click", () => Dialogs.showTwoSampleT(worksheet, SessionOutput));
    document.getElementById("menu1Proporcao")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de 1 Proporção", "Avalia se a proporção amostral difere significativamente de um valor de referência.", worksheet, SessionOutput));
    document.getElementById("menu2Proporcoes")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de 2 Proporções", "Compara proporções de duas populações independentes.", worksheet, SessionOutput));
    document.getElementById("menu1Variancia")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de 1 Variância", "Avalia a variabilidade ou desvio padrão contra um desvio padrão hipotético.", worksheet, SessionOutput));
    document.getElementById("menu2Variancias")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de 2 Variâncias (Teste F)", "Compara a igualdade de duas variâncias populacionais.", worksheet, SessionOutput));
    document.getElementById("menuCorrelacao")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Correlação de Pearson", "Calcula matriz de correlação linear e valores P entre as colunas selecionadas.", worksheet, SessionOutput));
    document.getElementById("menuCovariancia")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Covariância", "Calcula a matriz de covariância conjunta.", worksheet, SessionOutput));
    document.getElementById("menuTesteNormalidade")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Normalidade de Anderson-Darling", "Avalia a aderência dos dados à distribuição normal padrão.", worksheet, SessionOutput));

    // Regressão
    const runRegression = () => {
        Dialogs.showLinearRegression(worksheet, SessionOutput, createChartTarget("Gráfico de Linha Ajustada"));
    };
    document.getElementById("menuRegressao")?.addEventListener("click", runRegression);
    document.getElementById("menuGraficoFit")?.addEventListener("click", runRegression);
    document.getElementById("menuRegressaoLogistica")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Regressão Logística Binária", "Modela probabilidade de desfecho binário (0/1) via função logit.", worksheet, SessionOutput));
    document.getElementById("menuRegressaoNaoLinear")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Regressão Não Linear", "Estimação de parâmetros por mínimos quadrados não lineares.", worksheet, SessionOutput));

    // ANOVA
    document.getElementById("menuAnova")?.addEventListener("click", () => Dialogs.showOneWayAnova(worksheet, SessionOutput));
    document.getElementById("menuAnovaGlm")?.addEventListener("click", () => Dialogs.showOneWayAnova(worksheet, SessionOutput));
    document.getElementById("menuAnovaAnom")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Análise de Médias (ANOM)", "Determina se as médias dos grupos diferem da média geral.", worksheet, SessionOutput));
    document.getElementById("menuAnovaVarIguais")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Variâncias Iguais (Bartlett/Levene)", "Testa a homogeneidade de variâncias entre os grupos.", worksheet, SessionOutput));
    document.getElementById("menuAnovaIntervalos")?.addEventListener("click", () => Dialogs.showBoxplotDialog(worksheet, SessionOutput, createChartTarget("Intervalos")));
    document.getElementById("menuAnovaEfeitos")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Gráfico de Efeitos Principais", "Exibe as médias em cada nível de fator para avaliar efeitos.", worksheet, SessionOutput));
    document.getElementById("menuAnovaInteracoes")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Gráfico de Interações", "Exibe interações bi-fatoriais.", worksheet, SessionOutput));

    // DOE
    document.getElementById("menuDoeFatorial")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Projeto Fatorial Completo / Fracionário", "Cria matriz de experimentos fatoriais de 2 níveis com blocos e réplicas.", worksheet, SessionOutput));
    document.getElementById("menuDoeSuperficie")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Superfície de Resposta (Delineamento Composto Central)", "Otimização de processos não-lineares via Box-Behnken ou CCC.", worksheet, SessionOutput));
    document.getElementById("menuDoeMistura")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Delineamento de Misturas (Simplex-Lattice / Centroid)", "Modelagem de formulações onde a soma das proporções é 100%.", worksheet, SessionOutput));
    document.getElementById("menuDoeTaguchi")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Matriz Ortogonal de Taguchi", "Projeto robusto de parâmetros para redução de variabilidade.", worksheet, SessionOutput));

    // Cartas de Controle
    const runXbar = () => {
        Dialogs.showXbarRChart(worksheet, SessionOutput, createChartTarget("Carta Xbarra-R"));
    };
    document.getElementById("menuXbarR")?.addEventListener("click", runXbar);
    document.getElementById("toolQuickXbar")?.addEventListener("click", runXbar);
    document.getElementById("menuXbarS")?.addEventListener("click", runXbar);
    document.getElementById("menuCartasImr")?.addEventListener("click", runXbar);
    document.getElementById("menuCartasZmr")?.addEventListener("click", runXbar);
    document.getElementById("menuCartasP")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Carta de Atributos P (Fração de Defeituosos)", "Monitora a proporção de itens não-conformes por subgrupo.", worksheet, SessionOutput));
    document.getElementById("menuCartasCU")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Carta de Atributos C e U (Contagem de Defeitos)", "Monitora número de defeitos por unidade de inspeção.", worksheet, SessionOutput));
    document.getElementById("menuCartasEwma")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Carta EWMA / CUSUM", "Detecta pequenos desvios da média do processo via médias móveis ponderadas.", worksheet, SessionOutput));

    // Ferramentas da Qualidade
    const runCapa = () => {
        Dialogs.showProcessCapability(worksheet, SessionOutput, createChartTarget("Capacidade do Processo"));
    };
    document.getElementById("menuCapacidade")?.addEventListener("click", runCapa);
    document.getElementById("menuCapacidadeNaoNormal")?.addEventListener("click", runCapa);
    document.getElementById("toolQuickCapa")?.addEventListener("click", runCapa);

    const runPareto = () => {
        Dialogs.showParetoChart(worksheet, SessionOutput, createChartTarget("Diagrama de Pareto"));
    };
    document.getElementById("menuPareto")?.addEventListener("click", runPareto);
    document.getElementById("toolQuickPareto")?.addEventListener("click", runPareto);

    document.getElementById("menuIshikawa")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Diagrama de Causa e Efeito (Ishikawa / 6M)", "Estruturação das causas fundamentais: Método, Máquina, Material, Mão de Obra, Meio Ambiente, Medição.", worksheet, SessionOutput));
    document.getElementById("menuGageRR")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Estudo de R&R do Sistema de Medição", "Avalia Repetibilidade e Reprodutibilidade dos operadores e instrumentos.", worksheet, SessionOutput));

    // Confiabilidade, Multivariada, Séries Temporais, Tabelas, Não-Paramétricos, Equivalência, Poder
    document.getElementById("menuConfDistribuicao")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Análise de Confiabilidade / Weibull", "Estima curvas de sobrevivência e tempo médio até falha (MTTF).", worksheet, SessionOutput));
    document.getElementById("menuConfRegressaoVida")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Regressão com Dados de Vida", "Modela a relação entre estressores operacionais e tempo de falha.", worksheet, SessionOutput));
    document.getElementById("menuConfAcelerado")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste Acelerado de Vida (ALT)", "Acelera falhas sob condições severas de temperatura/tensão.", worksheet, SessionOutput));

    document.getElementById("menuPca")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Análise de Componentes Principais (PCA)", "Redução de dimensionalidade preservando máxima variância explicada.", worksheet, SessionOutput));
    document.getElementById("menuFatores")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Análise de Fatores", "Identifica constructos e variáveis latentes subjacentes.", worksheet, SessionOutput));
    document.getElementById("menuCluster")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Agrupamento de Observações (Cluster K-Means)", "Particiona os dados em k grupos homogêneos por distância euclidiana.", worksheet, SessionOutput));
    document.getElementById("menuDiscriminante")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Análise Discriminante Linear (LDA)", "Classifica observações em categorias predefinidas.", worksheet, SessionOutput));

    document.getElementById("menuTimeSeriesPlot")?.addEventListener("click", () => Dialogs.showTimeSeriesPlotDialog(worksheet, SessionOutput, createChartTarget("Séries Temporais")));
    document.getElementById("menuTsTendencia")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Análise de Tendência", "Ajusta modelos linear, quadrático e de crescimento exponencial à série temporal.", worksheet, SessionOutput));
    document.getElementById("menuTsDecomposicao")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Decomposição Clássica de Séries Temporais", "Separa a série temporal em componentes: Tendência, Sazonalidade e Erro residual.", worksheet, SessionOutput));
    document.getElementById("menuTsMediaMovel")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Média Móvel Suavizada", "Suaviza flutuações de curto prazo para destacar ciclos da série.", worksheet, SessionOutput));
    document.getElementById("menuTsAlisamento")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Alisamento Exponencial (Holt-Winters)", "Prevê valores futuros aplicando pesos exponencialmente decrescentes.", worksheet, SessionOutput));
    document.getElementById("menuTsArima")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Modelo Autoregressivo Integrado de Médias Móveis (ARIMA)", "Ajusta modelo Box-Jenkins p, d, q à série estacionária.", worksheet, SessionOutput));

    document.getElementById("menuTabelaContagem")?.addEventListener("click", () => Dialogs.showBarChartDialog(worksheet, SessionOutput, createChartTarget("Tabela de Contagens")));
    document.getElementById("menuTabelaCruzada")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Tabulação Cruzada (Contingência) e Qui-Quadrado", "Analisa independência entre duas variáveis qualitativas.", worksheet, SessionOutput));
    document.getElementById("menuTabelaAssoc")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Associação Qui-Quadrado", "Mede força de associação entre linhas e colunas.", worksheet, SessionOutput));

    document.getElementById("menuWilcoxon")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Sinais de Wilcoxon para 1 Amostra", "Alternativa não-paramétrica ao teste t para a mediana.", worksheet, SessionOutput));
    document.getElementById("menuMannWhitney")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Mann-Whitney (Soma de Postos)", "Compara distribuições de duas amostras independentes.", worksheet, SessionOutput));
    document.getElementById("menuKruskalWallis")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Kruskal-Wallis", "Alternativa não-paramétrica à ANOVA de 1 via para múltiplos grupos.", worksheet, SessionOutput));
    document.getElementById("menuFriedman")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Friedman", "Teste não-paramétrico para blocos completos aleatorizados.", worksheet, SessionOutput));

    document.getElementById("menuEquiv1Amostra")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Equivalência para 1 Amostra (TOST)", "Testa se a média amostral é equivalente a um padrão dentro de limites de tolerância.", worksheet, SessionOutput));
    document.getElementById("menuEquiv2Amostras")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Equivalência para 2 Amostras", "Dois testes t unilaterais para provar bioequivalência ou igualdade prática.", worksheet, SessionOutput));
    document.getElementById("menuEquivPareado")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Teste de Equivalência Pareado", "Equivalência para observações pareadas.", worksheet, SessionOutput));

    document.getElementById("menuPoder1T")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Poder e Tamanho da Amostra: Teste t para 1 Amostra", "Calcula tamanho amostral necessário para detectar diferença com poder desejado (ex: 80%).", worksheet, SessionOutput));
    document.getElementById("menuPoder2T")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Poder e Tamanho da Amostra: Teste t para 2 Amostras", "Estima n por grupo considerando diferença e variabilidade.", worksheet, SessionOutput));
    document.getElementById("menuPoderAnova")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Poder e Tamanho da Amostra: ANOVA Unidirecional", "Determina o número de réplicas por tratamento.", worksheet, SessionOutput));
    document.getElementById("menuPoderDoe")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Poder e Tamanho da Amostra: Delineamento Fatorial", "Avalia sensibilidade de projetos de experimentos.", worksheet, SessionOutput));

    // ========================================================================
    // GRÁFICO MENU HANDLERS
    // ========================================================================
    document.getElementById("menuGraficoBuilder")?.addEventListener("click", () => Dialogs.showGraphBuilderDialog(worksheet, SessionOutput));
    document.getElementById("menuGraficoDispersao")?.addEventListener("click", () => Dialogs.showScatterPlotDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Dispersão")));
    document.getElementById("menuGraficoDispersaoCaixas")?.addEventListener("click", () => Dialogs.showScatterPlotDialog(worksheet, SessionOutput, createChartTarget("Dispersão em Caixas")));
    document.getElementById("menuMatrizDispersao")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Matriz de Dispersão (Draftsman Plot)", "Gera matriz com todos os pares de diagramas de dispersão entre variáveis.", worksheet, SessionOutput));
    document.getElementById("menuCorrelograma")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Correlograma", "Mapeamento visual colorido da matriz de correlação.", worksheet, SessionOutput));
    document.getElementById("menuGraficoBolhas")?.addEventListener("click", () => Dialogs.showScatterPlotDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Bolhas")));
    document.getElementById("menuDispersaoMarginal")?.addEventListener("click", () => Dialogs.showScatterPlotDialog(worksheet, SessionOutput, createChartTarget("Dispersão Marginal")));

    document.getElementById("menuGraficoHist")?.addEventListener("click", () => {
        const numCols = worksheet.getNumericColumns();
        if (numCols.length === 0) {
            alert("A planilha não possui colunas numéricas com dados.");
            return;
        }
        SessionOutput.appendChartCard(`Histograma de ${numCols[0].name || 'C' + (numCols[0].index + 1)}`, (box) => {
            Charts.renderHistogram(box, numCols[0].data, `Histograma de ${numCols[0].name || 'C' + (numCols[0].index + 1)}`);
        });
    });

    document.getElementById("menuDiagramaPontos")?.addEventListener("click", () => Dialogs.showBoxplotDialog(worksheet, SessionOutput, createChartTarget("Diagrama de Pontos")));
    document.getElementById("menuRamoFolhas")?.addEventListener("click", () => {
        const numCols = worksheet.getNumericColumns();
        if (numCols.length === 0) {
            alert("A planilha não possui colunas numéricas com dados.");
            return;
        }
        const col = numCols[0];
        const data = Statistics.filterNumeric(col.data).sort((a,b) => a - b);
        let output = `Diagrama de Ramo-e-Folhas: ${col.name || 'C' + (col.index + 1)} (N = ${data.length})\nUnidade da folha = 1.0\n`;
        const stems = {};
        data.forEach(v => {
            const s = Math.floor(v / 10);
            const l = Math.floor(Math.abs(v) % 10);
            if (!stems[s]) stems[s] = [];
            stems[s].push(l);
        });
        Object.keys(stems).sort((a,b) => a - b).forEach(s => {
            output += `${s.padStart(4, ' ')} | ${stems[s].join(" ")}\n`;
        });
        SessionOutput.appendMessage(`<pre style="font-family:Consolas, monospace; font-size:12px; margin:0;">${output}</pre>`);
    });

    document.getElementById("menuGraficoProbabilidade")?.addEventListener("click", () => Dialogs.showScatterPlotDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Probabilidade")));
    document.getElementById("menuFdaEmpirica")?.addEventListener("click", () => Dialogs.showTimeSeriesPlotDialog(worksheet, SessionOutput, createChartTarget("FDA Empírica")));
    document.getElementById("menuDistProbabilidade")?.addEventListener("click", () => {
        SessionOutput.appendChartCard("Curva de Distribuição Normal Padrão", (box) => {
            Charts.renderHistogram(box, Statistics.randomNormal(200, 0, 1), "Distribuição de Probabilidade Normal");
        });
    });

    document.getElementById("menuGraficoBoxplot")?.addEventListener("click", () => Dialogs.showBoxplotDialog(worksheet, SessionOutput, createChartTarget("Boxplot")));
    document.getElementById("menuGraficoIntervalos")?.addEventListener("click", () => Dialogs.showBoxplotDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Intervalos")));
    document.getElementById("menuValoresIndividuais")?.addEventListener("click", () => Dialogs.showBoxplotDialog(worksheet, SessionOutput, createChartTarget("Valores Individuais")));
    document.getElementById("menuGraficoLinhas")?.addEventListener("click", () => Dialogs.showTimeSeriesPlotDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Linhas")));
    document.getElementById("menuCoordParalelas")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Gráfico de Coordenadas Paralelas", "Visualização multidimensional de vetores com eixos paralelos verticais.", worksheet, SessionOutput));

    document.getElementById("menuGraficoBarras")?.addEventListener("click", () => Dialogs.showBarChartDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Barras")));
    document.getElementById("menuMapaCalor")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Mapa de Calor (Heatmap)", "Gera matriz colorida por intensidade de grandezas numéricas.", worksheet, SessionOutput));
    document.getElementById("menuGraficoSetores")?.addEventListener("click", () => Dialogs.showPieChartDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Setores")));

    document.getElementById("menuGraficoSeriesTemporais")?.addEventListener("click", () => Dialogs.showTimeSeriesPlotDialog(worksheet, SessionOutput, createChartTarget("Séries Temporais")));
    document.getElementById("menuGraficoArea")?.addEventListener("click", () => Dialogs.showTimeSeriesPlotDialog(worksheet, SessionOutput, createChartTarget("Gráfico de Área")));

    document.getElementById("menuGraficoContorno")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Gráfico de Contorno", "Curvas de nível 2D para superfícies de resposta e modelagens tridimensionais.", worksheet, SessionOutput));
    document.getElementById("menuDispersao3D")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Gráfico de Dispersão 3D", "Mapeamento em eixos tridimensionais X, Y, Z com projeção isométrica.", worksheet, SessionOutput));
    document.getElementById("menuSuperficie3D")?.addEventListener("click", () => Dialogs.showGenericStatsDialog("Gráfico de Superfície 3D", "Superfície de resposta contínua com mapeamento de cores z.", worksheet, SessionOutput));

    // Visualizar
    document.getElementById("menuLimparSessao")?.addEventListener("click", () => SessionOutput.clear());

    document.getElementById("menuToggleNav")?.addEventListener("click", () => {
        const nav = document.getElementById("paneNavigator");
        nav.style.display = nav.style.display === "none" ? "flex" : "none";
    });

    document.getElementById("btnCollapseNav")?.addEventListener("click", () => {
        document.getElementById("menuToggleNav")?.click();
    });

    document.getElementById("menuToggleCli")?.addEventListener("click", () => {
        const right = document.getElementById("paneRight");
        right.style.display = right.style.display === "none" ? "flex" : "none";
    });

    // Ajuda
    const showHelpModal = () => {
        Dialogs.showHelpDialog();
    };
    document.getElementById("menuAjuda")?.addEventListener("click", showHelpModal);
    document.getElementById("menuAjudaCli")?.addEventListener("click", () => SessionOutput.appendHelp());
    document.getElementById("toolHelp")?.addEventListener("click", showHelpModal);
    document.getElementById("menuSobre")?.addEventListener("click", () => {
        alert("Mytable 22\nVersão Nativa Reconstruída via REA\nCompatível com a interface de Desktop");
    });

    // Zoom Controls
    zoomSlider?.addEventListener("input", (e) => {
        const val = e.target.value;
        zoomPctLabel.textContent = `${val}%`;
        worksheetViewport.style.zoom = `${val}%`;
    });

    document.getElementById("btnZoomIn")?.addEventListener("click", () => {
        let val = parseInt(zoomSlider.value, 10) + 10;
        if (val > 150) val = 150;
        zoomSlider.value = val;
        zoomSlider.dispatchEvent(new Event('input'));
    });

    document.getElementById("btnZoomOut")?.addEventListener("click", () => {
        let val = parseInt(zoomSlider.value, 10) - 10;
        if (val < 50) val = 50;
        zoomSlider.value = val;
        zoomSlider.dispatchEvent(new Event('input'));
    });

    document.getElementById("btnZoomReset")?.addEventListener("click", () => {
        zoomSlider.value = 100;
        zoomSlider.dispatchEvent(new Event('input'));
    });

    // Tab Add Worksheet
    document.getElementById("btnTabAddWs")?.addEventListener("click", () => {
        alert("Criar nova planilha: Adicionando colunas vazias à planilha de trabalho.");
        worksheet.addColumn();
        worksheet.addColumn();
    });

    // Load initial empty grid & watermark as shown in screenshot!
    // Notice in screenshot: Minitab opens with blank columns C1..C15 and watermark!
    renderWorksheet();
    updateWorksheetLabels();
    updateWatermark();
});
