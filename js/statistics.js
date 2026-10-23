/**
 * Minitable 22 - Core Statistical & Mathematical Computation Engine
 * Reverse engineered from Minitab 22 business rules, algorithms, and models.
 */

const Statistics = (() => {

    // Helper: filter valid numeric values (omit null, undefined, NaN, empty strings, Minitab '*')
    function filterNumeric(arr) {
        if (!Array.isArray(arr)) return [];
        return arr
            .map(v => (typeof v === 'string' ? (v.trim() === '*' ? NaN : Number(v)) : Number(v)))
            .filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v));
    }

    // SPC Factor constants for subgroup sizes n = 2..25
    const SPC_FACTORS = {
        2:  { A2: 1.880, d2: 1.128, D3: 0,     D4: 3.267 },
        3:  { A2: 1.023, d2: 1.693, D3: 0,     D4: 2.574 },
        4:  { A2: 0.729, d2: 2.059, D3: 0,     D4: 2.282 },
        5:  { A2: 0.577, d2: 2.326, D3: 0,     D4: 2.114 },
        6:  { A2: 0.483, d2: 2.534, D3: 0,     D4: 2.004 },
        7:  { A2: 0.419, d2: 2.704, D3: 0.076, D4: 1.924 },
        8:  { A2: 0.373, d2: 2.847, D3: 0.136, D4: 1.864 },
        9:  { A2: 0.337, d2: 2.970, D3: 0.184, D4: 1.816 },
        10: { A2: 0.308, d2: 3.078, D3: 0.223, D4: 1.777 },
        11: { A2: 0.285, d2: 3.173, D3: 0.256, D4: 1.744 },
        12: { A2: 0.266, d2: 3.258, D3: 0.283, D4: 1.717 },
        15: { A2: 0.223, d2: 3.472, D3: 0.347, D4: 1.653 },
        20: { A2: 0.180, d2: 3.735, D3: 0.415, D4: 1.585 },
        25: { A2: 0.153, d2: 3.931, D3: 0.459, D4: 1.541 }
    };

    function getSpcFactor(n) {
        if (SPC_FACTORS[n]) return SPC_FACTORS[n];
        if (n < 2) return { A2: 0, d2: 1, D3: 0, D4: 0 };
        // Approximate for other sizes
        const d2 = 3.931 + 0.03 * (n - 25);
        const A2 = 3 / (d2 * Math.sqrt(n));
        return { A2, d2, D3: 0.46, D4: 1.54 };
    }

    // Error function approximation
    function erf(x) {
        const sign = x >= 0 ? 1 : -1;
        x = Math.abs(x);
        const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429;
        const p = 0.3275911;
        const t = 1.0 / (1.0 + p * x);
        const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
        return sign * y;
    }

    // Standard Normal CDF: P(Z <= z)
    function normalCdf(z, mean = 0, stdev = 1) {
        if (stdev <= 0) return z >= mean ? 1 : 0;
        const x = (z - mean) / stdev;
        return 0.5 * (1.0 + erf(x / Math.SQRT2));
    }

    // Inverse Normal CDF (Quantile) using Beasley-Springer-Moro rational approximation
    function invNormalCdf(p) {
        if (p <= 0) return -Infinity;
        if (p >= 1) return Infinity;
        if (p === 0.5) return 0;

        const a = [
            -3.969683028665376e+01,  2.209460984245205e+02,
            -2.759285104469687e+02,  1.383577518672690e+02,
            -3.066479806614716e+01,  2.506628277459239e+00
        ];
        const b = [
            -5.447609879822406e+01,  1.615858368580409e+02,
            -1.556989798598866e+02,  6.680131188771972e+01,
            -1.328068155288572e+01
        ];
        const c = [
            -7.784894002430293e-03, -3.223964580411365e-01,
            -2.400758277161838e+00, -2.549732539343734e+00,
             4.374664141464968e+00,  2.938163982698783e+00
        ];
        const d = [
             7.784695709041462e-03,  3.224671290700398e-01,
             2.445134137142996e+00,  3.754408661907416e+00
        ];

        const q = p - 0.5;
        if (Math.abs(q) <= 0.42) {
            const r = q * q;
            return q * (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) /
                       (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1.0);
        }

        const r = q < 0 ? p : 1.0 - p;
        const s = Math.log(-Math.log(r));
        let x = c[0] + s * (c[1] + s * (c[2] + s * (c[3] + s * (c[4] + s * c[5]))));
        x = x / (1.0 + s * (d[0] + s * (d[1] + s * (d[2] + s * d[3]))));
        return q < 0 ? -x : x;
    }

    // Incomplete beta function approximation for Student-t and F CDF
    function logGamma(x) {
        const coef = [
            76.18009172947146, -86.50532032941677, 24.01409824083091,
            -1.231739572450155, 0.001208650973866179, -0.000005395239384953
        ];
        let y = x, tmp = x + 5.5;
        tmp -= (x + 0.5) * Math.log(tmp);
        let ser = 1.000000000190015;
        for (let j = 0; j <= 5; j++) ser += coef[j] / ++y;
        return -tmp + Math.log(2.5066282746310005 * ser / x);
    }

    function betaInc(a, b, x) {
        if (x <= 0) return 0;
        if (x >= 1) return 1;

        const bt = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1.0 - x));
        if (x < (a + 1.0) / (a + b + 2.0)) {
            return bt * betaContinuedFraction(a, b, x) / a;
        } else {
            return 1.0 - bt * betaContinuedFraction(b, a, 1.0 - x) / b;
        }
    }

    function betaContinuedFraction(a, b, x) {
        const maxIter = 100, eps = 3.0e-7;
        const qab = a + b, qap = a + 1.0, qam = a - 1.0;
        let c = 1.0, d = 1.0 - qab * x / qap;
        if (Math.abs(d) < 1.0e-30) d = 1.0e-30;
        d = 1.0 / d;
        let h = d;

        for (let m = 1; m <= maxIter; m++) {
            const m2 = 2 * m;
            let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
            d = 1.0 + aa * d;
            if (Math.abs(d) < 1.0e-30) d = 1.0e-30;
            c = 1.0 + aa / c;
            if (Math.abs(c) < 1.0e-30) c = 1.0e-30;
            d = 1.0 / d;
            h *= d * c;
            aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
            d = 1.0 + aa * d;
            if (Math.abs(d) < 1.0e-30) d = 1.0e-30;
            c = 1.0 + aa / c;
            if (Math.abs(c) < 1.0e-30) c = 1.0e-30;
            d = 1.0 / d;
            const del = d * c;
            h *= del;
            if (Math.abs(del - 1.0) < eps) break;
        }
        return h;
    }

    // Student t CDF: P(T <= t) with df degrees of freedom
    function studentTCdf(t, df) {
        if (df <= 0) return NaN;
        const x = df / (df + t * t);
        const p = 0.5 * betaInc(0.5 * df, 0.5, x);
        return t >= 0 ? 1.0 - p : p;
    }

    // Inverse Student t (t-critical value for given two-tailed alpha)
    function invStudentT(p, df) {
        // Newton-Raphson approximation from normal quantile
        let z = invNormalCdf(p);
        let t = z + (z * z * z + z) / (4 * df);
        for (let i = 0; i < 5; i++) {
            const pDiff = studentTCdf(t, df) - p;
            const pdf = Math.exp(logGamma((df + 1) / 2) - logGamma(df / 2)) /
                        (Math.sqrt(df * Math.PI) * Math.pow(1 + (t * t) / df, (df + 1) / 2));
            if (pdf === 0) break;
            t = t - pDiff / pdf;
        }
        return t;
    }

    // Fisher F CDF: P(F <= f) with df1, df2
    function fisherFCdf(f, df1, df2) {
        if (f <= 0 || df1 <= 0 || df2 <= 0) return 0;
        const x = (df1 * f) / (df1 * f + df2);
        return betaInc(0.5 * df1, 0.5 * df2, x);
    }

    // ------------------------------------------------------------------------
    // Basic Descriptive Statistics
    // ------------------------------------------------------------------------
    function describe(rawArr, colName = 'Data') {
        const data = filterNumeric(rawArr);
        const totalRaw = Array.isArray(rawArr) ? rawArr.length : 0;
        const n = data.length;
        const nMissing = totalRaw - n;

        if (n === 0) {
            return {
                colName, n: 0, nMissing, mean: NaN, seMean: NaN, stdev: NaN,
                variance: NaN, coefVar: NaN, min: NaN, q1: NaN, median: NaN,
                q3: NaN, max: NaN, iqr: NaN, skewness: NaN, kurtosis: NaN, sum: NaN
            };
        }

        const sorted = [...data].sort((a, b) => a - b);
        const sum = data.reduce((acc, v) => acc + v, 0);
        const mean = sum / n;

        // Variance & StDev (sample based n - 1)
        let sumSqDiff = 0, sumCubeDiff = 0, sumQuadDiff = 0;
        for (let i = 0; i < n; i++) {
            const diff = data[i] - mean;
            sumSqDiff += diff * diff;
            sumCubeDiff += diff * diff * diff;
            sumQuadDiff += diff * diff * diff * diff;
        }

        const variance = n > 1 ? sumSqDiff / (n - 1) : 0;
        const stdev = Math.sqrt(variance);
        const seMean = stdev / Math.sqrt(n);
        const coefVar = mean !== 0 ? (stdev / mean) * 100 : NaN;

        // Quartiles (Minitab interpolation method)
        function getPercentile(arr, p) {
            if (arr.length === 1) return arr[0];
            const idx = (p / 100) * (arr.length + 1) - 1;
            if (idx <= 0) return arr[0];
            if (idx >= arr.length - 1) return arr[arr.length - 1];
            const lower = Math.floor(idx);
            const frac = idx - lower;
            return arr[lower] + frac * (arr[lower + 1] - arr[lower]);
        }

        const q1 = getPercentile(sorted, 25);
        const median = getPercentile(sorted, 50);
        const q3 = getPercentile(sorted, 75);
        const iqr = q3 - q1;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];

        // Skewness and Kurtosis
        let skewness = NaN, kurtosis = NaN;
        if (n >= 3 && stdev > 0) {
            const m3 = sumCubeDiff / n;
            const m2 = sumSqDiff / n;
            skewness = (m3 / Math.pow(m2, 1.5)) * Math.sqrt(n * (n - 1)) / (n - 2);
        }
        if (n >= 4 && stdev > 0) {
            const m4 = sumQuadDiff / n;
            const m2 = sumSqDiff / n;
            kurtosis = ((m4 / (m2 * m2)) - 3) * (n - 1) / ((n - 2) * (n - 3));
        }

        return {
            colName,
            n,
            nMissing,
            mean,
            seMean,
            stdev,
            variance,
            coefVar,
            min,
            q1,
            median,
            q3,
            max,
            iqr,
            skewness,
            kurtosis,
            sum
        };
    }

    // ------------------------------------------------------------------------
    // Hypothesis Testing: 1-Sample t
    // ------------------------------------------------------------------------
    function oneSampleT(data, mu0 = 0, confLevel = 0.95, alternative = 'not_equal') {
        const stats = describe(data);
        if (stats.n < 2 || stats.stdev === 0) {
            throw new Error("One-Sample t requires at least 2 data points with non-zero variance.");
        }

        const df = stats.n - 1;
        const tStat = (stats.mean - mu0) / stats.seMean;
        let pValue = 0;

        if (alternative === 'greater') {
            pValue = 1.0 - studentTCdf(tStat, df);
        } else if (alternative === 'less') {
            pValue = studentTCdf(tStat, df);
        } else {
            // two-tailed
            pValue = 2.0 * (1.0 - studentTCdf(Math.abs(tStat), df));
        }

        const alpha = 1.0 - confLevel;
        const tCrit = invStudentT(1.0 - alpha / 2.0, df);
        const margin = tCrit * stats.seMean;
        const ciLower = stats.mean - margin;
        const ciUpper = stats.mean + margin;

        return {
            testName: "One-Sample t-Test",
            mu0,
            n: stats.n,
            mean: stats.mean,
            stdev: stats.stdev,
            seMean: stats.seMean,
            tStat,
            df,
            pValue,
            confLevel: confLevel * 100,
            ciLower,
            ciUpper,
            alternative
        };
    }

    // ------------------------------------------------------------------------
    // Hypothesis Testing: 2-Sample t (Equal or Unequal Variances)
    // ------------------------------------------------------------------------
    function twoSampleT(sample1, sample2, equalVariances = false, confLevel = 0.95) {
        const s1 = describe(sample1);
        const s2 = describe(sample2);

        if (s1.n < 2 || s2.n < 2) {
            throw new Error("Two-Sample t requires at least 2 observations in each sample.");
        }

        const diff = s1.mean - s2.mean;
        let seDiff = 0, df = 0, pooledStdev = null;

        if (equalVariances) {
            const spSq = ((s1.n - 1) * s1.variance + (s2.n - 1) * s2.variance) / (s1.n + s2.n - 2);
            pooledStdev = Math.sqrt(spSq);
            seDiff = pooledStdev * Math.sqrt(1 / s1.n + 1 / s2.n);
            df = s1.n + s2.n - 2;
        } else {
            // Welch-Satterthwaite approximation
            const v1 = s1.variance / s1.n;
            const v2 = s2.variance / s2.n;
            seDiff = Math.sqrt(v1 + v2);
            df = Math.pow(v1 + v2, 2) / (Math.pow(v1, 2) / (s1.n - 1) + Math.pow(v2, 2) / (s2.n - 1));
        }

        const tStat = seDiff > 0 ? diff / seDiff : 0;
        const pValue = 2.0 * (1.0 - studentTCdf(Math.abs(tStat), df));
        const alpha = 1.0 - confLevel;
        const tCrit = invStudentT(1.0 - alpha / 2.0, Math.floor(df));
        const margin = tCrit * seDiff;

        return {
            testName: "Two-Sample t-Test",
            s1,
            s2,
            difference: diff,
            seDiff,
            pooledStdev,
            tStat,
            df: Math.round(df * 10) / 10,
            pValue,
            confLevel: confLevel * 100,
            ciLower: diff - margin,
            ciUpper: diff + margin,
            equalVariances
        };
    }

    // ------------------------------------------------------------------------
    // One-Way ANOVA (Analysis of Variance)
    // ------------------------------------------------------------------------
    function oneWayAnova(groups) {
        // groups is an array of objects: { name: 'Group 1', data: [...] }
        const cleanedGroups = groups.map(g => ({
            name: g.name,
            stats: describe(g.data)
        })).filter(g => g.stats.n > 0);

        const k = cleanedGroups.length;
        if (k < 2) throw new Error("One-Way ANOVA requires at least 2 distinct groups.");

        let totalN = 0, grandSum = 0;
        cleanedGroups.forEach(g => {
            totalN += g.stats.n;
            grandSum += g.stats.sum;
        });

        const grandMean = grandSum / totalN;

        // Sum of Squares
        let ssFactor = 0, ssError = 0;
        cleanedGroups.forEach(g => {
            ssFactor += g.stats.n * Math.pow(g.stats.mean - grandMean, 2);
            ssError += (g.stats.n - 1) * g.stats.variance;
        });

        const ssTotal = ssFactor + ssError;
        const dfFactor = k - 1;
        const dfError = totalN - k;
        const dfTotal = totalN - 1;

        const msFactor = ssFactor / dfFactor;
        const msError = ssError / dfError;
        const fStat = msError > 0 ? msFactor / msError : 0;
        const pValue = 1.0 - fisherFCdf(fStat, dfFactor, dfError);

        const rSq = (ssFactor / ssTotal) * 100;
        const rSqAdj = (1.0 - (msError / (ssTotal / dfTotal))) * 100;
        const pooledStdev = Math.sqrt(msError);

        // Calculate 95% CI for each group using pooled stdev
        const tCrit = invStudentT(0.975, dfError);
        cleanedGroups.forEach(g => {
            const margin = tCrit * (pooledStdev / Math.sqrt(g.stats.n));
            g.ciLower = g.stats.mean - margin;
            g.ciUpper = g.stats.mean + margin;
        });

        return {
            groups: cleanedGroups,
            k,
            totalN,
            grandMean,
            anovaTable: {
                factor: { source: 'Factor', df: dfFactor, ss: ssFactor, ms: msFactor, f: fStat, p: pValue },
                error:  { source: 'Error',  df: dfError,  ss: ssError,  ms: msError },
                total:  { source: 'Total',  df: dfTotal,  ss: ssTotal }
            },
            modelSummary: {
                s: pooledStdev,
                rSq,
                rSqAdj: Math.max(0, rSqAdj)
            }
        };
    }

    // ------------------------------------------------------------------------
    // Linear Regression (Ordinary Least Squares)
    // ------------------------------------------------------------------------
    function linearRegression(xRaw, yRaw) {
        const xFiltered = [];
        const yFiltered = [];
        const nTotal = Math.min(xRaw.length, yRaw.length);

        for (let i = 0; i < nTotal; i++) {
            const vx = Number(xRaw[i]);
            const vy = Number(yRaw[i]);
            if (!isNaN(vx) && isFinite(vx) && !isNaN(vy) && isFinite(vy)) {
                xFiltered.push(vx);
                yFiltered.push(vy);
            }
        }

        const n = xFiltered.length;
        if (n < 3) throw new Error("Regression requires at least 3 valid (X, Y) observation pairs.");

        const meanX = xFiltered.reduce((a, b) => a + b, 0) / n;
        const meanY = yFiltered.reduce((a, b) => a + b, 0) / n;

        let sxx = 0, sxy = 0, syy = 0;
        for (let i = 0; i < n; i++) {
            const dx = xFiltered[i] - meanX;
            const dy = yFiltered[i] - meanY;
            sxx += dx * dx;
            sxy += dx * dy;
            syy += dy * dy;
        }

        if (sxx === 0) throw new Error("Predictor X has zero variance.");

        const slope = sxy / sxx;
        const intercept = meanY - slope * meanX;

        // Residuals and SS
        let ssRes = 0;
        const fitted = [];
        const residuals = [];
        for (let i = 0; i < n; i++) {
            const yHat = intercept + slope * xFiltered[i];
            const res = yFiltered[i] - yHat;
            fitted.push(yHat);
            residuals.push(res);
            ssRes += res * res;
        }

        const ssReg = syy - ssRes;
        const dfReg = 1;
        const dfRes = n - 2;
        const dfTotal = n - 1;

        const msReg = ssReg / dfReg;
        const msRes = ssRes / dfRes;
        const s = Math.sqrt(msRes);
        const fStat = msRes > 0 ? msReg / msRes : 0;
        const pValueAnova = 1.0 - fisherFCdf(fStat, dfReg, dfRes);

        const rSq = (ssReg / syy) * 100;
        const rSqAdj = (1.0 - ((ssRes / dfRes) / (syy / dfTotal))) * 100;

        // Coefficient statistics
        const seSlope = s / Math.sqrt(sxx);
        const seIntercept = s * Math.sqrt(1 / n + (meanX * meanX) / sxx);

        const tSlope = seSlope > 0 ? slope / seSlope : 0;
        const tIntercept = seIntercept > 0 ? intercept / seIntercept : 0;

        const pSlope = 2.0 * (1.0 - studentTCdf(Math.abs(tSlope), dfRes));
        const pIntercept = 2.0 * (1.0 - studentTCdf(Math.abs(tIntercept), dfRes));

        return {
            n,
            intercept,
            slope,
            equation: `Y = ${intercept >= 0 ? '' : '-'}${Math.abs(intercept).toFixed(4)} ${slope >= 0 ? '+' : '-'} ${Math.abs(slope).toFixed(4)} X`,
            coefficients: [
                { term: 'Constant', coef: intercept, seCoef: seIntercept, t: tIntercept, p: pIntercept },
                { term: 'X',        coef: slope,     seCoef: seSlope,     t: tSlope,     p: pSlope }
            ],
            modelSummary: {
                s,
                rSq,
                rSqAdj: Math.max(0, rSqAdj)
            },
            anovaTable: {
                regression: { source: 'Regression', df: dfReg,   ss: ssReg, ms: msReg, f: fStat, p: pValueAnova },
                residual:   { source: 'Error',      df: dfRes,   ss: ssRes, ms: msRes },
                total:      { source: 'Total',      df: dfTotal, ss: syy }
            },
            fitted,
            residuals,
            x: xFiltered,
            y: yFiltered
        };
    }

    // ------------------------------------------------------------------------
    // Statistical Process Control: Xbar-R Chart
    // ------------------------------------------------------------------------
    function xbarRChart(rawArr, subgroupSize = 5) {
        const data = filterNumeric(rawArr);
        if (data.length < subgroupSize * 2) {
            throw new Error(`Xbar-R chart requires at least ${subgroupSize * 2} observations (${subgroupSize} per subgroup).`);
        }

        const factors = getSpcFactor(subgroupSize);
        const numSubgroups = Math.floor(data.length / subgroupSize);
        const subgroups = [];
        const xbars = [];
        const ranges = [];

        for (let i = 0; i < numSubgroups; i++) {
            const sub = data.slice(i * subgroupSize, (i + 1) * subgroupSize);
            const sum = sub.reduce((a, b) => a + b, 0);
            const mean = sum / subgroupSize;
            const min = Math.min(...sub);
            const max = Math.max(...sub);
            const r = max - min;

            subgroups.push(sub);
            xbars.push(mean);
            ranges.push(r);
        }

        const grandMean = xbars.reduce((a, b) => a + b, 0) / numSubgroups;
        const avgRange = ranges.reduce((a, b) => a + b, 0) / numSubgroups;

        // Control Limits
        const xbarUcl = grandMean + factors.A2 * avgRange;
        const xbarLcl = grandMean - factors.A2 * avgRange;

        const rUcl = factors.D4 * avgRange;
        const rLcl = factors.D3 * avgRange;

        // Detect out of control points (Nelson Rule 1: Point beyond UCL/LCL)
        const xbarViolations = [];
        xbars.forEach((val, idx) => {
            if (val > xbarUcl || val < xbarLcl) {
                xbarViolations.push(idx + 1);
            }
        });

        const rViolations = [];
        ranges.forEach((val, idx) => {
            if (val > rUcl || val < rLcl) {
                rViolations.push(idx + 1);
            }
        });

        return {
            subgroupSize,
            numSubgroups,
            factors,
            xbar: {
                centerLine: grandMean,
                ucl: xbarUcl,
                lcl: xbarLcl,
                values: xbars,
                violations: xbarViolations
            },
            r: {
                centerLine: avgRange,
                ucl: rUcl,
                lcl: rLcl,
                values: ranges,
                violations: rViolations
            }
        };
    }

    // ------------------------------------------------------------------------
    // Statistical Process Control: I-MR Chart (Individuals & Moving Range)
    // ------------------------------------------------------------------------
    function imrChart(rawArr) {
        const data = filterNumeric(rawArr);
        const n = data.length;
        if (n < 4) throw new Error("I-MR chart requires at least 4 individual data points.");

        const mr = [];
        for (let i = 1; i < n; i++) {
            mr.push(Math.abs(data[i] - data[i - 1]));
        }

        const meanI = data.reduce((a, b) => a + b, 0) / n;
        const meanMR = mr.reduce((a, b) => a + b, 0) / mr.length;

        // Limits for Individuals: 2.66 * MR_bar (since d2=1.128, 3/d2 = 2.66)
        const iUcl = meanI + 2.66 * meanMR;
        const iLcl = meanI - 2.66 * meanMR;

        // Limits for Moving Range (D4 = 3.267)
        const mrUcl = 3.267 * meanMR;
        const mrLcl = 0;

        const iViolations = [];
        data.forEach((val, idx) => {
            if (val > iUcl || val < iLcl) iViolations.push(idx + 1);
        });

        const mrViolations = [];
        mr.forEach((val, idx) => {
            if (val > mrUcl) mrViolations.push(idx + 2); // 1-indexed at second point
        });

        return {
            n,
            individuals: {
                centerLine: meanI,
                ucl: iUcl,
                lcl: iLcl,
                values: data,
                violations: iViolations
            },
            movingRange: {
                centerLine: meanMR,
                ucl: mrUcl,
                lcl: mrLcl,
                values: mr,
                violations: mrViolations
            }
        };
    }

    // ------------------------------------------------------------------------
    // Process Capability Analysis (Normal)
    // ------------------------------------------------------------------------
    function processCapability(rawArr, lsl = null, usl = null, target = null, subgroupSize = 1) {
        const data = filterNumeric(rawArr);
        if (data.length < 5) throw new Error("Process capability analysis requires at least 5 observations.");
        if (lsl === null && usl === null) throw new Error("Must specify at least one specification limit (LSL or USL).");

        const stats = describe(data);
        const mean = stats.mean;
        const overallStDev = stats.stdev;

        // Within StDev estimation
        let withinStDev = overallStDev;
        if (subgroupSize > 1) {
            const factors = getSpcFactor(subgroupSize);
            const numSubs = Math.floor(data.length / subgroupSize);
            let sumR = 0;
            for (let i = 0; i < numSubs; i++) {
                const sub = data.slice(i * subgroupSize, (i + 1) * subgroupSize);
                sumR += Math.max(...sub) - Math.min(...sub);
            }
            withinStDev = (sumR / numSubs) / factors.d2;
        } else {
            // Use Average Moving Range / d2 (d2 = 1.128)
            let sumMR = 0;
            for (let i = 1; i < data.length; i++) {
                sumMR += Math.abs(data[i] - data[i - 1]);
            }
            const avgMR = sumMR / (data.length - 1);
            withinStDev = avgMR / 1.128;
        }

        // Potential Capability (Cp, Cpk)
        let cp = null, cpl = null, cpu = null, cpk = null;
        if (lsl !== null && usl !== null) {
            cp = (usl - lsl) / (6 * withinStDev);
        }
        if (lsl !== null) {
            cpl = (mean - lsl) / (3 * withinStDev);
        }
        if (usl !== null) {
            cpu = (usl - mean) / (3 * withinStDev);
        }
        if (cpl !== null && cpu !== null) {
            cpk = Math.min(cpl, cpu);
        } else {
            cpk = cpl !== null ? cpl : cpu;
        }

        // Overall Capability (Pp, Ppk)
        let pp = null, ppl = null, ppu = null, ppk = null;
        if (lsl !== null && usl !== null) {
            pp = (usl - lsl) / (6 * overallStDev);
        }
        if (lsl !== null) {
            ppl = (mean - lsl) / (3 * overallStDev);
        }
        if (usl !== null) {
            ppu = (usl - mean) / (3 * overallStDev);
        }
        if (ppl !== null && ppu !== null) {
            ppk = Math.min(ppl, ppu);
        } else {
            ppk = ppl !== null ? ppl : ppu;
        }

        // Parts Per Million (PPM) expected under normal distribution
        let ppmBelowLsl = 0, ppmAboveUsl = 0;
        if (lsl !== null) {
            const zLsl = (lsl - mean) / withinStDev;
            ppmBelowLsl = normalCdf(zLsl) * 1e6;
        }
        if (usl !== null) {
            const zUsl = (usl - mean) / withinStDev;
            ppmAboveUsl = (1.0 - normalCdf(zUsl)) * 1e6;
        }
        const ppmTotalExpected = ppmBelowLsl + ppmAboveUsl;

        // Observed PPM
        let countBelow = 0, countAbove = 0;
        data.forEach(v => {
            if (lsl !== null && v < lsl) countBelow++;
            if (usl !== null && v > usl) countAbove++;
        });
        const ppmObserved = ((countBelow + countAbove) / data.length) * 1e6;

        return {
            n: data.length,
            mean,
            lsl,
            usl,
            target,
            stdevWithin: withinStDev,
            stdevOverall: overallStDev,
            cp,
            cpk,
            cpl,
            cpu,
            pp,
            ppk,
            ppl,
            ppu,
            ppmExpected: {
                belowLsl: Math.round(ppmBelowLsl),
                aboveUsl: Math.round(ppmAboveUsl),
                total: Math.round(ppmTotalExpected)
            },
            ppmObserved: Math.round(ppmObserved),
            data
        };
    }

    // ------------------------------------------------------------------------
    // Pareto Analysis
    // ------------------------------------------------------------------------
    function paretoAnalysis(categoriesRaw, countsRaw = null) {
        if (!Array.isArray(categoriesRaw) || categoriesRaw.length === 0) {
            throw new Error("Pareto Chart requires categories.");
        }

        const map = new Map();
        for (let i = 0; i < categoriesRaw.length; i++) {
            const cat = String(categoriesRaw[i] || '').trim();
            if (!cat) continue;
            const count = countsRaw ? Math.max(0, Number(countsRaw[i]) || 0) : 1;
            map.set(cat, (map.get(cat) || 0) + count);
        }

        const sorted = Array.from(map.entries())
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        const totalCount = sorted.reduce((sum, item) => sum + item.count, 0);
        if (totalCount === 0) throw new Error("Total counts in Pareto analysis cannot be zero.");

        let runningSum = 0;
        sorted.forEach(item => {
            runningSum += item.count;
            item.percent = (item.count / totalCount) * 100;
            item.cumCount = runningSum;
            item.cumPercent = (runningSum / totalCount) * 100;
        });

        return {
            totalCount,
            items: sorted
        };
    }

    // ------------------------------------------------------------------------
    // Random Data Generators
    // ------------------------------------------------------------------------
    function randomNormal(n = 50, mean = 0, stdev = 1) {
        const result = [];
        for (let i = 0; i < n; i += 2) {
            let u1 = 0, u2 = 0;
            while (u1 === 0) u1 = Math.random();
            while (u2 === 0) u2 = Math.random();
            const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            const z1 = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2);
            result.push(mean + z0 * stdev);
            if (result.length < n) result.push(mean + z1 * stdev);
        }
        return result.map(v => Math.round(v * 1000) / 1000);
    }

    function randomUniform(n = 50, min = 0, max = 100) {
        const result = [];
        for (let i = 0; i < n; i++) {
            result.push(Math.round((min + Math.random() * (max - min)) * 1000) / 1000);
        }
        return result;
    }

    return {
        filterNumeric,
        describe,
        oneSampleT,
        twoSampleT,
        oneWayAnova,
        linearRegression,
        xbarRChart,
        imrChart,
        processCapability,
        paretoAnalysis,
        randomNormal,
        randomUniform,
        normalCdf,
        invNormalCdf,
        studentTCdf,
        invStudentT,
        fisherFCdf
    };
})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Statistics;
}
