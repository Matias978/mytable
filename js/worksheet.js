/**
 * Minitable 22 - Interactive Worksheet Data Grid
 * Replicates the Minitab Objective Grid spreadsheet experience.
 */

class Worksheet {
    constructor(numCols = 15, numRows = 40) {
        this.columns = [];
        this.numRows = numRows;
        this.activeCell = { row: 0, col: 0 };
        this.listeners = [];

        for (let i = 0; i < numCols; i++) {
            this.columns.push({
                index: i,
                name: '',
                type: 'Numeric',
                data: Array(numRows).fill('')
            });
        }
    }

    onChange(fn) {
        this.listeners.push(fn);
    }

    notify() {
        this.listeners.forEach(fn => fn());
    }

    getColumn(index) {
        return this.columns[index] || null;
    }

    getColumnByName(name) {
        const lower = name.toLowerCase().trim();
        return this.columns.find(c => (c.name && c.name.toLowerCase().trim() === lower) || `c${c.index + 1}` === lower) || null;
    }

    getNumericColumns() {
        return this.columns.filter(c => {
            const valid = Statistics.filterNumeric(c.data);
            return valid.length > 0;
        });
    }

    getAllNamedColumns() {
        return this.columns.map(c => ({
            index: c.index,
            label: c.name ? `C${c.index + 1}: ${c.name}` : `C${c.index + 1}`,
            name: c.name || `C${c.index + 1}`,
            type: c.type
        }));
    }

    setColumnName(index, name) {
        if (this.columns[index]) {
            this.columns[index].name = name;
            this.notify();
        }
    }

    setColumnData(index, dataArray) {
        while (this.columns.length <= index) {
            this.addColumn();
        }
        const col = this.columns[index];
        col.data = [...dataArray];
        // Ensure minimum rows
        while (col.data.length < this.numRows) {
            col.data.push('');
        }
        if (col.data.length > this.numRows) {
            this.numRows = col.data.length;
            this.alignAllColumns();
        }
        this.inferType(col);
        this.notify();
    }

    setCellValue(row, col, value) {
        while (this.columns.length <= col) {
            this.addColumn();
        }
        while (row >= this.numRows) {
            this.addRow();
        }
        this.columns[col].data[row] = value;
        this.inferType(this.columns[col]);
        this.notify();
    }

    getCellValue(row, col) {
        if (this.columns[col] && this.columns[col].data[row] !== undefined) {
            return this.columns[col].data[row];
        }
        return '';
    }

    addColumn(name = '') {
        const newIdx = this.columns.length;
        this.columns.push({
            index: newIdx,
            name: name,
            type: 'Numeric',
            data: Array(this.numRows).fill('')
        });
        this.notify();
        return this.columns[newIdx];
    }

    addRow() {
        this.numRows++;
        this.columns.forEach(col => col.data.push(''));
        this.notify();
    }

    alignAllColumns() {
        this.columns.forEach(c => {
            while (c.data.length < this.numRows) c.data.push('');
        });
    }

    inferType(col) {
        let numericCount = 0, textCount = 0;
        col.data.forEach(val => {
            if (val === '' || val === null || val === undefined || val === '*') return;
            if (!isNaN(Number(val))) {
                numericCount++;
            } else {
                textCount++;
            }
        });
        col.type = textCount > 0 ? 'Text' : 'Numeric';
    }

    loadSampleDataset(datasetKey) {
        switch (datasetKey) {
            case 'quality_control': {
                // Manufacturing Part Diameter with specifications: LSL=19.80, Target=20.00, USL=20.20
                this.columns[0].name = 'Diameter_mm';
                this.columns[1].name = 'Subgroup';
                this.columns[2].name = 'Operator';

                const diameters = [
                    20.02, 19.98, 20.05, 20.01, 19.99,
                    20.08, 20.03, 19.96, 20.02, 20.04,
                    19.95, 20.01, 19.99, 20.07, 20.02,
                    20.12, 20.09, 20.04, 20.06, 20.08,
                    19.97, 19.94, 20.00, 20.02, 19.99,
                    20.03, 20.01, 20.05, 20.06, 20.02,
                    20.18, 20.15, 20.12, 20.10, 20.14, // shift for control chart demo
                    20.01, 19.99, 20.04, 20.02, 20.00
                ];

                const subgroups = [];
                for (let i = 0; i < diameters.length; i++) {
                    subgroups.push(Math.floor(i / 5) + 1);
                }

                const operators = diameters.map((_, i) => (i % 2 === 0 ? 'Op_A' : 'Op_B'));

                this.setColumnData(0, diameters);
                this.setColumnData(1, subgroups);
                this.setColumnData(2, operators);
                break;
            }

            case 'defects_pareto': {
                this.columns[0].name = 'Defect_Type';
                this.columns[1].name = 'Frequency';

                const categories = [
                    'Scratch Surface', 'Misalignment', 'Dimensional Error',
                    'Contamination', 'Solder Bridge', 'Cracked Housing',
                    'Label Missing', 'Other'
                ];
                const frequencies = [142, 89, 54, 32, 19, 11, 7, 4];

                this.setColumnData(0, categories);
                this.setColumnData(1, frequencies);
                break;
            }

            case 'sales_advertising': {
                this.columns[0].name = 'Ad_Budget_k$';
                this.columns[1].name = 'Revenue_k$';
                this.columns[2].name = 'Region';

                const ads = [12, 15, 20, 24, 28, 35, 40, 45, 52, 60, 68, 75, 82, 90, 100];
                const revs = [45, 54, 68, 78, 86, 102, 115, 128, 145, 162, 184, 198, 215, 238, 260];
                const regions = ['North', 'South', 'East', 'West', 'North', 'South', 'East', 'West', 'North', 'South', 'East', 'West', 'North', 'South', 'East'];

                this.setColumnData(0, ads);
                this.setColumnData(1, revs);
                this.setColumnData(2, regions);
                break;
            }
        }
        this.notify();
    }

    exportToCsv() {
        const rows = [];
        // Header
        const header = this.columns.map(c => `"${c.name || 'C' + (c.index + 1)}"`);
        rows.push(header.join(','));

        for (let r = 0; r < this.numRows; r++) {
            let hasData = false;
            const rowVals = this.columns.map(c => {
                const val = c.data[r] !== undefined ? String(c.data[r]) : '';
                if (val !== '') hasData = true;
                return `"${val.replace(/"/g, '""')}"`;
            });
            if (hasData) rows.push(rowVals.join(','));
        }
        return rows.join('\r\n');
    }

    importFromCsv(csvText) {
        const lines = csvText.trim().split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0) return;

        // Parse CSV lines handling quoted values
        function parseLine(line) {
            const result = [];
            let cur = '', inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (ch === ',' && !inQuotes) {
                    result.push(cur.trim());
                    cur = '';
                } else {
                    cur += ch;
                }
            }
            result.push(cur.trim());
            return result;
        }

        const headers = parseLine(lines[0]);
        const numCols = headers.length;
        const colData = Array.from({ length: numCols }, () => []);

        for (let r = 1; r < lines.length; r++) {
            const vals = parseLine(lines[r]);
            for (let c = 0; c < numCols; c++) {
                colData[c].push(vals[c] !== undefined ? vals[c] : '');
            }
        }

        // Apply to worksheet
        for (let c = 0; c < numCols; c++) {
            while (this.columns.length <= c) this.addColumn();
            this.columns[c].name = headers[c];
            this.setColumnData(c, colData[c]);
        }
        this.notify();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Worksheet;
}
