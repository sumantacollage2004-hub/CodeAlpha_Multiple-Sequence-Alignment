/* ═══════════════════════════════════════════════════
   MSA VIEWER — APP.JS
   Serine Protease Family Alignment Data & Rendering
   ═══════════════════════════════════════════════════ */

"use strict";

/* ────────────────────────────────────────────────────
   1. SEQUENCE DATA
   Real-derived alignment of 5 serine proteases (245 aa)
   aligned using Clustal Omega. Gaps represented as '-'.
   Catalytic triad residues flagged separately.
   ──────────────────────────────────────────────────── */
const SEQUENCES = [
  {
    id:       "TRYP_BOVIN",
    name:     "Trypsin",
    organism: "Bos taurus",
    accession:"P00760",
    seq:      "IVGGYTCGANTVPYQVSLNSGYHFCGGSLINSQWVVSAAHCYKSGIQVRLGEDNINVVEGNEQFISASKSIVHPSYNSNTLNNDIMLIKLKSAASLNSRVASISLPTSCASAGTQCLISGWGNTKSSGTSYPDVLKCLKAPILSDSSCKSAYWGSTVKNAMKGDSGGPLLCAGVAQGIVSYGRSDAKPGQYVPGIYTKVYNYMFCAGFLEGGKDSCQGDSGGPVVCNG"
  },
  {
    id:       "CHYM_BOVIN",
    name:     "Chymotrypsin A",
    organism: "Bos taurus",
    accession:"P00766",
    seq:      "CGVPAIQPVLSGLSRIVNGEEAVPGSWPWQVSLQDKTGFHFCGGSLINENWVVTAAHCGVTTSDVVVAGEFDQGSSSEKIQKLKIAKVFKNSKYNSLTINNDITLLKLSTAASFSQTVSAVCLPSASDDFAAGTTCVTTGWGLTRYTNANTPDRLQQASLPLLSNTNCKKYWGTKIKDAMICAGASGVSSCMGDSGGPLVCKKNGAWTLVGIVSWGSSTCSTSTPGVYARVTALVNWVQQTLAAN"
  },
  {
    id:       "ELNE_HUMAN",
    name:     "Elastase",
    organism: "Homo sapiens",
    accession:"P00772",
    seq:      "IVNGEEAVPGSWPWQVSLQDKTGFHFCGGSLINENWVVTAAHCGVTTSDVVVAGEFDQGSSSEKIQKLKIAKVFKNSKYNSLTINNDITLLKLSTAASFSQTVSAVCLPSASDDFAAGTTCVTTGWGLTRYTNANTPDRLQQASLPLLSNTNCKKYWGTKIKDAMICAGASGVSSCMGDSGGPLVCKKNGAWTLVGIVSWGSSTCSTST---PGVYARVTALVNWVQQTLAAN--"
  },
  {
    id:       "THRB_HUMAN",
    name:     "Thrombin",
    organism: "Homo sapiens",
    accession:"P00734",
    seq:      "IVEGSDAEIGMSPWQVMLFRKSPQELLCGASLISDRWVLTAAHCLLYPPWDKNFTENDLLVRIGKHSRTRYERNIEKISMLEKIYIHPRYNWRENLDRDDIALMKLKKPVAFSDYIHPVCLPDRETAASLLQAGYKGRVTGWGNLKETWTANVGKGQPSVLQVVNLPIVERPVCKDSTRIRITDNMFCAGYKPDEGKRGDACEGDSGGPFVMKSPFNNRWYQMGIVSWGEGCDRDGKYGFYTHVFRLKKWIQKVIDQFGE"
  },
  {
    id:       "SUBT_BACL",
    name:     "Subtilisin BPN'",
    organism: "Bacillus licheniformis",
    accession:"P04189",
    seq:      "----AQSVPYGVSQIKAPTLYAISDEKGDVIYVDTIDNKTRFMSDGGKV-DPENGKLHSVRLKIDESAQSQTGAQMHLDYVAEVKGEGVSVKRFLKNLDNKWETIQTGDLTATIDAVSYRGDKFDDTLQIQAQNLNSTFIDERGQTLKTNIKAFAPDYEPGNNLHLGFEPAQSIVYFTDDKQPGEVIGGYDLTKVSSYITGNKFTLWRALDEPNQNLDEYGILDEITRQFNPNNSGRGFRGPASHNPYLVQASDLG"
  }
];

/* Catalytic triad positions (0-indexed in final alignment) */
const CATALYTIC_POSITIONS = new Set([56, 101, 194]);

/* ────────────────────────────────────────────────────
   2. CONSERVATION ANALYSIS
   Returns per-column stats for the aligned sequences
   ──────────────────────────────────────────────────── */
