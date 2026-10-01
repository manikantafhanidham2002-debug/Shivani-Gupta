/* ==========================================================================
   EXPORT JOURNEY RISK PREDICTOR — LOGIC & DATA
   TradeBridge India · 16-Factor Pre-Shipment Risk Intelligence
   ========================================================================== */

(function () {
  'use strict';

  // ── EMBEDDED INDICATIVE DATA ──────────────────────────────────────────
  const DUMMY = {
    fx: { USD: 83.5, EUR: 91.2, GBP: 106.4, AED: 22.7, JPY: 0.56, SGD: 62.1 },
    fx_change: { USD: -1.8, EUR: +2.1, GBP: +1.4, AED: -1.8, JPY: +3.2, SGD: +0.9 },
    duty: {
      UAE: { default: 5, textiles: 5, pharma: 0, food: 5, engineering: 5 },
      USA: { default: 3.5, textiles: 12, pharma: 0, food: 5, engineering: 3.5 },
      UK: { default: 4, textiles: 12, pharma: 0, food: 5, engineering: 4 },
      Germany: { default: 3.7, textiles: 12, pharma: 0, food: 9, engineering: 3.7 },
      'Saudi Arabia': { default: 5, textiles: 5, pharma: 0, food: 5, engineering: 5 },
      Singapore: { default: 0, textiles: 0, pharma: 0, food: 0, engineering: 0 },
      Bangladesh: { default: 15, textiles: 12, pharma: 10, food: 15, engineering: 15 },
      China: { default: 8, textiles: 10, pharma: 6, food: 12, engineering: 8 },
      Australia: { default: 5, textiles: 10, pharma: 0, food: 5, engineering: 5 },
      Netherlands: { default: 3.7, textiles: 12, pharma: 0, food: 9, engineering: 3.7 },
      Japan: { default: 3.9, textiles: 10, pharma: 0, food: 8, engineering: 3.9 },
      Canada: { default: 6, textiles: 18, pharma: 0, food: 8, engineering: 6 },
    },
    freight_rate: { Sea: 45, Air: 320, Road: 28, Rail: 18 },
    insurance_rate: { full: 0.25, partial: 0.15, none: 0 },
    transit: {
      Sea: { UAE: 7, USA: 28, UK: 22, Germany: 25, 'Saudi Arabia': 8, Singapore: 14, Bangladesh: 10, China: 18, Australia: 20, Netherlands: 24, Japan: 22, Canada: 30 },
      Air: { UAE: 1, USA: 2, UK: 2, Germany: 2, 'Saudi Arabia': 2, Singapore: 1, Bangladesh: 1, China: 2, Australia: 2, Netherlands: 2, Japan: 2, Canada: 3 },
      Road: { Bangladesh: 4, China: 12 },
      Rail: { Bangladesh: 5, China: 14, Germany: 18, Netherlands: 18 },
    },
    geo_risk: { UAE: 52, USA: 22, UK: 20, Germany: 18, 'Saudi Arabia': 60, Singapore: 15, Bangladesh: 45, China: 65, Australia: 14, Netherlands: 16, Japan: 18, Canada: 18 },
    route_alerts: {
      UAE: { alert: true, msg: 'Active IMO advisory: Strait of Hormuz / Gulf corridor. Elevated merchant vessel risk as of Sep 2026.', severity: 'high' },
      'Saudi Arabia': { alert: true, msg: 'Active maritime advisory: Red Sea / Bab-el-Mandeb. Rerouting via Cape of Good Hope adds ~12 days.', severity: 'high' },
      China: { alert: true, msg: 'Elevated trade-tension environment. US-China tariff spillovers may affect buyer demand. Monitor quarterly.', severity: 'medium' },
    },
    port_congestion: {
      UAE: { score: 62, hours: 18 }, USA: { score: 45, hours: 12 }, UK: { score: 38, hours: 8 },
      Germany: { score: 35, hours: 7 }, 'Saudi Arabia': { score: 55, hours: 16 }, Singapore: { score: 40, hours: 9 },
      Bangladesh: { score: 72, hours: 28 }, China: { score: 58, hours: 20 }, Australia: { score: 42, hours: 10 },
      Netherlands: { score: 30, hours: 6 }, Japan: { score: 25, hours: 5 }, Canada: { score: 44, hours: 11 },
    },
    payment_risk: { Advance: 2, LC: 8, DA: 18, DA90: 28, Open: 42 },
    demand_growth: {
      APEDA: { UAE: 8, USA: 6, UK: 5, Germany: 4, 'Saudi Arabia': 9, Singapore: 7, Bangladesh: 10, China: 3, Australia: 5, Netherlands: 4, Japan: 6, Canada: 5 },
      EEPC: { UAE: 6, USA: 7, UK: 5, Germany: 6, 'Saudi Arabia': 5, Singapore: 8, Bangladesh: 8, China: 2, Australia: 4, Netherlands: 5, Japan: 4, Canada: 6 },
      Pharma: { UAE: 11, USA: 8, UK: 7, Germany: 7, 'Saudi Arabia': 10, Singapore: 9, Bangladesh: 12, China: 6, Australia: 8, Netherlands: 7, Japan: 5, Canada: 7 },
      Textiles: { UAE: 5, USA: 6, UK: 5, Germany: 4, 'Saudi Arabia': 6, Singapore: 4, Bangladesh: 8, China: 2, Australia: 5, Netherlands: 5, Japan: 4, Canada: 5 },
      IT: { UAE: 15, USA: 18, UK: 12, Germany: 11, 'Saudi Arabia': 14, Singapore: 16, Bangladesh: 10, China: 8, Australia: 13, Netherlands: 12, Japan: 9, Canada: 14 },
    },
    price_competitiveness: { APEDA: -12, EEPC: -8, CLE: -15, Pharma: -18, Textiles: -10, Gems: -5, Chemicals: -7, IT: -22, Other: -8 },
    supplier_reliability: { APEDA: 84, EEPC: 91, CLE: 88, Pharma: 94, Textiles: 86, Gems: 92, Chemicals: 89, IT: 96, Other: 85 },
    india_market_share: {
      EEPC: { UAE: 12, USA: 8, UK: 7, Germany: 5, 'Saudi Arabia': 10, Singapore: 9, Bangladesh: 20, China: 3, Australia: 6, Netherlands: 5, Japan: 4, Canada: 7 },
      Pharma: { UAE: 28, USA: 22, UK: 18, Germany: 14, 'Saudi Arabia': 32, Singapore: 20, Bangladesh: 38, China: 8, Australia: 16, Netherlands: 14, Japan: 10, Canada: 18 },
      IT: { UAE: 30, USA: 25, UK: 22, Germany: 18, 'Saudi Arabia': 28, Singapore: 32, Bangladesh: 20, China: 10, Australia: 22, Netherlands: 20, Japan: 14, Canada: 22 },
    },
  };

  // ── SECTOR MAPPING ────────────────────────────────────────────────────
  function sectorToDutyKey(epc) {
    const m = { APEDA: 'food', EEPC: 'engineering', CLE: 'default', Pharma: 'pharma', Textiles: 'textiles', Gems: 'default', Chemicals: 'default', IT: 'default', Other: 'default' };
    return m[epc] || 'default';
  }

  function sectorToDemandKey(epc) {
    if (DUMMY.demand_growth[epc]) return epc;
    if (epc === 'CLE' || epc === 'Gems' || epc === 'Chemicals' || epc === 'Other') return 'EEPC';
    return 'EEPC';
  }

  function paymentToRiskKey(method) {
    if (!method) return 'Open';
    if (method.includes('Advance') || method.includes('TT')) return 'Advance';
    if (method.includes('Letter')) return 'LC';
    if (method.includes('Documents against payment')) return 'DA';
    if (method.includes('DA 60') || method.includes('DA 90')) return 'DA90';
    return 'Open';
  }

  function insuranceToKey(ins) {
    if (!ins) return 'none';
    if (ins.includes('Full')) return 'full';
    if (ins.includes('Partial')) return 'partial';
    return 'none';
  }

  // ── FORMATTING HELPERS ────────────────────────────────────────────────
  const fmt = (n) => new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n);
  const fmtINR = (n) => '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

  // ── COMPUTE 16 FACTORS ────────────────────────────────────────────────
  function computeFactors(inp) {
    const currency = inp.currency || 'USD';
    const dest = inp.destination || 'UAE';
    const epc = inp.epc || 'EEPC';
    const mode = inp.mode || 'Sea';
    const value = parseFloat(inp.value) || 0;
    const weight = parseFloat(inp.weight) || 0;
    const costINR = parseFloat(inp.costOfProduction) || 0;
    const insStatus = insuranceToKey(inp.insurance);
    const payKey = paymentToRiskKey(inp.paymentMethod);
    const dutyKey = sectorToDutyKey(epc);
    const demandKey = sectorToDemandKey(epc);

    // 1. Exchange rate
    const fxRate = DUMMY.fx[currency] || 83.5;
    const valueINR = value * fxRate;

    // 2. Currency impact
    const fxChangePercent = DUMMY.fx_change[currency] || 0;
    const currencyImpact = valueINR * (fxChangePercent / 100);

    // 3. Export profit margin
    const profitMargin = costINR > 0 ? ((valueINR - costINR) / valueINR) * 100 : 0;

    // 5. Customs duty
    const dutyPercent = (DUMMY.duty[dest] && DUMMY.duty[dest][dutyKey] !== undefined) ? DUMMY.duty[dest][dutyKey] : (DUMMY.duty[dest] ? DUMMY.duty[dest].default : 5);
    const dutyINR = valueINR * (dutyPercent / 100);

    // 6. Freight cost
    let freightINR;
    if (weight > 0) {
      freightINR = weight * (DUMMY.freight_rate[mode] || 45);
    } else {
      freightINR = valueINR * 0.06;
    }

    // 7. Insurance cost
    const insRate = DUMMY.insurance_rate[insStatus] || 0;
    const insINR = valueINR * (insRate / 100);

    // 4. Landed cost
    const landedCost = valueINR + freightINR + insINR + dutyINR;

    // 8. Transit time
    const transitDays = (DUMMY.transit[mode] && DUMMY.transit[mode][dest]) || null;

    // 9. Delay risk
    let delayRiskDays = 0;
    if (transitDays !== null && inp.dispatchDate && inp.deadline) {
      const dispatch = new Date(inp.dispatchDate);
      const deadline = new Date(inp.deadline);
      const bufferDays = Math.floor((deadline - dispatch) / (1000 * 60 * 60 * 24));
      delayRiskDays = Math.max(0, transitDays - bufferDays);
    }

    // 10. Tariff impact
    const tariffImpact = dutyPercent;

    // 11. Payment risk
    const paymentRisk = DUMMY.payment_risk[payKey] || 10;

    // 12. Demand growth
    const demandGrowth = (DUMMY.demand_growth[demandKey] && DUMMY.demand_growth[demandKey][dest]) || 5;

    // 13. Price competitiveness
    const priceComp = DUMMY.price_competitiveness[epc] || -8;

    // 14. Supplier reliability
    const suppReliability = DUMMY.supplier_reliability[epc] || 85;

    // 15. Port congestion
    const portCong = DUMMY.port_congestion[dest] || { score: 40, hours: 10 };

    // 16. Geopolitical risk
    const geoRisk = DUMMY.geo_risk[dest] || 30;

    return {
      fxRate, currency, fxChangePercent, currencyImpact, valueINR,
      profitMargin, landedCost, dutyPercent, dutyINR,
      freightINR, insRate, insINR, transitDays, delayRiskDays,
      tariffImpact, paymentRisk, demandGrowth, priceComp,
      suppReliability, portCong, geoRisk,
      costINR, mode, dest, epc, weight
    };
  }

  // ── COMPUTE OVERALL RISK SCORE ────────────────────────────────────────
  function computeRiskScore(f, inp) {
    const dims = {};

    // Exchange rate pressure (12%)
    dims.exchangeRate = Math.max(0, Math.min(100, 50 - (f.fxChangePercent * 10)));

    // Trade compliance (14%)
    const lic = inp.licenceStatus || '';
    if (lic.includes('Pending')) dims.tradeCompliance = 45;
    else if (lic.includes('Unsure') || lic.includes('Not assessed')) dims.tradeCompliance = 60;
    else if (lic.includes('Confirmed') || lic.includes('Obtained')) dims.tradeCompliance = 15;
    else dims.tradeCompliance = 40;

    // Geopolitical / route (16%)
    dims.geopolitical = f.geoRisk;

    // Logistics continuity (10%)
    if (f.delayRiskDays > 5) dims.logistics = 80;
    else if (f.delayRiskDays > 2) dims.logistics = 55;
    else if (f.delayRiskDays > 0) dims.logistics = 35;
    else dims.logistics = 20;

    // Cost volatility (10%)
    dims.costVolatility = Math.min(100, (f.freightINR / Math.max(f.valueINR, 1)) * 200);

    // Payment risk (12%)
    dims.paymentRisk = f.paymentRisk;

    // Market demand (8%)
    dims.marketDemand = Math.max(0, Math.min(100, 60 - (f.demandGrowth * 3)));

    // Cargo risk (8%)
    const cargoFlags = (inp.cargoFlags || []).length;
    dims.cargoRisk = Math.min(100, cargoFlags * 25);

    // Documentation (10%)
    let docScore = 0;
    if (!inp.hsCode) docScore += 25;
    if (!inp.incoterm) docScore += 15;
    if (!inp.paymentMethod) docScore += 20;
    dims.documentation = Math.min(100, docScore);

    // Weighted sum
    const overall =
      dims.exchangeRate * 0.12 +
      dims.tradeCompliance * 0.14 +
      dims.geopolitical * 0.16 +
      dims.logistics * 0.10 +
      dims.costVolatility * 0.10 +
      dims.paymentRisk * 0.12 +
      dims.marketDemand * 0.08 +
      dims.cargoRisk * 0.08 +
      dims.documentation * 0.10;

    return { overall: Math.round(overall), dims };
  }

  // ── RISK BAND HELPERS ─────────────────────────────────────────────────
  function getRiskBand(score) {
    if (score < 25) return { label: 'Low Risk', emoji: '✅', cls: 'ej-score-low', desc: 'Well-prepared shipment with no major identified exposures.' };
    if (score < 50) return { label: 'Moderate Risk', emoji: '🔶', cls: 'ej-score-moderate', desc: 'Some exposures present. Review highlighted factors before dispatching.' };
    if (score < 75) return { label: 'Elevated Risk', emoji: '⚡', cls: 'ej-score-elevated', desc: 'Multiple significant risk factors. Address priority actions before booking.' };
    return { label: 'High Risk', emoji: '🚨', cls: 'ej-score-high', desc: 'Critical exposures identified. Do not proceed without resolving flagged issues.' };
  }

  function barColor(val, max) {
    const pct = val / max;
    if (pct < 0.3) return 'ej-bar-green';
    if (pct < 0.6) return 'ej-bar-amber';
    return 'ej-bar-red';
  }

  function dimBarColor(val) {
    if (val < 30) return 'ej-bar-green';
    if (val < 55) return 'ej-bar-amber';
    return 'ej-bar-red';
  }

  // ── GENERATE PRIORITY ACTIONS ─────────────────────────────────────────
  function generateActions(f, inp, score) {
    const actions = [];

    if (f.paymentRisk > 30) {
      actions.push({ priority: 'High', title: 'Switch to Letter of Credit', desc: `Current payment method carries ${f.paymentRisk}% default risk. An irrevocable LC from a rated bank reduces exposure to ~8%.` });
    }
    if (f.paymentRisk > 15 && f.paymentRisk <= 30) {
      actions.push({ priority: 'Medium', title: 'Secure payment guarantee', desc: `Payment method has ${f.paymentRisk}% default probability. Consider requesting partial advance or confirmed LC.` });
    }

    const routeAlert = DUMMY.route_alerts[inp.destination];
    if (routeAlert && routeAlert.alert) {
      actions.push({ priority: 'High', title: 'Verify forwarder route & insurance', desc: routeAlert.msg + ' Confirm your freight forwarder has accounted for this in routing and transit estimates.' });
    }

    if (f.fxChangePercent < 0) {
      actions.push({ priority: 'High', title: 'Consider FX hedging', desc: `INR has strengthened ${Math.abs(f.fxChangePercent)}% against ${f.currency} over 3 months, reducing your ₹ revenue by ${fmtINR(Math.abs(f.currencyImpact))}. A forward contract can lock in a favourable rate.` });
    }

    const lic = inp.licenceStatus || '';
    if (lic.includes('Pending') || lic.includes('Unsure') || lic.includes('Not assessed')) {
      actions.push({ priority: 'High', title: 'Resolve export licence status', desc: 'Export licence is not confirmed. Check DGFT SCOMET list and product-specific restrictions before booking shipment.' });
    }

    if (f.profitMargin < 10 && f.profitMargin > 0) {
      actions.push({ priority: 'Medium', title: 'Review pricing — thin margin', desc: `Export profit margin is only ${f.profitMargin.toFixed(1)}%. Factor in all landed costs and FX risk before confirming price.` });
    }
    if (f.profitMargin <= 0) {
      actions.push({ priority: 'High', title: 'Loss-making shipment detected', desc: 'Invoice value does not cover cost of production at current FX rate. Revise pricing or negotiate cost reduction.' });
    }

    if (f.delayRiskDays > 0) {
      actions.push({ priority: f.delayRiskDays > 5 ? 'High' : 'Medium', title: 'Extend delivery deadline or expedite', desc: `Transit estimate is ${f.transitDays} days but buffer is only ${f.transitDays - f.delayRiskDays} days. ${f.delayRiskDays}-day overrun risk. Consider Air mode or negotiating later deadline.` });
    }

    if (f.portCong.score > 55) {
      actions.push({ priority: 'Medium', title: 'Monitor port congestion', desc: `Destination port congestion index is ${f.portCong.score}/100 with avg ${f.portCong.hours}h delay. Build buffer into ETA communications to buyer.` });
    }

    const cargoFlags = inp.cargoFlags || [];
    if (cargoFlags.includes('Perishable')) {
      actions.push({ priority: 'Medium', title: 'Cold chain certification', desc: 'Perishable cargo flagged. Ensure FSSAI/APEDA phytosanitary certification and cold chain continuity documentation.' });
    }
    if (cargoFlags.includes('Dangerous goods')) {
      actions.push({ priority: 'High', title: 'IMDG / DGR compliance', desc: 'Dangerous goods flagged. Verify IMDG code compliance, proper UN packaging, and carrier acceptance before booking.' });
    }
    if (cargoFlags.includes('Dual-use/SCOMET')) {
      actions.push({ priority: 'High', title: 'SCOMET clearance required', desc: 'Dual-use item flagged. DGFT SCOMET licence is mandatory. Do not ship without clearance.' });
    }

    if (!inp.hsCode) {
      actions.push({ priority: 'Medium', title: 'Add ITC(HS) code', desc: 'HS code is missing. This affects duty estimation accuracy and customs clearance speed. Look up code on ICEGATE.' });
    }

    const insKey = insuranceToKey(inp.insurance);
    if (insKey === 'none') {
      actions.push({ priority: 'Medium', title: 'Arrange marine cargo insurance', desc: 'No insurance arranged. Full marine cargo insurance (Institute Cargo Clauses A) is strongly recommended for international shipments.' });
    }

    if (f.suppReliability < 88) {
      actions.push({ priority: 'Low', title: 'Build supply-side buffer', desc: `Sector on-time delivery rate is ${f.suppReliability}%. Add 2-3 day buffer in production schedule to avoid dispatch delays.` });
    }

    if (f.demandGrowth > 8) {
      actions.push({ priority: 'Low', title: 'Capitalise on demand growth', desc: `${f.demandGrowth}% YoY demand growth in ${inp.destination} for this sector. Consider increasing shipment volume or negotiating premium pricing.` });
    }

    // Sort: High first, then Medium, then Low
    const order = { High: 0, Medium: 1, Low: 2 };
    actions.sort((a, b) => order[a.priority] - order[b.priority]);

    return actions;
  }

  // ── RENDER HELPERS ────────────────────────────────────────────────────
  function createEl(tag, cls, html) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html !== undefined) el.innerHTML = html;
    return el;
  }

  // ── MAIN INIT ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    const panel = document.getElementById('panel-journey');
    if (!panel) return;

    // Clear existing content and build the Risk Predictor UI
    panel.innerHTML = '';

    const container = createEl('div', 'ej-container');
    panel.appendChild(container);

    // Hero
    container.innerHTML = `
      <div class="ej-hero">
        <p class="ej-hero-eyebrow"><span class="ej-dot"></span> 16-FACTOR PRE-SHIPMENT RISK INTELLIGENCE</p>
        <h1>Export Journey <em>Risk Predictor</em></h1>
        <p class="ej-hero-sub">Assess financial exposure, route risk, competitive advantage, and compliance readiness before shipping. All calculations transparent. No black box.</p>
      </div>
      <div class="ej-action-bar">
        <button class="ej-btn ej-btn-primary" id="ejLoadSample">▶ Load Sample</button>
        <button class="ej-btn ej-btn-outline" id="ejNewPlan">+ New Plan</button>
      </div>
      <div class="ej-split">
        <div class="ej-form-panel" id="ejFormPanel"></div>
        <div class="ej-dashboard" id="ejDashboard"></div>
      </div>
      <p class="ej-disclaimer">⚠️ <strong>Indicative data only</strong> — not financial, legal, or customs advice. All exchange rates, duties, freight costs, and scores are embedded dummy/indicative values for planning purposes. Verify with official sources (DGFT, ICEGATE, RBI) before acting.</p>
    `;

    buildForm();
    showEmptyState();

    document.getElementById('ejLoadSample').addEventListener('click', loadSample);
    document.getElementById('ejNewPlan').addEventListener('click', resetForm);
  });

  // ── BUILD FORM ────────────────────────────────────────────────────────
  function buildForm() {
    const fp = document.getElementById('ejFormPanel');
    if (!fp) return;

    fp.innerHTML = `
      <!-- Product Section -->
      <div class="ej-form-section">
        <div class="ej-form-section-title">Product Details</div>
        <div class="ej-field">
          <label for="ejProductName">Product name *</label>
          <input type="text" id="ejProductName" placeholder="e.g. Auto brake pads" />
        </div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejHSCode">ITC(HS) code</label>
            <input type="text" id="ejHSCode" placeholder="e.g. 8708.30" />
          </div>
          <div class="ej-field">
            <label for="ejEPC">EPC / Sector *</label>
            <select id="ejEPC">
              <option value="">Select…</option>
              <option value="APEDA">APEDA</option>
              <option value="EEPC">EEPC</option>
              <option value="CLE">CLE</option>
              <option value="Pharma">Pharma</option>
              <option value="Textiles">Textiles</option>
              <option value="Gems">Gems</option>
              <option value="Chemicals">Chemicals</option>
              <option value="IT">IT</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="ej-field">
          <label>Cargo characteristics</label>
          <div class="ej-pill-group" id="ejCargoFlags">
            <button type="button" class="ej-pill" data-flag="Perishable">🧊 Perishable</button>
            <button type="button" class="ej-pill" data-flag="Dangerous goods">⚠️ Dangerous goods</button>
            <button type="button" class="ej-pill" data-flag="Cold chain">❄️ Cold chain</button>
            <button type="button" class="ej-pill" data-flag="Dual-use/SCOMET">🔒 Dual-use/SCOMET</button>
            <button type="button" class="ej-pill" data-flag="Plant/food origin">🌿 Plant/food origin</button>
            <button type="button" class="ej-pill" data-flag="Oversized">📦 Oversized</button>
          </div>
        </div>
      </div>

      <!-- Route Section -->
      <div class="ej-form-section">
        <div class="ej-form-section-title">Origin & Route</div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label>Origin country</label>
            <input type="text" value="India" disabled style="background:#f1f5f9;color:#64748b;" />
          </div>
          <div class="ej-field">
            <label for="ejOriginCity">Origin city *</label>
            <input type="text" id="ejOriginCity" placeholder="e.g. Mumbai" />
          </div>
        </div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejDestCountry">Destination country *</label>
            <select id="ejDestCountry">
              <option value="">Select…</option>
              <option value="UAE">UAE</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Germany">Germany</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Singapore">Singapore</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="China">China</option>
              <option value="Australia">Australia</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Japan">Japan</option>
              <option value="Canada">Canada</option>
            </select>
          </div>
          <div class="ej-field">
            <label for="ejDestCity">Destination city</label>
            <input type="text" id="ejDestCity" placeholder="e.g. Dubai" />
          </div>
        </div>
        <div class="ej-field">
          <label>Transport mode *</label>
          <div class="ej-pill-group" id="ejModeGroup">
            <button type="button" class="ej-pill active" data-mode="Sea">🚢 Sea</button>
            <button type="button" class="ej-pill" data-mode="Air">✈️ Air</button>
            <button type="button" class="ej-pill" data-mode="Road">🚛 Road</button>
            <button type="button" class="ej-pill" data-mode="Rail">🚂 Rail</button>
          </div>
        </div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejPOL">Port of loading</label>
            <input type="text" id="ejPOL" placeholder="e.g. JNPT Nhava Sheva" />
          </div>
          <div class="ej-field">
            <label for="ejPOD">Port of discharge</label>
            <input type="text" id="ejPOD" placeholder="e.g. Jebel Ali" />
          </div>
        </div>
        <div class="ej-field">
          <label for="ejRouteNotes">Route notes / Transshipment</label>
          <input type="text" id="ejRouteNotes" placeholder="e.g. Via Colombo transshipment" />
        </div>
      </div>

      <!-- Shipment & Financials Section -->
      <div class="ej-form-section">
        <div class="ej-form-section-title">Shipment & Financials</div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejValue">Shipment value *</label>
            <input type="number" id="ejValue" placeholder="50000" min="0" />
          </div>
          <div class="ej-field">
            <label for="ejCurrency">Currency</label>
            <select id="ejCurrency">
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="AED">AED</option>
              <option value="JPY">JPY</option>
              <option value="SGD">SGD</option>
            </select>
          </div>
        </div>
        <div class="ej-field-row-3">
          <div class="ej-field">
            <label for="ejWeight">Weight (kg)</label>
            <input type="number" id="ejWeight" placeholder="2500" min="0" />
          </div>
          <div class="ej-field">
            <label for="ejCostProd">Cost of production (₹)</label>
            <input type="number" id="ejCostProd" placeholder="3000000" min="0" />
          </div>
          <div class="ej-field">
            <label for="ejUnitPrice">Price per unit</label>
            <input type="number" id="ejUnitPrice" placeholder="25" min="0" />
          </div>
        </div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejIncoterm">Incoterm</label>
            <select id="ejIncoterm">
              <option value="">Select…</option>
              <option value="EXW">EXW</option>
              <option value="FOB">FOB</option>
              <option value="CIF">CIF</option>
              <option value="DAP">DAP</option>
              <option value="DDP">DDP</option>
            </select>
          </div>
          <div class="ej-field">
            <label for="ejPayment">Payment method</label>
            <select id="ejPayment">
              <option value="">Select…</option>
              <option value="Advance/TT">Advance / TT</option>
              <option value="Letter of Credit">Letter of Credit</option>
              <option value="Documents against payment">Documents against payment</option>
              <option value="DA 60/90 days">DA 60/90 days</option>
              <option value="Open account">Open account</option>
            </select>
          </div>
        </div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejDispatch">Planned dispatch date</label>
            <input type="date" id="ejDispatch" />
          </div>
          <div class="ej-field">
            <label for="ejDeadline">Delivery deadline</label>
            <input type="date" id="ejDeadline" />
          </div>
        </div>
        <div class="ej-field-row">
          <div class="ej-field">
            <label for="ejLicence">Export licence status</label>
            <select id="ejLicence">
              <option value="Not assessed">Not assessed</option>
              <option value="Confirmed not required">Confirmed not required</option>
              <option value="Obtained">Obtained</option>
              <option value="Pending">Pending</option>
              <option value="Unsure">Unsure</option>
            </select>
          </div>
          <div class="ej-field">
            <label for="ejInsurance">Insurance</label>
            <select id="ejInsurance">
              <option value="Not arranged">Not arranged</option>
              <option value="Full marine cargo">Full marine cargo</option>
              <option value="Partial">Partial</option>
            </select>
          </div>
        </div>
      </div>

      <button class="ej-run-btn" id="ejRunBtn">
        <span>Run 16-factor risk assessment →</span>
      </button>
    `;

    // Wire up cargo flag pills
    document.querySelectorAll('#ejCargoFlags .ej-pill').forEach(pill => {
      pill.addEventListener('click', () => pill.classList.toggle('active'));
    });

    // Wire up mode pills (single select)
    document.querySelectorAll('#ejModeGroup .ej-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#ejModeGroup .ej-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });

    // Run assessment
    document.getElementById('ejRunBtn').addEventListener('click', runAssessment);
  }

  // ── GATHER FORM INPUTS ────────────────────────────────────────────────
  function gatherInputs() {
    const cargoFlags = [];
    document.querySelectorAll('#ejCargoFlags .ej-pill.active').forEach(p => cargoFlags.push(p.dataset.flag));

    const modeEl = document.querySelector('#ejModeGroup .ej-pill.active');

    return {
      productName: document.getElementById('ejProductName').value.trim(),
      hsCode: document.getElementById('ejHSCode').value.trim(),
      epc: document.getElementById('ejEPC').value,
      cargoFlags,
      originCity: document.getElementById('ejOriginCity').value.trim(),
      destination: document.getElementById('ejDestCountry').value,
      destCity: document.getElementById('ejDestCity').value.trim(),
      mode: modeEl ? modeEl.dataset.mode : 'Sea',
      pol: document.getElementById('ejPOL').value.trim(),
      pod: document.getElementById('ejPOD').value.trim(),
      routeNotes: document.getElementById('ejRouteNotes').value.trim(),
      value: document.getElementById('ejValue').value,
      currency: document.getElementById('ejCurrency').value,
      weight: document.getElementById('ejWeight').value,
      costOfProduction: document.getElementById('ejCostProd').value,
      unitPrice: document.getElementById('ejUnitPrice').value,
      incoterm: document.getElementById('ejIncoterm').value,
      paymentMethod: document.getElementById('ejPayment').value,
      dispatchDate: document.getElementById('ejDispatch').value,
      deadline: document.getElementById('ejDeadline').value,
      licenceStatus: document.getElementById('ejLicence').value,
      insurance: document.getElementById('ejInsurance').value,
    };
  }

  // ── EMPTY STATE ───────────────────────────────────────────────────────
  function showEmptyState() {
    const dash = document.getElementById('ejDashboard');
    if (!dash) return;
    dash.innerHTML = `
      <div class="ej-empty-state">
        <div class="ej-empty-icon">🧭</div>
        <h3>No assessment yet</h3>
        <p>Fill in your shipment details on the left and click <strong>"Run 16-factor risk assessment"</strong> to generate a comprehensive risk dashboard.</p>
        <p style="font-size:0.78rem; color:var(--text-muted);">Or click <strong>▶ Load Sample</strong> for a pre-filled Mumbai → Dubai auto-parts shipment.</p>
      </div>
    `;
  }

  // ── LOAD SAMPLE ───────────────────────────────────────────────────────
  function loadSample() {
    document.getElementById('ejProductName').value = 'Auto brake pads & disc assemblies';
    document.getElementById('ejHSCode').value = '8708.30';
    document.getElementById('ejEPC').value = 'EEPC';
    document.getElementById('ejOriginCity').value = 'Pune';
    document.getElementById('ejDestCountry').value = 'UAE';
    document.getElementById('ejDestCity').value = 'Dubai';
    document.getElementById('ejPOL').value = 'JNPT Nhava Sheva';
    document.getElementById('ejPOD').value = 'Jebel Ali';
    document.getElementById('ejRouteNotes').value = 'Direct sailing, no transshipment';
    document.getElementById('ejValue').value = '50000';
    document.getElementById('ejCurrency').value = 'USD';
    document.getElementById('ejWeight').value = '2500';
    document.getElementById('ejCostProd').value = '3200000';
    document.getElementById('ejUnitPrice').value = '25';
    document.getElementById('ejIncoterm').value = 'FOB';
    document.getElementById('ejPayment').value = 'Letter of Credit';
    document.getElementById('ejInsurance').value = 'Full marine cargo';
    document.getElementById('ejLicence').value = 'Confirmed not required';

    // Set dates — dispatch in 2 weeks, deadline in 4 weeks
    const today = new Date();
    const dispatch = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const deadline = new Date(today.getTime() + 35 * 24 * 60 * 60 * 1000);
    document.getElementById('ejDispatch').value = dispatch.toISOString().split('T')[0];
    document.getElementById('ejDeadline').value = deadline.toISOString().split('T')[0];

    // Set mode
    document.querySelectorAll('#ejModeGroup .ej-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#ejModeGroup .ej-pill[data-mode="Sea"]').classList.add('active');

    // Clear cargo flags
    document.querySelectorAll('#ejCargoFlags .ej-pill').forEach(p => p.classList.remove('active'));
  }

  // ── RESET FORM ────────────────────────────────────────────────────────
  function resetForm() {
    document.getElementById('ejProductName').value = '';
    document.getElementById('ejHSCode').value = '';
    document.getElementById('ejEPC').value = '';
    document.getElementById('ejOriginCity').value = '';
    document.getElementById('ejDestCountry').value = '';
    document.getElementById('ejDestCity').value = '';
    document.getElementById('ejPOL').value = '';
    document.getElementById('ejPOD').value = '';
    document.getElementById('ejRouteNotes').value = '';
    document.getElementById('ejValue').value = '';
    document.getElementById('ejCurrency').value = 'USD';
    document.getElementById('ejWeight').value = '';
    document.getElementById('ejCostProd').value = '';
    document.getElementById('ejUnitPrice').value = '';
    document.getElementById('ejIncoterm').value = '';
    document.getElementById('ejPayment').value = '';
    document.getElementById('ejDispatch').value = '';
    document.getElementById('ejDeadline').value = '';
    document.getElementById('ejLicence').value = 'Not assessed';
    document.getElementById('ejInsurance').value = 'Not arranged';

    document.querySelectorAll('#ejModeGroup .ej-pill').forEach(p => p.classList.remove('active'));
    document.querySelector('#ejModeGroup .ej-pill[data-mode="Sea"]').classList.add('active');
    document.querySelectorAll('#ejCargoFlags .ej-pill').forEach(p => p.classList.remove('active'));

    showEmptyState();
  }

  // ── RUN ASSESSMENT ────────────────────────────────────────────────────
  function runAssessment() {
    const inp = gatherInputs();

    // Validate minimum fields
    if (!inp.productName) return alert('Please enter a product name.');
    if (!inp.epc) return alert('Please select an EPC / Sector.');
    if (!inp.originCity) return alert('Please enter origin city.');
    if (!inp.destination) return alert('Please select destination country.');
    if (!inp.value || parseFloat(inp.value) <= 0) return alert('Please enter shipment value.');

    showLoading(inp);
  }

  // ── LOADING OVERLAY ───────────────────────────────────────────────────
  function showLoading(inp) {
    const overlay = createEl('div', 'ej-loading-overlay');
    overlay.id = 'ejLoadingOverlay';
    overlay.innerHTML = `
      <div class="ej-spinner"></div>
      <div class="ej-loading-text">Running 16-factor risk assessment…</div>
      <div class="ej-loading-step" id="ejLoadingStep">Initialising assessment engine</div>
    `;
    document.body.appendChild(overlay);

    const steps = [
      'Calculating exchange rate exposure…',
      'Estimating freight & landed cost…',
      'Analysing route & geopolitical risk…',
      'Evaluating payment & compliance risk…',
      'Computing competitive advantage…',
      'Generating priority actions…',
      'Building risk dashboard…'
    ];

    let idx = 0;
    const stepEl = document.getElementById('ejLoadingStep');
    const interval = setInterval(() => {
      if (idx < steps.length) {
        stepEl.textContent = steps[idx];
        idx++;
      }
    }, 350);

    setTimeout(() => {
      clearInterval(interval);
      overlay.remove();
      const factors = computeFactors(inp);
      const score = computeRiskScore(factors, inp);
      renderDashboard(factors, score, inp);
    }, 2800);
  }

  // ── RENDER DASHBOARD ──────────────────────────────────────────────────
  function renderDashboard(f, score, inp) {
    const dash = document.getElementById('ejDashboard');
    if (!dash) return;
    dash.innerHTML = '';

    const band = getRiskBand(score.overall);

    // Check for critical alerts
    const routeAlert = DUMMY.route_alerts[inp.destination];
    const licCritical = inp.licenceStatus === 'Pending' || inp.licenceStatus === 'Unsure';
    const hasCritical = (routeAlert && routeAlert.alert) || licCritical;

    // Edit bar
    const editBar = createEl('div', 'ej-edit-bar');
    editBar.innerHTML = `<span>✏️ Assessment active for: <strong>${inp.productName}</strong> → ${inp.destination}</span><button class="ej-btn ej-btn-outline" id="ejEditPlan">✏️ Edit plan</button>`;
    dash.appendChild(editBar);
    document.getElementById('ejEditPlan').addEventListener('click', () => {
      dash.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // Score card
    const scoreCard = createEl('div', `ej-score-card ${band.cls}`);
    scoreCard.innerHTML = `
      <div>
        <div class="ej-score-number">${score.overall}</div>
        <div class="ej-score-band">${band.emoji} ${band.label}</div>
      </div>
      <div class="ej-score-meta">
        <h3>Overall Export Risk Exposure Index</h3>
        <p>${band.desc}</p>
        ${hasCritical ? '<p style="color:#fca5a5; font-weight:600; margin-top:6px;">⚠ Critical alert active — see below</p>' : ''}
      </div>
      <div class="ej-score-timestamp">Assessed: ${new Date().toLocaleString('en-IN')}</div>
    `;
    dash.appendChild(scoreCard);

    // Critical alerts
    if (hasCritical) {
      if (routeAlert && routeAlert.alert) {
        const alertEl = createEl('div', 'ej-critical-alert');
        alertEl.innerHTML = `
          <span class="ej-critical-alert-icon">🚨</span>
          <div>
            <h4>Critical Route Advisory</h4>
            <p>${routeAlert.msg}</p>
          </div>
        `;
        dash.appendChild(alertEl);
      }
      if (licCritical) {
        const licAlert = createEl('div', 'ej-critical-alert');
        licAlert.innerHTML = `
          <span class="ej-critical-alert-icon">🚨</span>
          <div>
            <h4>Export Licence — ${inp.licenceStatus}</h4>
            <p>Export licence status is "${inp.licenceStatus}". This is a compliance blocker. Do not proceed without confirming licence status with DGFT.</p>
          </div>
        `;
        dash.appendChild(licAlert);
      }
    }

    // Dashboard tabs
    const tabsHtml = `
      <div class="ej-dash-tabs">
        <button class="ej-dash-tab active" data-dtab="overview">Overview</button>
        <button class="ej-dash-tab" data-dtab="financials">Financials</button>
        <button class="ej-dash-tab" data-dtab="competitive">Competitive Advantage</button>
        <button class="ej-dash-tab" data-dtab="actions">Actions</button>
      </div>
      <div class="ej-dash-panel active" id="ejPanelOverview"></div>
      <div class="ej-dash-panel" id="ejPanelFinancials"></div>
      <div class="ej-dash-panel" id="ejPanelCompetitive"></div>
      <div class="ej-dash-panel" id="ejPanelActions"></div>
    `;
    const tabsWrap = createEl('div');
    tabsWrap.innerHTML = tabsHtml;
    dash.appendChild(tabsWrap);

    // Wire tab switching
    tabsWrap.querySelectorAll('.ej-dash-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tabsWrap.querySelectorAll('.ej-dash-tab').forEach(b => b.classList.remove('active'));
        tabsWrap.querySelectorAll('.ej-dash-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('ejPanel' + btn.dataset.dtab.charAt(0).toUpperCase() + btn.dataset.dtab.slice(1)).classList.add('active');
      });
    });

    renderOverview(f, score, inp);
    renderFinancials(f, inp);
    renderCompetitive(f, inp);
    renderActions(f, score, inp);
  }

  // ── TAB 1: OVERVIEW ───────────────────────────────────────────────────
  function renderOverview(f, score, inp) {
    const panel = document.getElementById('ejPanelOverview');
    if (!panel) return;

    // Route visualisation
    let routeHtml = '<div class="ej-route-viz"><div class="ej-route-flow">';

    // Origin
    routeHtml += `
      <div class="ej-route-node">
        <div class="ej-route-node-circle">🇮🇳</div>
        <div class="ej-route-node-label">${inp.originCity || 'India'}</div>
      </div>
      <div class="ej-route-connector"></div>
    `;

    // POL
    if (inp.pol) {
      routeHtml += `
        <div class="ej-route-node">
          <div class="ej-route-node-circle">⚓</div>
          <div class="ej-route-node-label">${inp.pol}</div>
        </div>
        <div class="ej-route-connector"></div>
      `;
    }

    // Advisory zone
    const alert = DUMMY.route_alerts[inp.destination];
    if (alert && alert.alert) {
      routeHtml += `
        <div class="ej-route-node">
          <div class="ej-route-node-circle alert-node">⚠️</div>
          <div class="ej-route-node-label" style="color:#dc2626; font-weight:700;">Advisory Zone</div>
        </div>
        <div class="ej-route-connector alert-connector"></div>
      `;
    }

    // POD
    if (inp.pod) {
      routeHtml += `
        <div class="ej-route-node">
          <div class="ej-route-node-circle">⚓</div>
          <div class="ej-route-node-label">${inp.pod}</div>
        </div>
        <div class="ej-route-connector"></div>
      `;
    }

    // Destination
    routeHtml += `
      <div class="ej-route-node">
        <div class="ej-route-node-circle">📍</div>
        <div class="ej-route-node-label">${inp.destCity || inp.destination}</div>
      </div>
    `;
    routeHtml += '</div></div>';

    // 16 Factor cards
    const factors = [
      { name: 'Exchange Rate', cat: 'Financial', value: `₹${f.fxRate}`, unit: `INR/${f.currency}`, interp: f.fxRate > 80 ? 'INR relatively weak — favourable for export revenue' : 'Standard rate range', bar: Math.min(100, f.fxRate), barMax: 120, barCls: 'ej-bar-blue' },
      { name: 'Currency Impact', cat: 'Financial', value: (f.currencyImpact >= 0 ? '+' : '') + fmtINR(f.currencyImpact), unit: '3-month FX impact', interp: f.currencyImpact >= 0 ? `INR weakened ${Math.abs(f.fxChangePercent)}% — you gain ${fmtINR(f.currencyImpact)}` : `INR strengthened ${Math.abs(f.fxChangePercent)}% — revenue loss of ${fmtINR(Math.abs(f.currencyImpact))}`, bar: Math.abs(f.fxChangePercent) * 20, barMax: 100, barCls: f.currencyImpact >= 0 ? 'ej-bar-green' : 'ej-bar-red' },
      { name: 'Export Profit Margin', cat: 'Financial', value: f.profitMargin.toFixed(1) + '%', unit: 'Margin on invoice', interp: f.profitMargin > 20 ? 'Healthy margin above 20%' : f.profitMargin > 10 ? 'Moderate margin — monitor costs' : f.profitMargin > 0 ? 'Thin margin — review pricing' : 'Negative margin — loss-making', bar: Math.max(0, f.profitMargin), barMax: 50, barCls: f.profitMargin > 15 ? 'ej-bar-green' : f.profitMargin > 5 ? 'ej-bar-amber' : 'ej-bar-red' },
      { name: 'Landed Cost', cat: 'Financial', value: fmtINR(f.landedCost), unit: 'Total landed cost', interp: `Invoice ${fmtINR(f.valueINR)} + freight + insurance + duty`, bar: 70, barMax: 100, barCls: 'ej-bar-blue' },
      { name: 'Customs Duty', cat: 'Financial', value: `${f.dutyPercent}%`, unit: fmtINR(f.dutyINR), interp: `${inp.destination} import duty for ${inp.epc} sector`, bar: f.dutyPercent, barMax: 20, barCls: f.dutyPercent > 10 ? 'ej-bar-red' : f.dutyPercent > 5 ? 'ej-bar-amber' : 'ej-bar-green' },
      { name: 'Freight Cost', cat: 'Logistics', value: fmtINR(f.freightINR), unit: `${inp.mode} freight`, interp: f.weight > 0 ? `${fmt(f.weight)} kg × ₹${DUMMY.freight_rate[f.mode]}/kg` : '6% of invoice value (weight not provided)', bar: (f.freightINR / Math.max(f.valueINR, 1)) * 100, barMax: 15, barCls: 'ej-bar-amber' },
      { name: 'Insurance Cost', cat: 'Financial', value: `${f.insRate}%`, unit: fmtINR(f.insINR), interp: f.insRate > 0 ? `${inp.insurance} — ${f.insRate}% of shipment value` : 'No insurance arranged', bar: f.insRate * 100, barMax: 30, barCls: f.insRate > 0 ? 'ej-bar-green' : 'ej-bar-red' },
      { name: 'Transit Time', cat: 'Logistics', value: f.transitDays !== null ? `${f.transitDays} days` : 'N/A', unit: `${inp.mode} to ${inp.destination}`, interp: f.transitDays !== null ? `Estimated ${f.transitDays}-day transit via ${inp.mode.toLowerCase()}` : `${inp.mode} route to ${inp.destination} not available in data`, bar: f.transitDays || 0, barMax: 35, barCls: (f.transitDays || 0) > 20 ? 'ej-bar-amber' : 'ej-bar-green' },
      { name: 'Delay Risk', cat: 'Logistics', value: `${f.delayRiskDays} days`, unit: 'Potential overrun', interp: f.delayRiskDays > 0 ? `Transit exceeds buffer by ${f.delayRiskDays} days — high delay risk` : 'Sufficient buffer for transit', bar: f.delayRiskDays * 10, barMax: 100, barCls: f.delayRiskDays > 3 ? 'ej-bar-red' : f.delayRiskDays > 0 ? 'ej-bar-amber' : 'ej-bar-green' },
      { name: 'Tariff Impact', cat: 'Financial', value: `${f.tariffImpact}%`, unit: 'Buyer cost addition', interp: `Import duty adds ${f.tariffImpact}% to buyer's landed cost in ${inp.destination}`, bar: f.tariffImpact, barMax: 20, barCls: f.tariffImpact > 10 ? 'ej-bar-red' : f.tariffImpact > 5 ? 'ej-bar-amber' : 'ej-bar-green' },
      { name: 'Payment Risk', cat: 'Financial', value: `${f.paymentRisk}%`, unit: 'Default probability', interp: `${inp.paymentMethod || 'Not specified'} — ${f.paymentRisk}% delayed/failed payment probability`, bar: f.paymentRisk, barMax: 50, barCls: f.paymentRisk > 25 ? 'ej-bar-red' : f.paymentRisk > 10 ? 'ej-bar-amber' : 'ej-bar-green' },
      { name: 'Demand Growth', cat: 'Market', value: `${f.demandGrowth}%`, unit: 'YoY growth', interp: `${inp.epc} sector demand growing ${f.demandGrowth}% YoY in ${inp.destination}`, bar: f.demandGrowth, barMax: 20, barCls: f.demandGrowth > 7 ? 'ej-bar-green' : f.demandGrowth > 4 ? 'ej-bar-amber' : 'ej-bar-red' },
      { name: 'Price Competitiveness', cat: 'Competitive', value: `${f.priceComp}%`, unit: 'vs global benchmark', interp: f.priceComp < -10 ? `India is ${Math.abs(f.priceComp)}% cheaper — strong price advantage` : f.priceComp < -5 ? 'Moderate price advantage' : 'Minimal price advantage', bar: Math.abs(f.priceComp), barMax: 25, barCls: f.priceComp < -10 ? 'ej-bar-green' : f.priceComp < -5 ? 'ej-bar-amber' : 'ej-bar-red' },
      { name: 'Supplier Reliability', cat: 'Competitive', value: `${f.suppReliability}%`, unit: 'On-time delivery', interp: f.suppReliability >= 90 ? 'Excellent supply-side reliability' : f.suppReliability >= 85 ? 'Acceptable — minor delays possible' : 'Below benchmark — buffer production schedule', bar: f.suppReliability, barMax: 100, barCls: f.suppReliability >= 90 ? 'ej-bar-green' : f.suppReliability >= 85 ? 'ej-bar-amber' : 'ej-bar-red' },
      { name: 'Port Congestion', cat: 'Logistics', value: `${f.portCong.score}/100`, unit: `~${f.portCong.hours}h avg delay`, interp: f.portCong.score > 60 ? 'High congestion — factor into ETA' : f.portCong.score > 40 ? 'Moderate congestion' : 'Low congestion — smooth clearance expected', bar: f.portCong.score, barMax: 100, barCls: f.portCong.score > 60 ? 'ej-bar-red' : f.portCong.score > 40 ? 'ej-bar-amber' : 'ej-bar-green' },
      { name: 'Geopolitical Risk', cat: 'Geopolitical', value: `${f.geoRisk}/100`, unit: 'Route risk score', interp: f.geoRisk > 50 ? 'Elevated geopolitical environment — active advisories likely' : f.geoRisk > 30 ? 'Moderate geopolitical risk' : 'Stable and low-risk corridor', bar: f.geoRisk, barMax: 100, barCls: f.geoRisk > 50 ? 'ej-bar-red' : f.geoRisk > 30 ? 'ej-bar-amber' : 'ej-bar-green' },
    ];

    const catCls = { Financial: 'ej-cat-financial', Logistics: 'ej-cat-logistics', Market: 'ej-cat-market', Competitive: 'ej-cat-competitive', Geopolitical: 'ej-cat-geopolitical' };

    let cardsHtml = '<div class="ej-factors-grid">';
    factors.forEach(fc => {
      const barPct = Math.min(100, (fc.bar / fc.barMax) * 100);
      cardsHtml += `
        <div class="ej-factor-card">
          <div class="ej-factor-header">
            <span class="ej-factor-name">${fc.name}</span>
            <span class="ej-factor-category ${catCls[fc.cat] || ''}">${fc.cat}</span>
          </div>
          <div class="ej-factor-value">${fc.value} <span class="ej-factor-unit">${fc.unit}</span></div>
          <div class="ej-factor-interp">${fc.interp}</div>
          <div class="ej-factor-bar-bg"><div class="ej-factor-bar-fill ${fc.barCls}" style="width:${barPct}%"></div></div>
        </div>
      `;
    });
    cardsHtml += '</div>';

    // Dimension score bars
    const dimLabels = [
      { key: 'exchangeRate', label: 'Exchange Rate Pressure', weight: '12%' },
      { key: 'tradeCompliance', label: 'Trade Compliance', weight: '14%' },
      { key: 'geopolitical', label: 'Geopolitical / Route', weight: '16%' },
      { key: 'logistics', label: 'Logistics Continuity', weight: '10%' },
      { key: 'costVolatility', label: 'Cost Volatility', weight: '10%' },
      { key: 'paymentRisk', label: 'Payment Risk', weight: '12%' },
      { key: 'marketDemand', label: 'Market Demand', weight: '8%' },
      { key: 'cargoRisk', label: 'Cargo Risk', weight: '8%' },
      { key: 'documentation', label: 'Documentation', weight: '10%' },
    ];

    let dimsHtml = '<div class="ej-dimensions"><h3>Risk Dimension Breakdown</h3>';
    dimLabels.forEach(d => {
      const val = Math.round(score.dims[d.key]);
      const colorCls = dimBarColor(val);
      const textColor = val < 30 ? '#16a34a' : val < 55 ? '#d97706' : '#dc2626';
      dimsHtml += `
        <div class="ej-dim-row">
          <span class="ej-dim-label">${d.label} <span style="font-size:0.65rem;color:var(--text-muted);">(${d.weight})</span></span>
          <div class="ej-dim-bar-bg"><div class="ej-dim-bar-fill ${colorCls}" style="width:${val}%"></div></div>
          <span class="ej-dim-score" style="color:${textColor}">${val}</span>
        </div>
      `;
    });
    dimsHtml += '</div>';

    panel.innerHTML = routeHtml + cardsHtml + dimsHtml;
  }

  // ── TAB 2: FINANCIALS ─────────────────────────────────────────────────
  function renderFinancials(f, inp) {
    const panel = document.getElementById('ejPanelFinancials');
    if (!panel) return;

    const fxImpactClass = f.currencyImpact >= 0 ? 'ej-fin-positive' : 'ej-fin-negative';

    const tableHtml = `
      <div class="ej-fin-table-wrap">
        <table class="ej-fin-table">
          <thead>
            <tr>
              <th>Line Item</th>
              <th>Amount (₹)</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Invoice Value</strong></td>
              <td>${fmtINR(f.valueINR)}</td>
              <td>${fmt(parseFloat(inp.value))} ${f.currency} × ₹${f.fxRate}</td>
            </tr>
            <tr>
              <td>Cost of Goods (INR)</td>
              <td>${f.costINR > 0 ? fmtINR(f.costINR) : '—'}</td>
              <td>${f.costINR > 0 ? 'As entered' : 'Not provided'}</td>
            </tr>
            <tr>
              <td>Freight Cost</td>
              <td>${fmtINR(f.freightINR)}</td>
              <td>${inp.mode} mode${f.weight > 0 ? ` · ${fmt(f.weight)} kg` : ' · 6% estimate'}</td>
            </tr>
            <tr>
              <td>Insurance</td>
              <td>${fmtINR(f.insINR)}</td>
              <td>${f.insRate}% of shipment value</td>
            </tr>
            <tr>
              <td>Import Duty (${inp.destination})</td>
              <td>${fmtINR(f.dutyINR)}</td>
              <td>${f.dutyPercent}% for ${inp.epc} sector</td>
            </tr>
            <tr class="${fxImpactClass}">
              <td>FX Impact (3-month)</td>
              <td>${(f.currencyImpact >= 0 ? '+' : '') + fmtINR(f.currencyImpact)}</td>
              <td>${f.fxChangePercent >= 0 ? 'INR weakened' : 'INR strengthened'} ${Math.abs(f.fxChangePercent)}%</td>
            </tr>
            <tr class="ej-fin-total">
              <td><strong>Landed Cost</strong></td>
              <td><strong>${fmtINR(f.landedCost)}</strong></td>
              <td>Invoice + freight + insurance + duty</td>
            </tr>
            <tr class="ej-fin-highlight">
              <td><strong>Export Profit Margin</strong></td>
              <td><strong>${f.profitMargin.toFixed(1)}%</strong></td>
              <td>${f.profitMargin > 0 ? 'Profitable at current rate' : 'Loss-making'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

    const revenueAtCurrent = f.valueINR;
    const fxCards = `
      <h3 style="font-family:'DM Serif Display',serif; font-size:1.15rem; color:var(--text-primary); margin-bottom:14px;">Exchange Rate Analysis</h3>
      <div class="ej-fx-grid">
        <div class="ej-fx-card">
          <div class="ej-fx-card-label">Spot Rate</div>
          <div class="ej-fx-card-value">₹${f.fxRate}</div>
          <div class="ej-fx-card-sub">INR per ${f.currency}</div>
        </div>
        <div class="ej-fx-card">
          <div class="ej-fx-card-label">3-Month Movement</div>
          <div class="ej-fx-card-value" style="color:${f.fxChangePercent >= 0 ? '#16a34a' : '#dc2626'}">${f.fxChangePercent >= 0 ? '+' : ''}${f.fxChangePercent}%</div>
          <div class="ej-fx-card-sub">${f.fxChangePercent >= 0 ? 'INR weakened (exporter gains)' : 'INR strengthened (exporter loses)'}</div>
        </div>
        <div class="ej-fx-card">
          <div class="ej-fx-card-label">Revenue at Current Rate</div>
          <div class="ej-fx-card-value">${fmtINR(revenueAtCurrent)}</div>
          <div class="ej-fx-card-sub">${fmt(parseFloat(inp.value))} ${f.currency}</div>
        </div>
        <div class="ej-fx-card">
          <div class="ej-fx-card-label">FX Impact</div>
          <div class="ej-fx-card-value" style="color:${f.currencyImpact >= 0 ? '#16a34a' : '#dc2626'}">${f.currencyImpact >= 0 ? '+' : ''}${fmtINR(f.currencyImpact)}</div>
          <div class="ej-fx-card-sub">Due to 3-month ${f.currency}/INR movement</div>
        </div>
      </div>
    `;

    panel.innerHTML = tableHtml + fxCards;
  }

  // ── TAB 3: COMPETITIVE ADVANTAGE ──────────────────────────────────────
  function renderCompetitive(f, inp) {
    const panel = document.getElementById('ejPanelCompetitive');
    if (!panel) return;

    // Card colours
    const priceColor = f.priceComp < -10 ? 'green' : f.priceComp < -5 ? 'amber' : 'red';
    const demandColor = f.demandGrowth > 7 ? 'green' : f.demandGrowth > 4 ? 'amber' : 'red';
    const reliabilityColor = f.suppReliability >= 90 ? 'green' : f.suppReliability >= 85 ? 'amber' : 'red';

    // Market share
    let marketShare = null;
    if (DUMMY.india_market_share[inp.epc] && DUMMY.india_market_share[inp.epc][inp.destination]) {
      marketShare = DUMMY.india_market_share[inp.epc][inp.destination];
    }
    const shareColor = marketShare !== null ? (marketShare > 15 ? 'green' : marketShare > 8 ? 'amber' : 'red') : 'amber';

    const cardsHtml = `
      <div class="ej-comp-grid">
        <div class="ej-comp-card ej-comp-card-${priceColor}">
          <div class="ej-comp-card-title">Price Competitiveness</div>
          <div class="ej-comp-card-value">${f.priceComp}%</div>
          <div class="ej-comp-card-sub">vs global benchmark</div>
        </div>
        <div class="ej-comp-card ej-comp-card-${shareColor}">
          <div class="ej-comp-card-title">India's Market Share</div>
          <div class="ej-comp-card-value">${marketShare !== null ? marketShare + '%' : 'N/A'}</div>
          <div class="ej-comp-card-sub">${inp.epc} in ${inp.destination}</div>
        </div>
        <div class="ej-comp-card ej-comp-card-${demandColor}">
          <div class="ej-comp-card-title">Demand Growth</div>
          <div class="ej-comp-card-value">+${f.demandGrowth}%</div>
          <div class="ej-comp-card-sub">YoY in ${inp.destination}</div>
        </div>
        <div class="ej-comp-card ej-comp-card-${reliabilityColor}">
          <div class="ej-comp-card-title">Supplier Reliability</div>
          <div class="ej-comp-card-value">${f.suppReliability}%</div>
          <div class="ej-comp-card-sub">On-time delivery rate</div>
        </div>
      </div>
    `;

    // Market intelligence paragraphs
    const priceSentence = Math.abs(f.priceComp) > 10
      ? `India's ${inp.epc} sector offers a strong price advantage at ${Math.abs(f.priceComp)}% below the global benchmark. This positions Indian exporters favourably in ${inp.destination}, particularly against higher-cost competitors from Europe and North America.`
      : `India's price advantage in the ${inp.epc} sector is moderate at ${Math.abs(f.priceComp)}% below benchmark. While competitive, this margin may not be sufficient to offset quality or compliance advantages held by established suppliers in ${inp.destination}.`;

    const demandSentence = f.demandGrowth > 7
      ? `Demand for ${inp.epc} products in ${inp.destination} is growing at a healthy ${f.demandGrowth}% year-on-year. This represents an expanding market opportunity, and new entrants have a reasonable window to capture share.`
      : `Demand growth in ${inp.destination} for this sector is ${f.demandGrowth}% YoY — moderate. Market entry may require differentiation on quality, reliability, or value-added services rather than volume alone.`;

    const shareSentence = marketShare !== null
      ? (marketShare > 15
        ? `India already holds a significant ${marketShare}% market share in ${inp.epc} products in ${inp.destination}. This indicates established trade channels and buyer familiarity with Indian suppliers.`
        : `India's current market share of ${marketShare}% in this product-market pair suggests room for growth. Building buyer relationships and establishing consistent quality will be key to increasing penetration.`)
      : `Market share data is not available for ${inp.epc} in ${inp.destination}. This may indicate an emerging trade corridor where India can establish early-mover advantage.`;

    // Verdict
    const advantageCount = (f.priceComp < -10 ? 1 : 0) + (f.demandGrowth > 6 ? 1 : 0) + (f.suppReliability >= 88 ? 1 : 0) + (marketShare !== null && marketShare > 10 ? 1 : 0);
    const hasAdvantage = advantageCount >= 2;

    const verdictHtml = hasAdvantage
      ? `<div class="ej-verdict"><span class="ej-verdict-icon">✅</span><span>India <strong>has a competitive advantage</strong> in ${inp.epc} products for the ${inp.destination} market. ${advantageCount} of 4 indicators are favourable.</span></div>`
      : `<div class="ej-verdict"><span class="ej-verdict-icon">⚠️</span><span>India <strong>does not have a clear competitive advantage</strong> in ${inp.epc} products for ${inp.destination}. Only ${advantageCount} of 4 indicators are favourable. Consider differentiation strategies.</span></div>`;

    panel.innerHTML = cardsHtml + `
      <div class="ej-intel-text">
        <h3>Market Intelligence Summary</h3>
        <p>${priceSentence}</p>
        <p>${demandSentence}</p>
        <p>${shareSentence}</p>
      </div>
      ${verdictHtml}
    `;
  }

  // ── TAB 4: ACTIONS ────────────────────────────────────────────────────
  function renderActions(f, score, inp) {
    const panel = document.getElementById('ejPanelActions');
    if (!panel) return;

    const actions = generateActions(f, inp, score);

    if (actions.length === 0) {
      panel.innerHTML = `
        <div class="ej-empty-state" style="min-height:200px;">
          <div class="ej-empty-icon">✅</div>
          <h3>No critical actions identified</h3>
          <p>Your shipment looks well-prepared. Continue with standard export documentation and booking procedures.</p>
        </div>
      `;
      return;
    }

    let html = '<ul class="ej-actions-list">';
    actions.forEach((a, i) => {
      const tagCls = a.priority === 'High' ? 'ej-tag-high' : a.priority === 'Medium' ? 'ej-tag-medium' : 'ej-tag-low';
      html += `
        <li class="ej-action-item">
          <span class="ej-action-num">${i + 1}</span>
          <div class="ej-action-body">
            <div class="ej-action-title">
              ${a.title}
              <span class="ej-priority-tag ${tagCls}">${a.priority}</span>
            </div>
            <div class="ej-action-desc">${a.desc}</div>
          </div>
        </li>
      `;
    });
    html += '</ul>';

    panel.innerHTML = html;
  }

})();
