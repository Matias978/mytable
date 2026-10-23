/**
 * Minitable 22 - Windows Desktop Statistical Modal Dialogs System
 * Authentic Windows 11 / Minitab 22 dialog aesthetics and Portuguese language support.
 */

const Dialogs = (() => {

    let activeModal = null;
    let focusedInput = null;

    function createModalSkeleton(title, bodyHtml, onOk) {
        closeModal();

        const backdrop = document.createElement("div");
        backdrop.className = "win-dialog-backdrop";

        const modal = document.createElement("div");
        modal.className = "win-dialog-window";

        modal.innerHTML = `
            <div class="win-dialog-header">
                <span>${title}</span>
                <button class="win-dialog-close" id="modalCloseBtn">&times;</button>
            </div>
            <div class="win-dialog-body">
                ${bodyHtml}
            </div>
            <div class="win-dialog-footer">
                <button class="btn-win btn-win-primary" id="modalOkBtn">OK</button>
                <button class="btn-win" id="modalCancelBtn">Cancelar</button>
                <button class="btn-win" id="modalHelpBtn">Ajuda</button>
            </div>
        `;

        backdrop.appendChild(modal);
        document.body.appendChild(backdrop);
        activeModal = backdrop;

        modal.querySelector("#modalCloseBtn").onclick = closeModal;
        modal.querySelector("#modalCancelBtn").onclick = closeModal;
        modal.querySelector("#modalHelpBtn").onclick = () => {
            alert(`Ajuda do Mytable 22: Utilize este diálogo para configurar as opções e variáveis para ${title}.`);
        };

        modal.querySelector("#modalOkBtn").onclick = () => {
            if (onOk(modal)) {
                closeModal();
            }
        };

        // Track focused inputs to enable column double-click selection
        const inputs = modal.querySelectorAll("input[type='text'], input[type='number']");
        if (inputs.length > 0) {
            focusedInput = inputs[0];
            inputs[0].focus();
            inputs.forEach(inp => {
                inp.addEventListener("focus", () => { focusedInput = inp; });
            });
        }

        // Attach double click to column list items
        modal.querySelectorAll(".col-selector-item").forEach(item => {
            item.addEventListener("dblclick", () => {
                const colRef = item.getAttribute("data-col-ref");
                if (focusedInput) {
                    if (focusedInput.getAttribute("data-multiple") === "true") {
                        const cur = focusedInput.value.trim();
                        focusedInput.value = cur ? `${cur} ${colRef}` : colRef;
                    } else {
                        focusedInput.value = colRef;
                    }
                }
            });

            item.addEventListener("click", () => {
                modal.querySelectorAll(".col-selector-item").forEach(i => i.classList.remove("selected"));
                item.classList.add("selected");
            });
        });

        // "Select" button
        const selectBtn = modal.querySelector("#dialogColSelectBtn");
        if (selectBtn) {
            selectBtn.onclick = () => {
                const selectedItem = modal.querySelector(".col-selector-item.selected");
                if (selectedItem && focusedInput) {
                    const colRef = selectedItem.getAttribute("data-col-ref");
                    if (focusedInput.getAttribute("data-multiple") === "true") {
                        const cur = focusedInput.value.trim();
                        focusedInput.value = cur ? `${cur} ${colRef}` : colRef;
                    } else {
                        focusedInput.value = colRef;
                    }
                }
            };
        }
    }

    function closeModal() {
        if (activeModal && activeModal.parentNode) {
            activeModal.parentNode.removeChild(activeModal);
            activeModal = null;
            focusedInput = null;
        }
    }

    function renderColumnPicker(worksheet, filterNumericOnly = false) {
        const cols = filterNumericOnly ? worksheet.getNumericColumns() : worksheet.columns;
        const validCols = cols.filter(c => c.data.some(v => v !== ''));
        const displayCols = validCols.length > 0 ? validCols : worksheet.columns.slice(0, 10);

        const items = displayCols.map(c => {
            const label = c.name ? `C${c.index + 1}  ${c.name}` : `C${c.index + 1}`;
            const ref = `C${c.index + 1}`;
            return `<div class="col-selector-item" data-col-ref="${ref}"><span>${label}</span></div>`;
        }).join("");

        return `
            <div style="width:140px; display:flex; flex-direction:column;">
                <div class="col-selector-box">${items || '<div style="padding:6px; color:#888;">Sem colunas</div>'}</div>
                <button class="btn-win" style="margin-top:8px; font-size:11px;" type="button" id="dialogColSelectBtn">Selecionar &rarr;</button>
            </div>
        `;
    }

    // ------------------------------------------------------------------------
    // 1. Estatísticas Descritivas
    // ------------------------------------------------------------------------
    function showDescriptiveStatistics(worksheet, sessionOutput, chartContainer) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Variáveis:</label>
                        <input type="text" id="diagVars" class="form-control" data-multiple="true" placeholder="ex: C1 C2">
                        <small style="color:#666; font-size:11px;">Dê um duplo clique na coluna à esquerda para inserir.</small>
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Por variáveis (opcional):</label>
                        <input type="text" id="diagByVar" class="form-control" placeholder="ex: C3">
                    </div>
                    <fieldset style="border:1px solid #d1d5db; padding:8px; border-radius:3px;">
                        <legend style="font-size:11px; font-weight:600; color:#374151; padding:0 4px;">Estatísticas</legend>
                        <div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:11px;">
                            <label><input type="checkbox" id="chkMean" checked> Média</label>
                            <label><input type="checkbox" id="chkMin" checked> Mínimo</label>
                            <label><input type="checkbox" id="chkSEMean" checked> Erro Padrão da Média</label>
                            <label><input type="checkbox" id="chkMedian" checked> Mediana</label>
                            <label><input type="checkbox" id="chkStDev" checked> Desvio Padrão</label>
                            <label><input type="checkbox" id="chkMax" checked> Máximo</label>
                            <label><input type="checkbox" id="chkVariance" checked> Variância</label>
                            <label><input type="checkbox" id="chkQ1" checked> Quartis (Q1, Q3)</label>
                        </div>
                    </fieldset>
                    <div style="margin-top:10px;">
                        <label><input type="checkbox" id="chkShowHist" checked> Exibir Histograma com Curva Normal</label>
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Estatísticas Descritivas", bodyHtml, modal => {
            const varStr = modal.querySelector("#diagVars").value.trim();
            if (!varStr) {
                alert("Selecione ao menos uma variável numérica.");
                return false;
            }

            const tokens = varStr.split(/\s+/);
            const cols = tokens.map(t => worksheet.getColumnByName(t)).filter(Boolean);
            if (cols.length === 0) {
                alert("Não foi possível localizar as colunas especificadas.");
                return false;
            }

            const statsList = cols.map(c => Statistics.describe(c.data, c.name || `C${c.index + 1}`));
            sessionOutput.appendDescriptiveStatistics(statsList);

            if (modal.querySelector("#chkShowHist").checked && cols.length > 0) {
                sessionOutput.appendChartCard(`Histograma de ${cols[0].name || 'C' + (cols[0].index + 1)}`, (box) => {
                    Charts.renderHistogram(box, cols[0].data, `Histograma de ${cols[0].name || 'C' + (cols[0].index + 1)}`);
                });
            }
            return true;
        });
    }

    // ------------------------------------------------------------------------
    // 2. Teste t para 1 Amostra
    // ------------------------------------------------------------------------
    function showOneSampleT(worksheet, sessionOutput) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Amostras na coluna:</label>
                        <input type="text" id="diagSampleVar" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Média Hipotética (&mu;<sub>0</sub>):</label>
                        <input type="number" id="diagMu0" class="form-control" value="0.0" step="any">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Nível de Confiança (%):</label>
                        <input type="number" id="diagConf" class="form-control" value="95.0" step="0.1" min="80" max="99.9">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Hipótese Alternativa:</label>
                        <select id="diagAlt" class="form-control" style="width:100%; height:26px;">
                            <option value="not_equal">&ne; Não igual (Bicaudal)</option>
                            <option value="greater">&gt; Maior que (Unicaudal superior)</option>
                            <option value="less">&lt; Menor que (Unicaudal inferior)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Teste t para 1 Amostra", bodyHtml, modal => {
            const varStr = modal.querySelector("#diagSampleVar").value.trim();
            const col = worksheet.getColumnByName(varStr);
            if (!col) {
                alert("Selecione uma coluna válida de amostra.");
                return false;
            }
            const mu0 = parseFloat(modal.querySelector("#diagMu0").value) || 0;
            const conf = (parseFloat(modal.querySelector("#diagConf").value) || 95) / 100;
            const alt = modal.querySelector("#diagAlt").value;

            try {
                const res = Statistics.oneSampleT(col.data, mu0, conf, alt);
                sessionOutput.appendOneSampleT(res, col.name || `C${col.index + 1}`);
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 3. Teste t para 2 Amostras
    // ------------------------------------------------------------------------
    function showTwoSampleT(worksheet, sessionOutput) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:8px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Amostra 1:</label>
                        <input type="text" id="diagSample1" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Amostra 2:</label>
                        <input type="text" id="diagSample2" class="form-control" placeholder="ex: C2">
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Nível de Confiança (%):</label>
                        <input type="number" id="diagConf" class="form-control" value="95.0" step="0.1">
                    </div>
                    <div style="margin-top:10px;">
                        <label><input type="checkbox" id="diagEqualVar"> Assumir variâncias iguais (Desvio Padrão Agrupado)</label>
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Teste t para 2 Amostras", bodyHtml, modal => {
            const s1Name = modal.querySelector("#diagSample1").value.trim();
            const s2Name = modal.querySelector("#diagSample2").value.trim();
            const col1 = worksheet.getColumnByName(s1Name);
            const col2 = worksheet.getColumnByName(s2Name);

            if (!col1 || !col2) {
                alert("Especifique colunas válidas para a Amostra 1 e Amostra 2.");
                return false;
            }
            const conf = (parseFloat(modal.querySelector("#diagConf").value) || 95) / 100;
            const eqVar = modal.querySelector("#diagEqualVar").checked;

            try {
                const res = Statistics.twoSampleT(col1.data, col2.data, eqVar, conf);
                sessionOutput.appendTwoSampleT(res, col1.name || `C${col1.index + 1}`, col2.name || `C${col2.index + 1}`);
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 4. One-Way ANOVA
    // ------------------------------------------------------------------------
    function showOneWayAnova(worksheet, sessionOutput) {
        const colPicker = renderColumnPicker(worksheet, false);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Resposta (Variável numérica):</label>
                        <input type="text" id="diagResp" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Fator (Grupos/Categorias):</label>
                        <input type="text" id="diagFactor" class="form-control" placeholder="ex: C2">
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("ANOVA Unidirecional (One-Way)", bodyHtml, modal => {
            const respName = modal.querySelector("#diagResp").value.trim();
            const factorName = modal.querySelector("#diagFactor").value.trim();
            const respCol = worksheet.getColumnByName(respName);
            const factorCol = worksheet.getColumnByName(factorName);

            if (!respCol || !factorCol) {
                alert("Selecione colunas válidas para a Resposta e o Fator.");
                return false;
            }

            const groupMap = new Map();
            for (let i = 0; i < respCol.data.length; i++) {
                const f = String(factorCol.data[i] || '').trim();
                const r = Number(respCol.data[i]);
                if (f && !isNaN(r)) {
                    if (!groupMap.has(f)) groupMap.set(f, []);
                    groupMap.get(f).push(r);
                }
            }

            const groups = Array.from(groupMap.entries()).map(([name, data]) => ({ name, data }));
            try {
                const anova = Statistics.oneWayAnova(groups);
                sessionOutput.appendAnova(anova, respCol.name || `C${respCol.index + 1}`, factorCol.name || `C${factorCol.index + 1}`);
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 5. Regressão Linear / Linha Ajustada
    // ------------------------------------------------------------------------
    function showLinearRegression(worksheet, sessionOutput, chartContainer) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Resposta (Y):</label>
                        <input type="text" id="diagY" class="form-control" placeholder="ex: C2">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Preditor (X):</label>
                        <input type="text" id="diagX" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-top:10px;">
                        <label><input type="checkbox" id="diagFittedPlot" checked> Exibir Gráfico de Linha Ajustada</label>
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Gráfico de Linha Ajustada (Regressão)", bodyHtml, modal => {
            const yName = modal.querySelector("#diagY").value.trim();
            const xName = modal.querySelector("#diagX").value.trim();
            const yCol = worksheet.getColumnByName(yName);
            const xCol = worksheet.getColumnByName(xName);

            if (!yCol || !xCol) {
                alert("Selecione colunas válidas para a Resposta (Y) e o Preditor (X).");
                return false;
            }

            try {
                const reg = Statistics.linearRegression(xCol.data, yCol.data);
                sessionOutput.appendRegression(reg, yCol.name || `C${yCol.index + 1}`, xCol.name || `C${xCol.index + 1}`);
                if (modal.querySelector("#diagFittedPlot").checked) {
                    sessionOutput.appendChartCard(`Linha Ajustada: ${yCol.name} vs ${xCol.name}`, (box) => {
                        Charts.renderFittedLinePlot(box, reg, `Linha Ajustada: ${yCol.name} vs ${xCol.name}`);
                    });
                }
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 6. Carta de Controle Xbarra-R
    // ------------------------------------------------------------------------
    function showXbarRChart(worksheet, sessionOutput, chartContainer) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Todas as observações para um gráfico estão em uma coluna:</label>
                        <input type="text" id="diagObs" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Tamanho do Subgrupo:</label>
                        <input type="number" id="diagSubSize" class="form-control" value="5" min="2" max="25">
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Carta de Controle Xbarra-R", bodyHtml, modal => {
            const obsName = modal.querySelector("#diagObs").value.trim();
            const col = worksheet.getColumnByName(obsName);
            if (!col) {
                alert("Selecione uma coluna válida de observações.");
                return false;
            }
            const subSize = parseInt(modal.querySelector("#diagSubSize").value, 10) || 5;

            try {
                const spc = Statistics.xbarRChart(col.data, subSize);
                sessionOutput.appendXbarR(spc, col.name || `C${col.index + 1}`);
                sessionOutput.appendChartCard(`Carta Xbarra-R: ${col.name || 'C' + (col.index + 1)}`, (box) => {
                    Charts.renderXbarRChart(box, spc, `Carta Xbarra-R: ${col.name || 'C' + (col.index + 1)}`);
                });
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 7. Análise de Capacidade de Processo (Normal)
    // ------------------------------------------------------------------------
    function showProcessCapability(worksheet, sessionOutput, chartContainer) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:8px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Coluna única:</label>
                        <input type="text" id="diagCapaCol" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-bottom:8px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Tamanho do Subgrupo:</label>
                        <input type="number" id="diagSubSize" class="form-control" value="5" min="1" max="25">
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:8px;">
                        <div>
                            <label style="display:block; font-weight:600; margin-bottom:4px;">Limite Inferior (LIE):</label>
                            <input type="number" id="diagLsl" class="form-control" step="any" placeholder="Opcional">
                        </div>
                        <div>
                            <label style="display:block; font-weight:600; margin-bottom:4px;">Limite Superior (LSE):</label>
                            <input type="number" id="diagUsl" class="form-control" step="any" placeholder="Opcional">
                        </div>
                    </div>
                    <div>
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Alvo (Target):</label>
                        <input type="number" id="diagTarget" class="form-control" step="any" placeholder="Opcional">
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Análise de Capacidade (Normal)", bodyHtml, modal => {
            const colName = modal.querySelector("#diagCapaCol").value.trim();
            const col = worksheet.getColumnByName(colName);
            if (!col) {
                alert("Selecione uma coluna de dados.");
                return false;
            }
            const subSize = parseInt(modal.querySelector("#diagSubSize").value, 10) || 1;
            const lslVal = modal.querySelector("#diagLsl").value.trim();
            const uslVal = modal.querySelector("#diagUsl").value.trim();
            const targetVal = modal.querySelector("#diagTarget").value.trim();

            const lsl = lslVal !== "" ? parseFloat(lslVal) : null;
            const usl = uslVal !== "" ? parseFloat(uslVal) : null;
            const target = targetVal !== "" ? parseFloat(targetVal) : null;

            if (lsl === null && usl === null) {
                alert("Especifique ao menos um limite de especificação (LIE ou LSE).");
                return false;
            }

            try {
                const capa = Statistics.processCapability(col.data, lsl, usl, target, subSize);
                sessionOutput.appendProcessCapability(capa, col.name || `C${col.index + 1}`);
                sessionOutput.appendChartCard(`Capacidade: ${col.name || 'C' + (col.index + 1)}`, (box) => {
                    Charts.renderProcessCapability(box, capa, `Capacidade do Processo: ${col.name || 'C' + (col.index + 1)}`);
                });
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 8. Diagrama de Pareto
    // ------------------------------------------------------------------------
    function showParetoChart(worksheet, sessionOutput, chartContainer) {
        const colPicker = renderColumnPicker(worksheet, false);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Defeitos ou dados de atributo em:</label>
                        <input type="text" id="diagCat" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Frequências em (opcional):</label>
                        <input type="text" id="diagFreq" class="form-control" placeholder="ex: C2 (em branco para 1 por linha)">
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Diagrama de Pareto", bodyHtml, modal => {
            const catName = modal.querySelector("#diagCat").value.trim();
            const freqName = modal.querySelector("#diagFreq").value.trim();
            const catCol = worksheet.getColumnByName(catName);
            const freqCol = freqName ? worksheet.getColumnByName(freqName) : null;

            if (!catCol) {
                alert("Selecione a coluna de categorias.");
                return false;
            }

            try {
                const pareto = Statistics.paretoAnalysis(catCol.data, freqCol ? freqCol.data : null);
                sessionOutput.appendPareto(pareto, catCol.name || `C${catCol.index + 1}`);
                sessionOutput.appendChartCard(`Diagrama de Pareto: ${catCol.name || 'C' + (catCol.index + 1)}`, (box) => {
                    Charts.renderPareto(box, pareto, `Diagrama de Pareto de ${catCol.name || 'C' + (catCol.index + 1)}`);
                });
                return true;
            } catch (e) {
                alert(e.message);
                return false;
            }
        });
    }

    // ------------------------------------------------------------------------
    // 9. Dados Aleatórios
    // ------------------------------------------------------------------------
    function showRandomData(worksheet, sessionOutput) {
        const bodyHtml = `
            <div>
                <div style="margin-bottom:10px;">
                    <label style="display:block; font-weight:600; margin-bottom:4px;">Número de linhas a gerar:</label>
                    <input type="number" id="diagCount" class="form-control" value="50" min="1" max="10000">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="display:block; font-weight:600; margin-bottom:4px;">Armazenar na(s) coluna(s):</label>
                    <input type="text" id="diagTargetCol" class="form-control" value="C1">
                </div>
                <div style="margin-bottom:10px;">
                    <label style="display:block; font-weight:600; margin-bottom:4px;">Distribuição:</label>
                    <select id="diagDist" class="form-control" style="width:100%; height:26px;">
                        <option value="normal">Normal</option>
                        <option value="uniform">Uniforme</option>
                    </select>
                </div>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    <div>
                        <label style="display:block; font-size:11px; margin-bottom:2px;">Média:</label>
                        <input type="number" id="diagMu" class="form-control" value="0.0" step="any">
                    </div>
                    <div>
                        <label style="display:block; font-size:11px; margin-bottom:2px;">Desvio padrão:</label>
                        <input type="number" id="diagSigma" class="form-control" value="1.0" step="any" min="0.0001">
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Gerar Dados Aleatórios", bodyHtml, modal => {
            const count = parseInt(modal.querySelector("#diagCount").value, 10) || 50;
            const targetColName = modal.querySelector("#diagTargetCol").value.trim();
            const col = worksheet.getColumnByName(targetColName) || worksheet.addColumn(targetColName);

            const dist = modal.querySelector("#diagDist").value;
            let vals = [];
            if (dist === "normal") {
                const mu = parseFloat(modal.querySelector("#diagMu").value) || 0;
                const sigma = parseFloat(modal.querySelector("#diagSigma").value) || 1;
                vals = Statistics.randomNormal(count, mu, sigma);
            } else {
                vals = Statistics.randomUniform(count, 0, 100);
            }

            worksheet.setColumnData(col.index, vals);
            sessionOutput.appendMessage(`Gerados ${count} valores aleatórios na coluna ${col.name || 'C' + (col.index + 1)}.`);
            return true;
        });
    }

    // ------------------------------------------------------------------------
    // 10. Diálogo Informativo / Ajuda
    // ------------------------------------------------------------------------
    function showHelpDialog() {
        const bodyHtml = `
            <div style="font-size:12px; line-height:1.5;">
                <p><strong>Mytable 22</strong> é a reconstrução autônoma e equivalente do ambiente analítico Desktop.</p>
                <p style="margin-top:8px;"><strong>Recursos disponíveis:</strong></p>
                <ul style="margin-left:18px; margin-top:4px;">
                    <li>Estatística Descritiva, Testes t de Hipótese e ANOVA.</li>
                    <li>Cartas de Controle SPC (Xbarra-R, I-MR) com limites de controle.</li>
                    <li>Análise de Capacidade Sixpack (Cp, Cpk, Pp, Ppk).</li>
                    <li>Diagrama de Pareto e Regressão Linear com gráficos SVG.</li>
                    <li>Console de linha de comando no painel direito aceitando comandos de sessão canônicos (ex: <code>DESCRIBE C1.</code>).</li>
                </ul>
            </div>
        `;
        createModalSkeleton("Ajuda do Mytable 22", bodyHtml, () => true);
    }

    function showRenameWorksheet(worksheet, onRenamed) {
        const bodyHtml = `
            <div style="font-size:12px; line-height:1.5; padding: 4px 0;">
                <label for="modalWsRenameInput" style="display:block; margin-bottom:8px; font-weight:600; color:#222;">Novo nome da planilha:</label>
                <input type="text" id="modalWsRenameInput" class="win-input" value="${worksheet.name || 'Worksheet 1'}" style="width:100%; box-sizing:border-box; padding:6px 8px; font-size:13px; border:1px solid #7a7a7a; border-radius:2px;">
                <div style="margin-top:8px; color:#666; font-size:11px;">O nome identifica a planilha no navegador de projeto e nos relatórios de sessão.</div>
            </div>
        `;
        createModalSkeleton("Renomear Planilha", bodyHtml, (modal) => {
            const input = modal.querySelector("#modalWsRenameInput");
            const newName = input ? input.value.trim() : "";
            if (!newName) {
                alert("O nome da planilha não pode ser vazio.");
                return false;
            }
            worksheet.setWorksheetName(newName);
            if (onRenamed) onRenamed(newName);
            return true;
        });

        setTimeout(() => {
            const inp = document.getElementById("modalWsRenameInput");
            if (inp) {
                inp.focus();
                inp.select();
            }
        }, 50);
    }

    function showScatterPlotDialog(worksheet, sessionOutput, chartTarget) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Variável Y (Vertical):</label>
                        <input type="text" id="diagScatterY" class="form-control" placeholder="ex: C2">
                    </div>
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Variável X (Horizontal):</label>
                        <input type="text" id="diagScatterX" class="form-control" placeholder="ex: C1">
                    </div>
                    <div style="margin-top:12px; font-size:11px; color:#666;">
                        Gera gráfico de dispersão com mapeamento bi-variado dos dados.
                    </div>
                </div>
            </div>
        `;
        createModalSkeleton("Gráfico de Dispersão", bodyHtml, (modal) => {
            const yName = modal.querySelector("#diagScatterY").value.trim();
            const xName = modal.querySelector("#diagScatterX").value.trim();
            const colY = worksheet.getColumnByName(yName);
            const colX = worksheet.getColumnByName(xName);
            if (!colY || !colX) {
                alert("Por favor, selecione variáveis X e Y válidas na planilha.");
                return false;
            }
            const yLabel = colY.name ? `C${colY.index + 1}: ${colY.name}` : `C${colY.index + 1}`;
            const xLabel = colX.name ? `C${colX.index + 1}: ${colX.name}` : `C${colX.index + 1}`;
            sessionOutput.appendChartCard(`Gráfico de Dispersão: ${yLabel} vs ${xLabel}`, (box) => {
                Charts.renderScatterPlot(box, colX.data, colY.data, `Dispersão de ${yLabel} vs ${xLabel}`, xLabel, yLabel);
            });
            sessionOutput.appendCommandHistory(`PLOT ${yName} * ${xName}`, new Date().toLocaleTimeString());
            return true;
        });
    }

    function showBoxplotDialog(worksheet, sessionOutput, chartTarget) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Variável:</label>
                        <input type="text" id="diagBoxVar" class="form-control" placeholder="ex: C1">
                        <small style="color:#666; font-size:11px;">Selecione a variável numérica para construir o Boxplot.</small>
                    </div>
                </div>
            </div>
        `;
        createModalSkeleton("Boxplot", bodyHtml, (modal) => {
            const varName = modal.querySelector("#diagBoxVar").value.trim();
            const col = worksheet.getColumnByName(varName);
            if (!col) {
                alert("Por favor, selecione uma coluna válida.");
                return false;
            }
            const label = col.name ? `C${col.index + 1}: ${col.name}` : `C${col.index + 1}`;
            sessionOutput.appendChartCard(`Boxplot: ${label}`, (box) => {
                Charts.renderBoxplot(box, col.data, "Boxplot", label);
            });
            sessionOutput.appendCommandHistory(`BOXPLOT ${varName}`, new Date().toLocaleTimeString());
            return true;
        });
    }

    function showBarChartDialog(worksheet, sessionOutput, chartTarget) {
        const colPicker = renderColumnPicker(worksheet, false);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Coluna Categórica ou Contagens:</label>
                        <input type="text" id="diagBarVar" class="form-control" placeholder="ex: C1">
                    </div>
                </div>
            </div>
        `;
        createModalSkeleton("Gráfico de Barras", bodyHtml, (modal) => {
            const varName = modal.querySelector("#diagBarVar").value.trim();
            const col = worksheet.getColumnByName(varName);
            if (!col) {
                alert("Por favor, selecione uma coluna válida.");
                return false;
            }
            const label = col.name ? `C${col.index + 1}: ${col.name}` : `C${col.index + 1}`;
            const countsMap = {};
            col.data.filter(v => v !== '' && v !== null && v !== undefined).forEach(v => {
                countsMap[v] = (countsMap[v] || 0) + 1;
            });
            const cats = Object.keys(countsMap);
            const cnts = Object.values(countsMap);
            sessionOutput.appendChartCard(`Gráfico de Barras: ${label}`, (box) => {
                Charts.renderBarChart(box, cats, cnts, `Gráfico de Barras de ${label}`);
            });
            sessionOutput.appendCommandHistory(`BARCHART ${varName}`, new Date().toLocaleTimeString());
            return true;
        });
    }

    function showTimeSeriesPlotDialog(worksheet, sessionOutput, chartTarget) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Série (Coluna Numérica):</label>
                        <input type="text" id="diagTsVar" class="form-control" placeholder="ex: C1">
                    </div>
                </div>
            </div>
        `;
        createModalSkeleton("Gráfico de Séries Temporais", bodyHtml, (modal) => {
            const varName = modal.querySelector("#diagTsVar").value.trim();
            const col = worksheet.getColumnByName(varName);
            if (!col) {
                alert("Por favor, selecione uma coluna válida.");
                return false;
            }
            const label = col.name ? `C${col.index + 1}: ${col.name}` : `C${col.index + 1}`;
            sessionOutput.appendChartCard(`Séries Temporais: ${label}`, (box) => {
                Charts.renderTimeSeries(box, col.data, `Série Temporal: ${label}`, label);
            });
            sessionOutput.appendCommandHistory(`TSPLOT ${varName}`, new Date().toLocaleTimeString());
            return true;
        });
    }

    function showPieChartDialog(worksheet, sessionOutput, chartTarget) {
        const colPicker = renderColumnPicker(worksheet, false);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Coluna Categórica:</label>
                        <input type="text" id="diagPieVar" class="form-control" placeholder="ex: C1">
                    </div>
                </div>
            </div>
        `;
        createModalSkeleton("Gráfico de Setores (Pizza)", bodyHtml, (modal) => {
            const varName = modal.querySelector("#diagPieVar").value.trim();
            const col = worksheet.getColumnByName(varName);
            if (!col) {
                alert("Por favor, selecione uma coluna válida.");
                return false;
            }
            const label = col.name ? `C${col.index + 1}: ${col.name}` : `C${col.index + 1}`;
            const countsMap = {};
            col.data.filter(v => v !== '' && v !== null && v !== undefined).forEach(v => {
                countsMap[v] = (countsMap[v] || 0) + 1;
            });
            const cats = Object.keys(countsMap).slice(0, 8);
            const cnts = cats.map(c => countsMap[c]);
            sessionOutput.appendChartCard(`Gráfico de Setores: ${label}`, (box) => {
                Charts.renderPieChart(box, cats, cnts, `Gráfico de Setores de ${label}`);
            });
            sessionOutput.appendCommandHistory(`PIECHART ${varName}`, new Date().toLocaleTimeString());
            return true;
        });
    }

    function showGenericStatsDialog(title, description, worksheet, sessionOutput, onExecute = null) {
        const colPicker = renderColumnPicker(worksheet, true);
        const bodyHtml = `
            <div class="dialog-col-selector">
                ${colPicker}
                <div style="flex:1;">
                    <div style="margin-bottom:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:4px;">Variáveis Selecionadas:</label>
                        <input type="text" id="diagGenVar" class="form-control" data-multiple="true" placeholder="ex: C1 C2">
                        <small style="color:#666; font-size:11px;">Dê duplo clique na coluna à esquerda para selecionar.</small>
                    </div>
                    <div style="margin-top:14px; padding:10px; background:#f4f6f8; border:1px solid #e1e3e6; border-radius:3px; font-size:11px; color:#444;">
                        <strong>Operação Mytable 22:</strong><br>
                        ${description}
                    </div>
                </div>
            </div>
        `;
        createModalSkeleton(title, bodyHtml, (modal) => {
            const varNames = modal.querySelector("#diagGenVar").value.trim();
            if (!varNames) {
                alert("Por favor, selecione ao menos uma variável.");
                return false;
            }
            if (onExecute) {
                onExecute(varNames, modal);
            } else {
                sessionOutput.appendMessage(`<strong>${title}</strong> executado com sucesso para as variáveis: <code>${varNames}</code>.`);
                sessionOutput.appendCommandHistory(`NOTE Executado ${title} (${varNames})`, new Date().toLocaleTimeString());
            }
            return true;
        });
    }

    function showGraphBuilderDialog(worksheet, sessionOutput) {
        const colPicker = renderColumnPicker(worksheet, true);
        const graphTypes = [
            { id: "scatter", label: "Gráfico de Dispersão", icon: "⁘", desc: "Mapeamento bidimensional X vs Y" },
            { id: "hist", label: "Histograma com Curva Normal", icon: "📊", desc: "Distribuição e frequências com curva gaussiana" },
            { id: "boxplot", label: "Boxplot (Diagrama de Caixas)", icon: "🀫", desc: "Quartis Q1, Q3, mediana e detecção de outliers" },
            { id: "bar", label: "Gráfico de Barras", icon: "📊", desc: "Contagens e frequências por categorias" },
            { id: "timeseries", label: "Série Temporal (TSPlot)", icon: "📈", desc: "Tendência sequencial ao longo do tempo" },
            { id: "pie", label: "Gráfico de Setores (Pizza)", icon: "🥧", desc: "Proporções percentuais de categorias" },
            { id: "pareto", label: "Diagrama de Pareto", icon: "📉", desc: "Defeitos ordenados com curva de 80-20 acumulada" },
            { id: "xbar", label: "Carta de Controle Xbarra-R", icon: "📉", desc: "Limites de controle estatístico de processo (SPC)" },
            { id: "capa", label: "Capacidade do Processo Sixpack", icon: "🎯", desc: "Índices Cp, Cpk, Pp, Ppk e PPM esperado" },
            { id: "interval", label: "Gráfico de Intervalos", icon: "↕️", desc: "Médias e intervalos de confiança de 95%" },
            { id: "area", label: "Gráfico de Área", icon: "⛰️", desc: "Evolução acumulada de valores" },
            { id: "dotplot", label: "Diagrama de Pontos", icon: "⁖", desc: "Pontos agrupados por valor individual" }
        ];

        let graphItemsHtml = graphTypes.map((g, idx) => `
            <div class="graph-builder-type-item ${idx === 0 ? 'selected' : ''}" data-type="${g.id}" style="padding:6px 10px; border-radius:3px; margin-bottom:4px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:8px; ${idx === 0 ? 'background-color:#e5f1fb;' : ''}">
                <span style="font-size:15px;">${g.icon}</span>
                <div>
                    <div style="font-weight:600; color:#222;">${g.label}</div>
                    <div style="font-size:10px; color:#666;">${g.desc}</div>
                </div>
            </div>
        `).join("");

        const bodyHtml = `
            <div style="display:flex; gap:16px; width:680px; max-width:90vw;">
                <!-- Left: Scrollable Graph Gallery Column -->
                <div style="width:230px; display:flex; flex-direction:column;">
                    <label style="font-weight:600; font-size:12px; margin-bottom:6px; color:#333;">Tipos de Gráficos:</label>
                    <div id="builderGraphList" style="flex:1; height:260px; max-height:260px; overflow-y:auto; overflow-x:hidden; border:1px solid #d1d5db; border-radius:3px; padding:4px; background:#fafafa;">
                        ${graphItemsHtml}
                    </div>
                </div>

                <!-- Center: Column Selection -->
                <div style="width:140px; display:flex; flex-direction:column;">
                    <label style="font-weight:600; font-size:12px; margin-bottom:6px; color:#333;">Colunas:</label>
                    ${colPicker}
                </div>

                <!-- Right: Variable Inputs -->
                <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="display:block; font-weight:600; font-size:12px; margin-bottom:4px;" id="builderLblVar1">Variável Y / Primária:</label>
                        <input type="text" id="builderVar1" class="form-control" placeholder="ex: C1">
                    </div>
                    <div>
                        <label style="display:block; font-weight:600; font-size:12px; margin-bottom:4px;" id="builderLblVar2">Variável X (Opcional):</label>
                        <input type="text" id="builderVar2" class="form-control" placeholder="ex: C2">
                    </div>
                    <div id="builderInfoBox" style="margin-top:auto; padding:8px 10px; background:#f0f7fd; border:1px solid #c7e0f4; border-radius:3px; font-size:11px; color:#004e8c;">
                        Selecione o tipo de gráfico à esquerda e indique as colunas para plotagem imediata.
                    </div>
                </div>
            </div>
        `;

        createModalSkeleton("Construtor de Gráficos", bodyHtml, (modal) => {
            const selectedItem = modal.querySelector(".graph-builder-type-item.selected");
            const type = selectedItem ? selectedItem.getAttribute("data-type") : "scatter";
            const v1 = modal.querySelector("#builderVar1").value.trim();
            const v2 = modal.querySelector("#builderVar2").value.trim();

            const col1 = worksheet.getColumnByName(v1);
            const col2 = worksheet.getColumnByName(v2);

            if (!col1 && type !== "dist") {
                alert("Por favor, selecione ao menos uma coluna válida.");
                return false;
            }

            const label1 = col1 ? (col1.name ? `C${col1.index + 1}: ${col1.name}` : `C${col1.index + 1}`) : "";
            const label2 = col2 ? (col2.name ? `C${col2.index + 1}: ${col2.name}` : `C${col2.index + 1}`) : "";

            if (type === "scatter" && col1 && col2) {
                sessionOutput.appendChartCard(`Dispersão: ${label1} vs ${label2}`, (box) => {
                    Charts.renderScatterPlot(box, col2.data, col1.data, `Dispersão de ${label1} vs ${label2}`, label2, label1);
                });
            } else if (type === "boxplot" && col1) {
                sessionOutput.appendChartCard(`Boxplot: ${label1}`, (box) => {
                    Charts.renderBoxplot(box, col1.data, "Boxplot", label1);
                });
            } else if (type === "bar" && col1) {
                const map = {};
                col1.data.filter(v => v !== '').forEach(v => map[v] = (map[v] || 0) + 1);
                sessionOutput.appendChartCard(`Gráfico de Barras: ${label1}`, (box) => {
                    Charts.renderBarChart(box, Object.keys(map), Object.values(map), `Barras de ${label1}`);
                });
            } else if (type === "timeseries" && col1) {
                sessionOutput.appendChartCard(`Séries Temporais: ${label1}`, (box) => {
                    Charts.renderTimeSeries(box, col1.data, `Série Temporal: ${label1}`, label1);
                });
            } else if (type === "pie" && col1) {
                const map = {};
                col1.data.filter(v => v !== '').forEach(v => map[v] = (map[v] || 0) + 1);
                const keys = Object.keys(map).slice(0, 8);
                sessionOutput.appendChartCard(`Gráfico de Setores: ${label1}`, (box) => {
                    Charts.renderPieChart(box, keys, keys.map(k => map[k]), `Setores de ${label1}`);
                });
            } else if (type === "pareto" && col1) {
                const pareto = Statistics.pareto(col1.data);
                sessionOutput.appendChartCard(`Diagrama de Pareto: ${label1}`, (box) => {
                    Charts.renderPareto(box, pareto, `Diagrama de Pareto de ${label1}`);
                });
            } else if (type === "xbar" && col1) {
                const spc = Statistics.xbarR(col1.data, 5);
                sessionOutput.appendChartCard(`Carta Xbarra-R: ${label1}`, (box) => {
                    Charts.renderXbarRChart(box, spc, `Carta Xbarra-R: ${label1}`);
                });
            } else if (type === "capa" && col1) {
                const capa = Statistics.processCapability(col1.data, 5, 20.2, 19.8);
                sessionOutput.appendChartCard(`Capacidade do Processo: ${label1}`, (box) => {
                    Charts.renderProcessCapability(box, capa, `Relatório de Capacidade: ${label1}`);
                });
            } else {
                // Default Histogram
                sessionOutput.appendChartCard(`Histograma: ${label1}`, (box) => {
                    Charts.renderHistogram(box, col1.data, `Histograma de ${label1}`);
                });
            }

            sessionOutput.appendCommandHistory(`NOTE Construtor de Gráficos: ${type} (${v1})`, new Date().toLocaleTimeString());
            return true;
        });

        // Add selection interaction in the modal
        setTimeout(() => {
            const list = document.getElementById("builderGraphList");
            if (list) {
                list.querySelectorAll(".graph-builder-type-item").forEach(item => {
                    item.addEventListener("click", () => {
                        list.querySelectorAll(".graph-builder-type-item").forEach(i => {
                            i.classList.remove("selected");
                            i.style.backgroundColor = "";
                        });
                        item.classList.add("selected");
                        item.style.backgroundColor = "#e5f1fb";
                    });
                });
            }
        }, 30);
    }

    return {
        showDescriptiveStatistics,
        showOneSampleT,
        showTwoSampleT,
        showOneWayAnova,
        showLinearRegression,
        showXbarRChart,
        showProcessCapability,
        showParetoChart,
        showRandomData,
        showScatterPlotDialog,
        showBoxplotDialog,
        showBarChartDialog,
        showTimeSeriesPlotDialog,
        showPieChartDialog,
        showGenericStatsDialog,
        showGraphBuilderDialog,
        showRenameWorksheet,
        showHelpDialog,
        closeModal
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dialogs;
}