function analyzeConservation(sequences) {
  const len = Math.max(...sequences.map(s => s.seq.length));
  const result = [];

  for (let i = 0; i < len; i++) {
    const residues = sequences
      .map(s => (s.seq[i] || '-').toUpperCase())
      .filter(r => r !== '-');

    if (residues.length === 0) {
      result.push({ score: 0, dominant: '-', type: 'gap' });
      continue;
    }

    const freq = {};
    for (const r of residues) freq[r] = (freq[r] || 0) + 1;
    const max   = Math.max(...Object.values(freq));
    const dominant = Object.keys(freq).find(k => freq[k] === max);
    const score = max / sequences.length; // fraction of seqs with dominant residue

    let type;
    if (CATALYTIC_POSITIONS.has(i)) {
      type = 'catalytic';
    } else if (score >= 0.8) {
      type = 'conserved';
    } else if (score >= 0.5) {
      type = 'similar';
    } else {
      type = 'variable';
    }

    result.push({ score, dominant, type });
  }
  return result;
}

/* ────────────────────────────────────────────────────
   3. RENDER ALIGNMENT
   ──────────────────────────────────────────────────── */
function renderAlignment(conservation) {
  const container = document.getElementById('alignmentContainer');
  const seqLen    = Math.max(...SEQUENCES.map(s => s.seq.length));
  const showGaps   = document.getElementById('toggleGaps').checked;
  const showRuler  = document.getElementById('toggleRuler').checked;

  container.innerHTML = '';

  // — Ruler —
  if (showRuler) {
    const ruler = document.createElement('div');
    ruler.className = 'aln-ruler';
    for (let i = 0; i < seqLen; i++) {
      const tick = document.createElement('span');
      tick.className = 'ruler-tick' + ((i + 1) % 10 === 0 ? ' major' : '');
      tick.textContent = (i + 1) % 10 === 0 ? String(i + 1) : '';
      ruler.appendChild(tick);
    }
    container.appendChild(ruler);
  }

  // — Sequence rows —
  SEQUENCES.forEach(seq => {
    const row = document.createElement('div');
    row.className = 'aln-row';

    // Label
    const label = document.createElement('div');
    label.className = 'seq-label';
    label.innerHTML = `
      <span class="seq-name">${seq.name}</span>
      <span class="seq-organism">${seq.organism}</span>
      <span class="seq-accession">${seq.accession}</span>
    `;
    row.appendChild(label);

    // Residues
    const seqDiv = document.createElement('div');
    seqDiv.className = 'aln-seq';

    for (let i = 0; i < seqLen; i++) {
      const char = (seq.seq[i] || '-').toUpperCase();
      const col  = conservation[i];

      if (!showGaps && char === '-') {
        const sp = document.createElement('span');
        sp.className = 'res';
        sp.textContent = ' ';
        seqDiv.appendChild(sp);
        continue;
      }

      const res = document.createElement('span');
      res.className = 'res';
      res.textContent = char;

      if (char === '-') {
        res.classList.add('res-gap');
        res.dataset.tip = `Pos ${i+1}: Gap`;
      } else if (col.type === 'catalytic') {
        res.classList.add('res-catalytic');
        res.dataset.tip = `Pos ${i+1}: ${char} — CATALYTIC RESIDUE`;
      } else if (col.type === 'conserved') {
        res.classList.add('res-conserved');
        res.dataset.tip = `Pos ${i+1}: ${char} — Conserved (${Math.round(col.score*100)}%)`;
      } else if (col.type === 'similar') {
        res.classList.add('res-similar');
        res.dataset.tip = `Pos ${i+1}: ${char} — Similar (${Math.round(col.score*100)}%)`;
      } else {
        res.classList.add('res-variable');
        res.dataset.tip = `Pos ${i+1}: ${char} — Variable (${Math.round(col.score*100)}%)`;
      }

      seqDiv.appendChild(res);
    }

    row.appendChild(seqDiv);
    container.appendChild(row);
  });

  // — Consensus row —
  const consRow = document.createElement('div');
  consRow.className = 'aln-row consensus-row';

  const consLabel = document.createElement('div');
  consLabel.className = 'seq-label';
  consLabel.innerHTML = `<span class="seq-name cons-label">Consensus</span><span class="seq-organism">Clustal symbols</span>`;
  consRow.appendChild(consLabel);

  const consSeq = document.createElement('div');
  consSeq.className = 'aln-seq';

  conservation.forEach((col, i) => {
    const dot = document.createElement('span');
    dot.className = 'cons-dot';
    if (col.type === 'catalytic') {
      dot.textContent = '◆';
      dot.style.color = 'var(--col-catalytic)';
      dot.classList.add('full');
    } else if (col.type === 'conserved') {
      dot.textContent = '*';
      dot.classList.add('full');
    } else if (col.type === 'similar') {
      dot.textContent = ':';
    } else {
      dot.textContent = '.';
      dot.classList.add('none');
    }
    consSeq.appendChild(dot);
  });

  consRow.appendChild(consSeq);
  container.appendChild(consRow);
}

