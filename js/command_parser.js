/**
 * Minitable 22 - Session Language Command Interpreter & CLI Engine
 * Parses and executes native Minitab session language syntax.
 */

const CommandParser = (() => {
    const Stats = typeof Statistics !== 'undefined' ? Statistics : (typeof require !== 'undefined' ? require('./statistics.js') : null);
    const ChartRenderer = typeof Charts !== 'undefined' ? Charts : (typeof require !== 'undefined' ? require('./charts.js') : null);

    function tokenize(cmdString) {
        // Strip trailing dot or semicolon and tokenize into main command and subcommands
        const clean = cmdString.trim().replace(/\.$/, '');
        const parts = clean.split(';').map(p => p.trim()).filter(Boolean);
        if (parts.length === 0) return null;

        const mainTokens = parts[0].split(/\s+/);
        const mainCommand = mainTokens[0].toUpperCase();
        const mainArgs = mainTokens.slice(1);

        const subcommands = {};
        for (let i = 1; i < parts.length; i++) {
            const subTokens = parts[i].split(/\s+/);
            const subName = subTokens[0].toUpperCase();
            const subArgs = subTokens.slice(1);
            subcommands[subName] = subArgs;
        }

        return { mainCommand, mainArgs, subcommands };
    }

    function resolveColumn(worksheet, colRef) {
        if (!colRef) return null;
        const ref = colRef.trim();
        // Match C1, C2, etc.
        const cMatch = ref.match(/^C(\d+)$/i);
        if (cMatch) {
            const idx = parseInt(cMatch[1], 10) - 1;
            return worksheet.getColumn(idx);
        }
        // Match column name enclosed in quotes or direct name
        const nameMatch = ref.replace(/^['"]|['"]$/g, '');
        return worksheet.getColumnByName(nameMatch);
    }

    function execute(commandLine, worksheet, sessionOutput, chartContainer) {
        const parsed = tokenize(commandLine);
        if (!parsed) return;

        const { mainCommand, mainArgs, subcommands } = parsed;
        const timestamp = new Date().toLocaleTimeString();

        sessionOutput.appendCommandHistory(`MTB > ${commandLine}`, timestamp);

        try {
            switch (mainCommand) {
                case 'DESCRIBE':
                case 'DESC': {
                    if (mainArgs.length === 0) {
                        throw new Error("Syntax: DESCRIBE C1 [C2...]; [MEAN]; [STDEV]; [VARIANCE]; [MEDIAN].");
                    }
                    const cols = mainArgs.map(arg => {
                        const col = resolveColumn(worksheet, arg);
                        if (!col) throw new Error(`Column ${arg} not found.`);
                        return col;
                    });

                    const results = cols.map(col => Stats.describe(col.data, col.name || `C${col.index + 1}`));
                    sessionOutput.appendDescriptiveStatistics(results);
                    break;
                }

                case 'SET': {
                    // SET C1 10 20 30 40 50 END.
                    if (mainArgs.length < 1) throw new Error("Syntax: SET C1 <val1> <val2> ... [END]");
                    const targetCol = resolveColumn(worksheet, mainArgs[0]);
                    if (!targetCol) throw new Error(`Column ${mainArgs[0]} not found.`);
                    const rawVals = mainArgs.slice(1).filter(v => v.toUpperCase() !== 'END');
                    worksheet.setColumnData(targetCol.index, rawVals);
                    sessionOutput.appendMessage(`Set ${rawVals.length} values into Column ${targetCol.name || 'C' + (targetCol.index + 1)}.`);
                    break;
                }

                case 'RANDOM': {
                    // RANDOM 100 C1; NORMAL 50 10.
                    const count = parseInt(mainArgs[0], 10) || 50;
                    const targetCol = resolveColumn(worksheet, mainArgs[1]);
                    if (!targetCol) throw new Error(`Target column ${mainArgs[1]} not found.`);

                    let generated = [];
                    if (subcommands['NORMAL']) {
                        const mu = parseFloat(subcommands['NORMAL'][0]) || 0;
                        const sigma = parseFloat(subcommands['NORMAL'][1]) || 1;
                        generated = Stats.randomNormal(count, mu, sigma);
                    } else if (subcommands['UNIFORM']) {
                        const min = parseFloat(subcommands['UNIFORM'][0]) || 0;
                        const max = parseFloat(subcommands['UNIFORM'][1]) || 100;
                        generated = Stats.randomUniform(count, min, max);
                    } else {
                        // Default standard normal
                        generated = Stats.randomNormal(count, 0, 1);
                    }

                    worksheet.setColumnData(targetCol.index, generated);
                    sessionOutput.appendMessage(`Generated ${count} random values in Column ${targetCol.name || 'C' + (targetCol.index + 1)}.`);
                    break;
                }

                case 'REGRESS': {
                    // REGRESS C2 = C1.
                    const eqString = mainArgs.join(' ');
                    const parts = eqString.split('=').map(p => p.trim());
                    if (parts.length !== 2) throw new Error("Syntax: REGRESS C2 = C1.");
                    const yCol = resolveColumn(worksheet, parts[0]);
                    const xCol = resolveColumn(worksheet, parts[1]);
                    if (!yCol || !xCol) throw new Error("Could not resolve regression variables.");

                    const reg = Stats.linearRegression(xCol.data, yCol.data);
                    sessionOutput.appendRegression(reg, yCol.name || `C${yCol.index + 1}`, xCol.name || `C${xCol.index + 1}`);
                    Charts.renderFittedLinePlot(chartContainer, reg, `Fitted Line Plot: ${yCol.name} vs ${xCol.name}`);
                    break;
                }

                case 'ANOVA':
                case 'ONEWAY': {
                    // ONEWAY C2 = C1. (Response = Factor)
                    const eqString = mainArgs.join(' ');
                    const parts = eqString.split('=').map(p => p.trim());
                    if (parts.length !== 2) throw new Error("Syntax: ONEWAY Response = Factor.");
                    const respCol = resolveColumn(worksheet, parts[0]);
                    const factorCol = resolveColumn(worksheet, parts[1]);
                    if (!respCol || !factorCol) throw new Error("Could not resolve ANOVA columns.");

                    // Group response data by factor
                    const groupMap = new Map();
                    for (let i = 0; i < respCol.data.length; i++) {
                        const factorVal = String(factorCol.data[i] || '').trim();
                        const respVal = Number(respCol.data[i]);
                        if (factorVal && !isNaN(respVal)) {
                            if (!groupMap.has(factorVal)) groupMap.set(factorVal, []);
                            groupMap.get(factorVal).push(respVal);
                        }
                    }

                    const groups = Array.from(groupMap.entries()).map(([name, data]) => ({ name, data }));
                    const anovaResult = Stats.oneWayAnova(groups);
                    sessionOutput.appendAnova(anovaResult, respCol.name, factorCol.name);
                    break;
                }

                case 'CAPA': {
                    // CAPA C1 5; LSL 10; USL 30; TARGET 20.
                    const col = resolveColumn(worksheet, mainArgs[0]);
                    if (!col) throw new Error(`Column ${mainArgs[0]} not found.`);
                    const subSize = parseInt(mainArgs[1], 10) || 1;

                    const lsl = subcommands['LSL'] ? parseFloat(subcommands['LSL'][0]) : null;
                    const usl = subcommands['USL'] ? parseFloat(subcommands['USL'][0]) : null;
                    const target = subcommands['TARGET'] ? parseFloat(subcommands['TARGET'][0]) : null;

                    const capa = Stats.processCapability(col.data, lsl, usl, target, subSize);
                    sessionOutput.appendProcessCapability(capa, col.name || `C${col.index + 1}`);
                    Charts.renderProcessCapability(chartContainer, capa, `Process Capability: ${col.name || 'C' + (col.index + 1)}`);
                    break;
                }

                case 'XBAR': {
                    // XBAR C1 5.
                    const col = resolveColumn(worksheet, mainArgs[0]);
                    if (!col) throw new Error(`Column ${mainArgs[0]} not found.`);
                    const subSize = parseInt(mainArgs[1], 10) || 5;

                    const spc = Stats.xbarRChart(col.data, subSize);
                    sessionOutput.appendXbarR(spc, col.name || `C${col.index + 1}`);
                    Charts.renderXbarRChart(chartContainer, spc, `Xbar-R Chart: ${col.name || 'C' + (col.index + 1)}`);
                    break;
                }

                case 'IMR': {
                    // IMR C1.
                    const col = resolveColumn(worksheet, mainArgs[0]);
                    if (!col) throw new Error(`Column ${mainArgs[0]} not found.`);

                    const spc = Stats.imrChart(col.data);
                    sessionOutput.appendImr(spc, col.name || `C${col.index + 1}`);
                    break;
                }

                case 'PARETO': {
                    // PARETO C1 [C2].
                    const catCol = resolveColumn(worksheet, mainArgs[0]);
                    if (!catCol) throw new Error(`Category column ${mainArgs[0]} not found.`);
                    const freqCol = mainArgs[1] ? resolveColumn(worksheet, mainArgs[1]) : null;

                    const pareto = Stats.paretoAnalysis(catCol.data, freqCol ? freqCol.data : null);
                    sessionOutput.appendPareto(pareto, catCol.name || `C${catCol.index + 1}`);
                    Charts.renderPareto(chartContainer, pareto, `Pareto Chart of ${catCol.name || 'C' + (catCol.index + 1)}`);
                    break;
                }

                case 'NAME': {
                    // NAME C1 'Diameter'
                    const col = resolveColumn(worksheet, mainArgs[0]);
                    if (!col) throw new Error(`Column ${mainArgs[0]} not found.`);
                    const newName = mainArgs.slice(1).join(' ').replace(/^['"]|['"]$/g, '');
                    worksheet.setColumnName(col.index, newName);
                    sessionOutput.appendMessage(`Renamed C${col.index + 1} to '${newName}'.`);
                    break;
                }

                case 'CLEAR': {
                    sessionOutput.clear();
                    break;
                }

                case 'HELP': {
                    sessionOutput.appendHelp();
                    break;
                }

                default:
                    throw new Error(`Comando Mytable desconhecido '${mainCommand}'. Digite HELP. para ver a lista de comandos suportados.`);
            }
        } catch (err) {
            sessionOutput.appendError(err.message);
        }
    }

    return {
        execute,
        tokenize
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CommandParser;
}
