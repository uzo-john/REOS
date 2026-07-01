// ─── jsPDF Dynamic Loader ─────────────────────────────────────────────────────
// We load the UMD build of jsPDF via a dynamic <script> tag to bypass Metro's
// ESM resolver issues with the fast-png transitive dependency.

declare global {
  interface Window {
    jspdf: { jsPDF: any };
  }
}

function loadJsPdf(): Promise<any> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.jspdf && window.jspdf.jsPDF) {
      resolve(window.jspdf.jsPDF);
      return;
    }
    const script = document.createElement('script');
    // Use the CDN UMD build (no external deps, works in all browsers)
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      if (window.jspdf && window.jspdf.jsPDF) {
        resolve(window.jspdf.jsPDF);
      } else {
        reject(new Error('jsPDF UMD did not expose window.jspdf'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
    document.head.appendChild(script);
  });
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PdfDesignData {
  inputs: {
    appliances: { name?: string; powerW: number; quantity: number; hoursOn: number[] }[];
    panelRatingW: number;
    batteryVoltage: number;
    batteryType: 'LITHIUM' | 'LEAD_ACID';
    selectedBatteryAh: number;
    selectedLithiumKwh: number;
    inverterRatingKw: number | null;
    inverterOutputVoltage: '230V' | '400V';
    autonomyDays: number;
    dod: number;
    peakSunHours: number;
    losses: number;
    tempDerating: number;
    safetyMargin: number;
    currentA: number;
    lengthMeters: number;
    cableVoltageV: number;
    areaMm2: number;
    currency: string;
    gridTariffRate: number;
    capexBudget: number;
    optimizationGoals?: string[];
    additionalPvCapacityKw?: number;
    microgridTariff?: number;
    gridAvailabilityHours?: number;
  };
  results: {
    load: { connectedLoadW: number; maximumDemandW: number; dailyEnergyKwh: number; monthlyEnergyKwh: number; annualEnergyKwh: number } | null;
    solar: { requiredPvSizeKw: number; numberOfPanels: number; expectedAnnualGenKwh: number } | null;
    battery: { requiredCapacityKwh: number; requiredCapacityAh: number; batteryQty: number } | null;
    inverter: { recommendedInverterKw: number; safetyMarginUsed: number } | null;
    cable: { voltageDropVolts: number; voltageDropPercent: number; passesCheck: boolean } | null;
  };
}

// ─── Colour palette ───────────────────────────────────────────────────────────
const TEAL   = [0,   168, 150] as [number, number, number];
const DARK   = [18,  24,  38 ] as [number, number, number];
const WHITE  = [255, 255, 255] as [number, number, number];
const GRAY   = [120, 130, 150] as [number, number, number];
const LGRAY  = [235, 238, 243] as [number, number, number];
const GREEN  = [34,  197, 94 ] as [number, number, number];
const ORANGE = [249, 115, 22 ] as [number, number, number];
const RED    = [239, 68,  68 ] as [number, number, number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const currencySymbol = (code: string): string => {
  const map: Record<string, string> = { NGN:'₦', USD:'$', GBP:'£', EUR:'€', ZAR:'R', KES:'KSh', GHS:'₵' };
  return map[code] ?? code;
};
const fmtN = (n: number, dp = 2) => n.toFixed(dp);

function computePvConfig(panels: number, systemVoltage: number, panelVoltage = 24) {
  const inSeries = Math.max(1, Math.round(systemVoltage / panelVoltage));
  const parallelStrings = Math.max(1, Math.ceil(panels / inSeries));
  return { inSeries, parallelStrings, totalPanels: inSeries * parallelStrings };
}

function computeBatteryConfig(type: 'LITHIUM' | 'LEAD_ACID', qty: number, systemVoltage: number) {
  if (type === 'LITHIUM') return { inSeries: 1, parallelStrings: qty };
  const inSeries = Math.max(1, Math.round(systemVoltage / 12));
  const parallelStrings = Math.max(1, Math.ceil(qty / inSeries));
  return { inSeries, parallelStrings };
}

// ─── Drawing helpers ──────────────────────────────────────────────────────────
function drawRect(doc: any, x: number, y: number, w: number, h: number, fill: number[], r = 3) {
  doc.setFillColor(fill[0], fill[1], fill[2]);
  doc.roundedRect(x, y, w, h, r, r, 'F');
}

function sectionHeader(doc: any, text: string, y: number, pageW: number): number {
  drawRect(doc, 14, y, pageW - 28, 9, TEAL);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text(text, 18, y + 6);
  return y + 12;
}

function dataRow(doc: any, label: string, value: string, y: number, shade: boolean, pageW: number, badge?: number[]): number {
  if (shade) {
    drawRect(doc, 14, y, pageW - 28, 7, LGRAY, 1);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  doc.text(label, 18, y + 5);
  if (badge) {
    drawRect(doc, pageW - 50, y + 1, 34, 5, badge, 2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFontSize(8);
    doc.text(value, pageW - 33, y + 5, { align: 'center' });
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
    doc.text(value, pageW - 18, y + 5, { align: 'right' });
  }
  return y + 7;
}

function infoBox(doc: any, title: string, lines: string[], color: number[], y: number, pageW: number): number {
  const h = 8 + lines.length * 7;
  drawRect(doc, 14, y, pageW - 28, h, [color[0], color[1], color[2], 30].slice(0, 3), 3);
  doc.setDrawColor(color[0], color[1], color[2]);
  doc.roundedRect(14, y, pageW - 28, h, 3, 3, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(color[0], color[1], color[2]);
  doc.text(title, 18, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(DARK[0], DARK[1], DARK[2]);
  lines.forEach((line, i) => {
    doc.text(line, 18, y + 13 + i * 7);
  });
  return y + h + 4;
}

// ─── Main PDF Generator (async) ───────────────────────────────────────────────
export async function generateDesignPdf(data: PdfDesignData): Promise<void> {
  const JsPDF = await loadJsPdf();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 0;

  // ── COVER BANNER ──────────────────────────────────────────────────────────
  drawRect(doc, 0, 0, pageW, 42, DARK, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
  doc.text('REOS', 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
  doc.text('RENEWABLE ENERGY OPERATING SYSTEM', 14, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
  doc.text('Solar System Design & Engineering Report', 14, 34);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    pageW - 14, 34, { align: 'right' }
  );
  y = 50;

  // ── SUMMARY CARDS (2 × 2 grid) ────────────────────────────────────────────
  if (data.results.load && data.results.solar && data.results.battery && data.results.inverter) {
    const cardW = (pageW - 28 - 4) / 2;
    const cards = [
      { label: 'SOLAR PV SIZE',      value: `${data.results.solar.requiredPvSizeKw} kWp` },
      { label: 'BATTERY STORAGE',    value: `${data.results.battery.requiredCapacityKwh} kWh` },
      { label: 'INVERTER RATING',    value: `${data.results.inverter.recommendedInverterKw} kW` },
      { label: 'DAILY CONSUMPTION',  value: `${fmtN(data.results.load.dailyEnergyKwh)} kWh/day` },
    ];
    for (let i = 0; i < 4; i += 2) {
      const cx2 = 14 + cardW + 4;
      drawRect(doc, 14, y, cardW, 20, DARK, 4);
      doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text(cards[i].label, 18, y + 8);
      doc.setFontSize(15);
      doc.text(cards[i].value, 18, y + 16);
      if (cards[i + 1]) {
        drawRect(doc, cx2, y, cardW, 20, DARK, 4);
        doc.setTextColor(TEAL[0], TEAL[1], TEAL[2]);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(cards[i + 1].label, cx2 + 4, y + 8);
        doc.setFontSize(15);
        doc.text(cards[i + 1].value, cx2 + 4, y + 16);
      }
      y += 24;
    }
    y += 4;
  }

  // ── SECTION 1: LOAD ASSESSMENT ────────────────────────────────────────────
  y = sectionHeader(doc, '1.  LOAD ASSESSMENT & APPLIANCE INVENTORY', y, pageW);
  const defaultNames = ['LED Lights', 'Ceiling Fans', 'TV / Laptops', 'Microwave / Kettle'];
  data.inputs.appliances.forEach((app, idx) => {
    const name = app.name || defaultNames[idx] || `Appliance ${idx + 1}`;
    const activeHrs = app.hoursOn.filter((h: number) => h > 0).length;
    const dailyKwh = (app.powerW * app.quantity * activeHrs) / 1000;
    y = dataRow(doc, `${app.quantity}× ${name} — ${app.powerW}W each, ${activeHrs}h/day`, `${fmtN(dailyKwh, 3)} kWh/day`, y, idx % 2 === 0, pageW);
  });
  if (data.results.load) {
    y += 2;
    y = dataRow(doc, 'Total Connected Load',       `${data.results.load.connectedLoadW} W`,             y, false, pageW);
    y = dataRow(doc, 'Peak Maximum Demand',         `${fmtN(data.results.load.maximumDemandW, 0)} W`,    y, true,  pageW);
    y = dataRow(doc, 'Daily Energy Consumption',    `${fmtN(data.results.load.dailyEnergyKwh)} kWh`,    y, false, pageW);
    y = dataRow(doc, 'Monthly Energy Consumption',  `${fmtN(data.results.load.monthlyEnergyKwh)} kWh`, y, true,  pageW);
    y = dataRow(doc, 'Annual Energy Consumption',   `${fmtN(data.results.load.annualEnergyKwh, 0)} kWh`, y, false, pageW);
  }
  y += 6;

  // Page break check
  if (y > 230) { doc.addPage(); y = 20; }

  // ── SECTION 2: SOLAR PV ───────────────────────────────────────────────────
  y = sectionHeader(doc, '2.  SOLAR PV ARRAY DESIGN', y, pageW);
  if (data.results.solar) {
    const pv = computePvConfig(data.results.solar.numberOfPanels, data.inputs.batteryVoltage);
    y = dataRow(doc, 'Panel Rating (selected)',     `${data.inputs.panelRatingW} W`,                    y, false, pageW);
    y = dataRow(doc, 'Peak Sun Hours (PSH)',        `${data.inputs.peakSunHours} hrs/day`,              y, true,  pageW);
    y = dataRow(doc, 'System Losses',               `${(data.inputs.losses * 100).toFixed(0)}%`,        y, false, pageW);
    y = dataRow(doc, 'Temperature Derating',        `${(data.inputs.tempDerating * 100).toFixed(0)}%`, y, true,  pageW);
    y = dataRow(doc, 'Required PV Array Size',      `${data.results.solar.requiredPvSizeKw} kWp`,       y, false, pageW);
    y = dataRow(doc, 'Total Number of Panels',      `${data.results.solar.numberOfPanels} panels`,      y, true,  pageW);
    y = dataRow(doc, 'Annual Generation Estimate',  `${data.results.solar.expectedAnnualGenKwh} kWh/yr`, y, false, pageW);
    y += 3;
    y = infoBox(doc, 'PV Array Wiring Configuration', [
      `Panels in Series per String  :  ${pv.inSeries}  (${pv.inSeries} × 24V = ${pv.inSeries * 24}V — matches ${data.inputs.batteryVoltage}V bus)`,
      `Parallel Strings             :  ${pv.parallelStrings}  strings`,
      `Total Array                  :  ${pv.inSeries} S × ${pv.parallelStrings} P = ${pv.totalPanels} panels`,
    ], TEAL, y, pageW);
  }
  y += 4;

  if (y > 230) { doc.addPage(); y = 20; }

  // ── SECTION 3: BATTERY BANK ───────────────────────────────────────────────
  y = sectionHeader(doc, '3.  BATTERY STORAGE BANK DESIGN', y, pageW);
  if (data.results.battery) {
    const bat = computeBatteryConfig(data.inputs.batteryType, data.results.battery.batteryQty, data.inputs.batteryVoltage);
    const unitSpec = data.inputs.batteryType === 'LITHIUM'
      ? `${data.inputs.selectedLithiumKwh} kWh Lithium (LiFePO4)`
      : `12V / ${data.inputs.selectedBatteryAh}Ah Lead-Acid (AGM)`;

    y = dataRow(doc, 'Battery Technology',          data.inputs.batteryType === 'LITHIUM' ? 'Lithium Iron Phosphate (LiFePO4)' : 'Lead-Acid (AGM/VRLA)', y, false, pageW);
    y = dataRow(doc, 'Unit Specification',          unitSpec,                                                y, true,  pageW);
    y = dataRow(doc, 'System Bus Voltage',          `${data.inputs.batteryVoltage} V DC`,                   y, false, pageW);
    y = dataRow(doc, 'Autonomy Period',             `${data.inputs.autonomyDays} day(s)`,                   y, true,  pageW);
    y = dataRow(doc, 'Max Depth of Discharge',      `${(data.inputs.dod * 100).toFixed(0)}%`,               y, false, pageW);
    y = dataRow(doc, 'Required Storage Capacity',   `${data.results.battery.requiredCapacityKwh} kWh`,      y, true,  pageW);
    y = dataRow(doc, 'Required Capacity (Ah)',       `${fmtN(data.results.battery.requiredCapacityAh, 1)} Ah @ ${data.inputs.batteryVoltage}V`, y, false, pageW);
    y = dataRow(doc, 'Total Battery Units',         `${data.results.battery.batteryQty} units`,              y, true,  pageW);
    y += 3;

    const batLines = data.inputs.batteryType === 'LEAD_ACID' ? [
      `Units in Series per String   :  ${bat.inSeries}  (${bat.inSeries} × 12V = ${bat.inSeries * 12}V — matches ${data.inputs.batteryVoltage}V bus)`,
      `Parallel Strings             :  ${bat.parallelStrings}  strings`,
      `Total Bank                   :  ${bat.inSeries} S × ${bat.parallelStrings} P = ${data.results.battery.batteryQty} units`,
    ] : [
      `Lithium Modules in Parallel  :  ${bat.parallelStrings}  modules (each at ${data.inputs.batteryVoltage}V system voltage)`,
      `Total Bank Capacity          :  ${(bat.parallelStrings * data.inputs.selectedLithiumKwh).toFixed(2)} kWh`,
    ];
    y = infoBox(doc, 'Battery Bank Wiring Configuration', batLines, [37, 99, 235], y, pageW);
  }
  y += 4;

  if (y > 230) { doc.addPage(); y = 20; }

  // ── SECTION 4: INVERTER ───────────────────────────────────────────────────
  y = sectionHeader(doc, '4.  INVERTER & CHARGE CONTROLLER SIZING', y, pageW);
  if (data.results.inverter) {
    y = dataRow(doc, 'Sizing Method',              data.inputs.inverterRatingKw ? 'Manual Override' : 'Auto-Calculated', y, false, pageW);
    y = dataRow(doc, 'Recommended Inverter Rating', `${data.results.inverter.recommendedInverterKw} kW`, y, true,  pageW);
    y = dataRow(doc, 'DC Input Voltage',           `${data.inputs.batteryVoltage} V DC`,                 y, false, pageW);
    y = dataRow(doc, 'AC Output Voltage',          `${data.inputs.inverterOutputVoltage} AC`,             y, true,  pageW);
    y = dataRow(doc, 'Output Phase',               data.inputs.inverterOutputVoltage === '400V' ? 'Three-Phase (3φ)' : 'Single-Phase (1φ)', y, false, pageW);
    y = dataRow(doc, 'Waveform Type',             'Pure Sine Wave',                                        y, true,  pageW);
    y = dataRow(doc, 'Safety Margin Applied',      `×${data.results.inverter.safetyMarginUsed.toFixed(2)}`, y, false, pageW);
    y += 3;
    y = infoBox(doc, '⚠  Grid-Tie Compliance Note', [
      'Inverter must include anti-islanding protection (IEEE 1547 / IEC 62116).',
      'Grid Export requires approval from the local DisCo (Distribution Company).',
    ], ORANGE, y, pageW);
  }
  y += 4;

  if (y > 230) { doc.addPage(); y = 20; }

  // ── SECTION 5: CABLE COORDINATION ────────────────────────────────────────
  y = sectionHeader(doc, '5.  CABLE COORDINATION & VOLTAGE DROP (IEC 60364)', y, pageW);
  if (data.results.cable) {
    const pass = data.results.cable.passesCheck;
    y = dataRow(doc, 'Design Current',         `${data.inputs.currentA} A`,                      y, false, pageW);
    y = dataRow(doc, 'Cable Run Length',       `${data.inputs.lengthMeters} m`,                   y, true,  pageW);
    y = dataRow(doc, 'System Voltage',         `${data.inputs.cableVoltageV} V`,                  y, false, pageW);
    y = dataRow(doc, 'Cable Cross-Section',    `${data.inputs.areaMm2} mm²`,                      y, true,  pageW);
    y = dataRow(doc, 'Voltage Drop (Volts)',   `${data.results.cable.voltageDropVolts} V`,         y, false, pageW);
    y = dataRow(doc, 'Voltage Drop (%)',       `${data.results.cable.voltageDropPercent}%`,        y, true,  pageW);
    y = dataRow(doc, 'IEC 60364 Compliance',  pass ? 'PASS ✓' : 'FAIL ✗', y, false, pageW, pass ? GREEN : RED);
  }
  y += 6;

  if (y > 230) { doc.addPage(); y = 20; }

  // ── SECTION 6: FINANCIAL SUMMARY ──────────────────────────────────────────
  y = sectionHeader(doc, '6.  FINANCIAL & ROI SUMMARY', y, pageW);
  const sym = currencySymbol(data.inputs.currency);
  const dailyGen = data.results.solar ? data.results.solar.expectedAnnualGenKwh / 365 : 0;
  const dailyUse = data.results.load  ? data.results.load.dailyEnergyKwh : 0;
  const tariff   = data.inputs.gridTariffRate;
  const capex    = data.inputs.capexBudget;
  const monthlyGridBill   = dailyUse * 30 * tariff;
  const monthlyImportBill = Math.max(0, dailyUse - dailyGen) * 30 * tariff;
  const monthlyExportRev  = Math.max(0, dailyGen - dailyUse) * 30 * tariff;
  const netMonthly        = (monthlyGridBill - monthlyImportBill) + monthlyExportRev;
  const paybackYrs        = netMonthly > 0 ? capex / (netMonthly * 12) : 0;
  const savings25         = netMonthly > 0 ? netMonthly * 12 * 25 - capex : 0;

  const fmtMoney = (n: number) => n >= 1_000_000 ? `${sym}${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `${sym}${(n/1_000).toFixed(1)}k` : `${sym}${n.toFixed(2)}`;

  y = dataRow(doc, 'Currency',                       data.inputs.currency,                        y, false, pageW);
  y = dataRow(doc, 'Grid Tariff Rate',               `${sym}${tariff}/kWh`,                        y, true,  pageW);
  y = dataRow(doc, 'System Investment (CAPEX)',      fmtMoney(capex),                              y, false, pageW);
  y = dataRow(doc, 'Monthly Bill (Grid Only)',        `${fmtMoney(monthlyGridBill)}/mo`,            y, true,  pageW);
  y = dataRow(doc, 'Monthly Bill (With Solar)',       `${fmtMoney(monthlyImportBill)}/mo`,          y, false, pageW);
  y = dataRow(doc, 'Monthly Grid Export Revenue',    `+ ${fmtMoney(monthlyExportRev)}/mo`,          y, true,  pageW);
  y = dataRow(doc, 'Net Monthly Savings / Benefit',  fmtMoney(netMonthly),                         y, false, pageW);
  y = dataRow(doc, 'Simple Payback Period',          paybackYrs > 0 ? `${paybackYrs.toFixed(1)} years` : 'N/A', y, true, pageW);
  y = dataRow(doc, '25-Year Net Savings (NPV est.)', savings25 > 0 ? fmtMoney(savings25) : 'N/A', y, false, pageW);
  y += 6;

  // ── SECTION 7: ENERGY GOAL OPTIMIZATION & SURPLUS SIZING ───────────────────
  if (data.inputs.optimizationGoals && data.inputs.optimizationGoals.length > 0 && !data.inputs.optimizationGoals.includes('MEET_DEMAND')) {
    if (y > 200) { doc.addPage(); y = 20; }
    y = sectionHeader(doc, '7.  ENERGY GOAL OPTIMIZATION & SURPLUS SIZING', y, pageW);
    
    y = dataRow(doc, 'Selected Objectives', data.inputs.optimizationGoals.map(g => g.replace('_', ' ')).join(', '), y, false, pageW);
    
    if (data.inputs.additionalPvCapacityKw && data.inputs.additionalPvCapacityKw > 0) {
      const addedPv = data.inputs.additionalPvCapacityKw;
      const basePv = data.results.solar ? data.results.solar.requiredPvSizeKw : 0;
      const totalPv = basePv + addedPv;
      const costPerKwp = basePv > 0 ? capex / basePv : 500000;
      const addedCapex = addedPv * costPerKwp;
      const optimizedCapex = capex + addedCapex;

      const dailyGenKwh = totalPv * data.inputs.peakSunHours * (1 - data.inputs.losses) * data.inputs.tempDerating;
      const batteryChargingKwh = data.results.battery ? (data.results.battery.requiredCapacityKwh * data.inputs.dod / 0.95) : 0;
      const dailySurplusKwh = Math.max(0, dailyGenKwh - dailyUse - batteryChargingKwh);
      const realDailyExportKwh = dailySurplusKwh * 0.95 * (Math.min(24, data.inputs.gridAvailabilityHours || 24) / 24);
      const annualExportIncome = realDailyExportKwh * tariff * 365;

      y = dataRow(doc, 'Additional PV Sized', `${addedPv.toFixed(2)} kWp`, y, true, pageW);
      y = dataRow(doc, 'Total Optimized PV Sizing', `${totalPv.toFixed(2)} kWp`, y, false, pageW);
      y = dataRow(doc, 'Base Capex vs. Optimized Capex', `${fmtMoney(capex)} vs. ${fmtMoney(optimizedCapex)}`, y, true, pageW);
      y = dataRow(doc, 'Expected Daily Generation', `${dailyGenKwh.toFixed(1)} kWh`, y, false, pageW);
      y = dataRow(doc, 'Net Daily Tradeable Surplus', `${dailySurplusKwh.toFixed(1)} kWh`, y, true, pageW);
      
      if (data.inputs.optimizationGoals.includes('SELL_GRID')) {
        y = dataRow(doc, 'Expected Daily Grid Export', `${realDailyExportKwh.toFixed(1)} kWh`, y, false, pageW);
        y = dataRow(doc, 'Projected Annual Export Revenue', `+ ${fmtMoney(annualExportIncome)}/yr`, y, true, pageW, GREEN);
      }
      if (data.inputs.optimizationGoals.includes('SELL_NEIGHBORS')) {
        const neighborKwh = realDailyExportKwh * 0.6;
        const neighborTariff = data.inputs.microgridTariff || 180;
        const neighborAnnualRevenue = neighborKwh * neighborTariff * 365;
        y = dataRow(doc, 'Neighbor P2P Trading Rate', `${sym}${neighborTariff}/kWh`, y, false, pageW);
        y = dataRow(doc, 'Neighbor Microgrid Annual Revenue', `+ ${fmtMoney(neighborAnnualRevenue)}/yr`, y, true, pageW, GREEN);
      }
    } else {
      y = dataRow(doc, 'Surplus Sizing Options', 'Meet base load only. No additional PV sizing configured.', y, true, pageW);
    }
    y += 4;
    y = infoBox(doc, '🤖 Sizing Optimization Recommendation Note', [
      'Selling surplus solar power can reduce payback periods and generate microgrid credits.',
      'Always ensure grid sync capabilities comply with IEEE 1547 disconnect thresholds.',
    ], TEAL, y, pageW);
    y += 4;
  }

  // ── FOOTER on every page ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const pH = doc.internal.pageSize.getHeight();
    drawRect(doc, 0, pH - 12, pageW, 12, DARK, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('REOS – Renewable Energy Operating System  |  Auto-generated engineering report. Not a substitute for a site survey.', 14, pH - 4);
    doc.text(`Page ${p} of ${totalPages}`, pageW - 14, pH - 4, { align: 'right' });
  }

  doc.save(`REOS_Solar_Design_${new Date().toISOString().slice(0, 10)}.pdf`);
}