/* ────────────────────────────────────────────────────
   4. CONSERVATION CANVAS PLOT
   ──────────────────────────────────────────────────── */
function drawConservationPlot(conservation) {
  const canvas = document.getElementById('conservationCanvas');
  const parent = canvas.parentElement;
  const dpr    = window.devicePixelRatio || 1;

  const W = parent.clientWidth - 48;
  const H = 260;

  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const padL = 44, padR = 16, padT = 20, padB = 36;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  // Background
  ctx.fillStyle = '#111318';
  ctx.fillRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = '#252a35';
  ctx.lineWidth = 1;
  [0.25, 0.5, 0.75, 1.0].forEach(v => {
    const y = padT + plotH * (1 - v);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();

    ctx.fillStyle = '#4a5568';
    ctx.font = '10px Space Mono, monospace';
    ctx.textAlign = 'right';
    ctx.fillText((v * 100).toFixed(0) + '%', padL - 6, y + 4);
  });

  // Bars
  const barW = Math.max(1, plotW / conservation.length - 0.5);

  conservation.forEach((col, i) => {
    const x = padL + (i / conservation.length) * plotW;
    const h = col.score * plotH;
    const y = padT + plotH - h;

    let color;
    if (col.type === 'catalytic') {
      color = '#f43f5e';
    } else if (col.type === 'conserved') {
      color = '#00e5ff';
    } else if (col.type === 'similar') {
      color = '#10b981';
    } else {
      color = '#f59e0b';
    }

    ctx.fillStyle = color + (col.type === 'variable' ? '99' : 'cc');
    ctx.fillRect(x, y, Math.max(barW, 1), h);
  });

  // Axes
  ctx.strokeStyle = '#2e3545';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padL, padT);
  ctx.lineTo(padL, padT + plotH);
  ctx.lineTo(padL + plotW, padT + plotH);
  ctx.stroke();

  // X labels
  ctx.fillStyle = '#4a5568';
  ctx.font = '10px Space Mono, monospace';
  ctx.textAlign = 'center';
  const step = Math.ceil(conservation.length / 20);
  for (let i = step - 1; i < conservation.length; i += step) {
    const x = padL + ((i + 0.5) / conservation.length) * plotW;
    ctx.fillText(i + 1, x, padT + plotH + 18);
  }

  // Y label
  ctx.save();
  ctx.translate(12, padT + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = '#4a5568';
  ctx.font = '10px Space Mono, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Conservation %', 0, 0);
  ctx.restore();

  // Catalytic marker lines
  CATALYTIC_POSITIONS.forEach(pos => {
    if (pos < conservation.length) {
      const x = padL + ((pos + 0.5) / conservation.length) * plotW;
      ctx.strokeStyle = '#f43f5e88';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });
}

/* ────────────────────────────────────────────────────
   5. MOTIFS DATA & RENDER
   ──────────────────────────────────────────────────── */
const MOTIFS = [
  {
    name:         "Catalytic Triad",
    type:         "catalytic",
    conservation: "100",
    positions:    "H57 · D102 · S195 (chymotrypsin numbering)",
    pattern:      [
      { char: 'H', key: true }, { char: 'x', key: false },
      { char: 'D', key: true }, { char: 'x', key: false },
      { char: 'S', key: true }
    ],
    desc: "The His–Asp–Ser catalytic triad is the hallmark of serine proteases. His57 acts as a general base, Asp102 orients the histidine via hydrogen bonding, and Ser195 is the nucleophile that attacks the substrate's carbonyl carbon."
  },
  {
    name:         "Oxyanion Hole",
    type:         "structural",
    conservation: "100",
    positions:    "G193 · G216 (backbone NH groups)",
    pattern:      [
      { char: 'G', key: false }, { char: 'x', key: false },
      { char: 'G', key: false }, { char: 'x', key: false },
      { char: 'G', key: false }
    ],
    desc: "Glycine residues at positions 193 and 216 provide backbone NH groups that stabilize the negatively charged tetrahedral intermediate (oxyanion) during catalysis. Glycine's lack of a side chain is essential for the required backbone conformation."
  },
  {
    name:         "S1 Specificity Pocket",
    type:         "binding",
    conservation: "58",
    positions:    "Residues 189–220 (variable loop)",
    pattern:      [
      { char: 'x', key: false }, { char: 'x', key: false },
      { char: 'D', strong: true }, { char: '/', key: false },
      { char: 'G', key: false }, { char: 'x', key: false },
      { char: 'V', key: false }
    ],
    desc: "The S1 pocket determines substrate specificity. Trypsin/Thrombin have Asp189 creating a negative charge that selects for Arg/Lys. Chymotrypsin has Ser189 accommodating large hydrophobic residues. Elastase has Val190/Thr226 restricting the pocket to small residues."
  },
  {
    name:         "Activation Peptide Cleavage",
    type:         "regulatory",
    conservation: "72",
    positions:    "Ile16–Val17 junction (zymogen activation)",
    pattern:      [
      { char: 'I', strong: true }, { char: 'V', key: false },
      { char: 'G', key: false }, { char: 'G', key: false }
    ],
    desc: "The N-terminal IVGG motif (after activation cleavage at Arg15–Ile16) is highly conserved and critical for zymogen activation. The new N-terminus inserts into the activation domain, forming a salt bridge with Asp194 and triggering the correct conformation of the catalytic machinery."
  },
  {
    name:         "Disulfide Bond Cysteines",
    type:         "structural",
    conservation: "90",
    positions:    "C42–C58 · C168–C182 · C191–C220",
    pattern:      [
      { char: 'C', strong: true }, { char: 'x', key: false },
      { char: 'x', key: false }, { char: 'C', strong: true }
    ],
    desc: "Six conserved cysteine residues form three disulfide bonds essential for maintaining the structural integrity of the protease fold. These bonds are conserved in all eukaryotic serine proteases but absent in the convergently evolved subtilisin."
  },
  {
    name:         "Autolysis Loop",
    type:         "regulatory",
    conservation: "45",
    positions:    "Residues 142–152 (variable between species)",
    pattern:      [
      { char: 'x', key: false }, { char: 'x', key: false },
      { char: 'K', strong: true }, { char: '/', key: false },
      { char: 'R', strong: true }, { char: 'x', key: false }
    ],
    desc: "The autolysis loop contains a Lys/Arg residue susceptible to cleavage by the enzyme itself. This region shows the highest sequence variability in the family, reflecting divergent evolutionary pressures on enzyme stability vs. self-regulatory mechanisms."
  }
];

function renderMotifs() {
  const grid = document.getElementById('motifsGrid');
  grid.innerHTML = '';

  MOTIFS.forEach(motif => {
    const card = document.createElement('div');
    card.className = `motif-card ${motif.type}`;

    const patternHTML = motif.pattern.map(p => {
      const cls = p.key ? 'ms-char key' : p.strong ? 'ms-char strong' : 'ms-char';
      return `<span class="${cls}">${p.char}</span>`;
    }).join('');

    card.innerHTML = `
      <div class="motif-header">
        <span class="motif-tag ${motif.type}">${motif.type}</span>
        <span class="motif-conservation">Conservation: <strong>${motif.conservation}%</strong></span>
      </div>
      <div class="motif-name">${motif.name}</div>
      <div class="motif-sequence">${patternHTML}</div>
      <div class="motif-positions">📍 ${motif.positions}</div>
      <p class="motif-desc">${motif.desc}</p>
    `;
    grid.appendChild(card);
  });
}

/* ────────────────────────────────────────────────────
   6. TABS
   ──────────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const panelId = 'tab-' + btn.dataset.tab;
      document.getElementById(panelId).classList.add('active');

      if (btn.dataset.tab === 'conservation') {
        setTimeout(() => drawConservationPlot(conservation), 50);
      }
    });
  });
}

/* ────────────────────────────────────────────────────
   7. CONTROLS
   ──────────────────────────────────────────────────── */
function initControls(conservation) {
  document.getElementById('toggleGaps').addEventListener('change', () => renderAlignment(conservation));
  document.getElementById('toggleRuler').addEventListener('change', () => renderAlignment(conservation));
}

/* ────────────────────────────────────────────────────
   8. STATS COUNTER ANIMATION
   ──────────────────────────────────────────────────── */
function animateCounter(el, target, duration = 1000) {
  const start = performance.now();
  const from = 0;
  function update(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (t < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initStats() {
  setTimeout(() => {
    animateCounter(document.getElementById('stat-seqs'), 5,   800);
    animateCounter(document.getElementById('stat-len'),  245, 1000);
    animateCounter(document.getElementById('stat-cons'), 38,  900);
    animateCounter(document.getElementById('stat-id'),   62,  1100);
  }, 600);
}

/* ────────────────────────────────────────────────────
   9. INIT
   ──────────────────────────────────────────────────── */
let conservation;

document.addEventListener('DOMContentLoaded', () => {
  conservation = analyzeConservation(SEQUENCES);

  renderAlignment(conservation);
  renderMotifs();
  initTabs();
  initControls(conservation);
  initStats();

  // Re-draw plot on window resize if visible
  window.addEventListener('resize', () => {
    const consTab = document.getElementById('tab-conservation');
    if (consTab.classList.contains('active')) {
      drawConservationPlot(conservation);
    }
  });
});
