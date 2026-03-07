// Sustainability Marketing Dashboard - Application Logic

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
});

function renderAll() {
  document.getElementById("lastUpdated").textContent =
    "Updated: " + new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

  renderPositioningSummary();
  renderKPIs();
  renderTrendChart();
  renderPillarChart();
  renderScorecard();
  renderThemeBubbles();
  renderGapChart();
  renderCampaignFeed();
}

function refreshData() {
  document.querySelector(".btn-refresh").textContent = "Refreshing...";
  setTimeout(() => {
    renderAll();
    document.querySelector(".btn-refresh").textContent = "Refresh Data";
  }, 600);
}

// --- Positioning Summary ---
function renderPositioningSummary() {
  const crocs = BRANDS.crocs;
  const allScores = Object.values(BRANDS).map(b => b.overallScore).sort((a, b) => b - a);
  const rank = allScores.indexOf(crocs.overallScore) + 1;
  const total = allScores.length;
  const avgScore = Math.round(allScores.reduce((a, b) => a + b, 0) / total);
  const gap = crocs.overallScore - avgScore;

  const items = [
    { label: "Industry Rank", value: `#${rank} of ${total}`, detail: "Among tracked peer brands" },
    { label: "Overall Score", value: `${crocs.overallScore}/100`, detail: `Peer average: ${avgScore}` },
    { label: "vs. Peer Average", value: `${gap > 0 ? "+" : ""}${gap} pts`, detail: gap >= 0 ? "Above average" : "Below average - opportunity" },
    { label: "Campaign Volume Trend", value: crocs.trend === "up" ? "Rising" : crocs.trend === "down" ? "Falling" : "Steady", detail: `${crocs.campaignVolume} campaigns this period` },
    { label: "Consumer Sentiment", value: `${crocs.sentimentScore}%`, detail: "Positive sustainability perception" },
  ];

  const grid = document.getElementById("positioningGrid");
  grid.innerHTML = items.map(item => `
    <div class="positioning-item">
      <div class="label">${item.label}</div>
      <div class="value">${item.value}</div>
      <div class="detail">${item.detail}</div>
    </div>
  `).join("");
}

// --- KPI Cards ---
function renderKPIs() {
  const brands = Object.values(BRANDS);
  const avgVolume = Math.round(brands.reduce((s, b) => s + b.campaignVolume, 0) / brands.length);
  const topScorer = brands.reduce((a, b) => a.overallScore > b.overallScore ? a : b);
  const positiveCount = brands.filter(b => b.sentiment === "positive").length;

  const kpis = [
    { value: brands.length, label: "Brands Tracked", change: null },
    { value: avgVolume, label: "Avg Campaign Volume", change: "+12% QoQ", dir: "up" },
    { value: topScorer.name, label: "Current Leader", change: `Score: ${topScorer.overallScore}`, dir: "up" },
    { value: `${positiveCount}/${brands.length}`, label: "Positive Sentiment", change: "Industry improving", dir: "up" },
  ];

  const row = document.getElementById("kpiRow");
  row.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-label">${k.label}</div>
      ${k.change ? `<div class="kpi-change ${k.dir || ""}">${k.change}</div>` : ""}
    </div>
  `).join("");
}

// --- Trend Chart ---
function renderTrendChart() {
  const ctx = document.getElementById("trendChart").getContext("2d");
  const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

  const brandColors = {
    crocs: { border: "#43B02A", bg: "rgba(67,176,42,0.15)" },
    nike: { border: "#111", bg: "rgba(17,17,17,0.05)" },
    adidas: { border: "#0066b2", bg: "rgba(0,102,178,0.05)" },
    allbirds: { border: "#006A4E", bg: "rgba(0,106,78,0.05)" },
    puma: { border: "#e4002b", bg: "rgba(228,0,43,0.05)" },
    birkenstock: { border: "#8b6914", bg: "rgba(139,105,20,0.05)" },
  };

  const highlightBrands = ["crocs", "nike", "adidas", "allbirds", "puma", "birkenstock"];

  const datasets = highlightBrands.map(key => {
    const b = BRANDS[key];
    const colors = brandColors[key] || { border: "#999", bg: "rgba(153,153,153,0.05)" };
    return {
      label: b.name,
      data: b.monthlyVolume,
      borderColor: colors.border,
      backgroundColor: colors.bg,
      borderWidth: key === "crocs" ? 3 : 1.5,
      pointRadius: key === "crocs" ? 4 : 2,
      fill: key === "crocs",
      tension: 0.3,
    };
  });

  if (window._trendChart) window._trendChart.destroy();
  window._trendChart = new Chart(ctx, {
    type: "line",
    data: { labels: months, datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, padding: 16, font: { size: 11 } } },
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: "Campaign / Mention Volume" } },
      },
    },
  });
}

// --- Pillar Chart ---
function renderPillarChart() {
  const ctx = document.getElementById("pillarChart").getContext("2d");

  const pillarCounts = {};
  Object.values(BRANDS).forEach(b => {
    b.pillars.forEach(p => {
      pillarCounts[p] = (pillarCounts[p] || 0) + 1;
    });
  });

  const sorted = Object.entries(pillarCounts).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(s => s[0]);
  const values = sorted.map(s => s[1]);

  const hasCrocs = labels.map(l => BRANDS.crocs.pillars.includes(l));
  const colors = hasCrocs.map(h => h ? "#43B02A" : "#C8E6B8");

  if (window._pillarChart) window._pillarChart.destroy();
  window._pillarChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Brands Using Pillar",
        data: values,
        backgroundColor: colors,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => hasCrocs[ctx.dataIndex] ? "Crocs is active here" : "Crocs opportunity",
          },
        },
      },
      scales: {
        x: { beginAtZero: true, title: { display: true, text: "Number of Brands" } },
      },
    },
  });
}

// --- Scorecard Table ---
let scorecardData = [];

function renderScorecard() {
  scorecardData = Object.values(BRANDS).sort((a, b) => b.overallScore - a.overallScore);
  renderScorecardRows(scorecardData);
}

function renderScorecardRows(data) {
  const tbody = document.getElementById("scorecardBody");
  tbody.innerHTML = data.map(b => {
    const sentimentClass = b.sentiment === "positive" ? "sentiment-positive" :
                           b.sentiment === "neutral" ? "sentiment-neutral" : "sentiment-mixed";
    const trendClass = b.trend === "up" ? "trend-up" : b.trend === "down" ? "trend-down" : "trend-flat";
    const trendArrow = b.trend === "up" ? "&#9650;" : b.trend === "down" ? "&#9660;" : "&#9644;";
    const rowClass = b.isSelf ? 'class="is-crocs"' : "";

    return `<tr ${rowClass}>
      <td><strong>${b.name}</strong>${b.isSelf ? " (You)" : ""}</td>
      <td>
        <div class="score-bar">
          <span class="score-bar-fill" style="width:${b.overallScore}px"></span>
          <span>${b.overallScore}</span>
        </div>
      </td>
      <td>${b.campaignVolume}</td>
      <td><div class="pillar-tags">${b.pillars.map(p => `<span class="pillar-tag">${p}</span>`).join("")}</div></td>
      <td><span class="sentiment-badge ${sentimentClass}">${b.sentimentScore}% ${b.sentiment}</span></td>
      <td style="max-width:250px;font-size:0.8rem;">${b.recentInitiative}</td>
      <td><span class="trend-arrow ${trendClass}">${trendArrow}</span></td>
    </tr>`;
  }).join("");
}

function filterTable() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  const filtered = scorecardData.filter(b =>
    b.name.toLowerCase().includes(query) ||
    b.pillars.some(p => p.toLowerCase().includes(query)) ||
    b.recentInitiative.toLowerCase().includes(query)
  );
  renderScorecardRows(filtered);
}

function sortTable() {
  const sortBy = document.getElementById("sortSelect").value;
  const sorted = [...scorecardData];
  switch (sortBy) {
    case "name": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "volume": sorted.sort((a, b) => b.campaignVolume - a.campaignVolume); break;
    case "sentiment": sorted.sort((a, b) => b.sentimentScore - a.sentimentScore); break;
    default: sorted.sort((a, b) => b.overallScore - a.overallScore);
  }
  renderScorecardRows(sorted);
}

// --- Theme Bubbles ---
function renderThemeBubbles() {
  const container = document.getElementById("themeBubbles");
  container.innerHTML = EMERGING_THEMES.map(t => {
    const size = 0.7 + (t.weight / 100) * 0.6;
    return `<span class="theme-bubble" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}44;font-size:${size}rem;" title="Trend strength: ${t.weight}/100">${t.label}</span>`;
  }).join("");
}

// --- Gap Analysis Radar ---
function renderGapChart() {
  const ctx = document.getElementById("gapChart").getContext("2d");

  if (window._gapChart) window._gapChart.destroy();
  window._gapChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: GAP_DIMENSIONS,
      datasets: [
        {
          label: "Crocs",
          data: GAP_DATA.crocs,
          borderColor: "#43B02A",
          backgroundColor: "rgba(67,176,42,0.2)",
          borderWidth: 2,
          pointRadius: 4,
        },
        {
          label: "Peer Average",
          data: GAP_DATA.peerAverage,
          borderColor: "#6b7280",
          backgroundColor: "rgba(107,114,128,0.1)",
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 3,
        },
        {
          label: "Category Leader",
          data: GAP_DATA.leader,
          borderColor: "#006A4E",
          backgroundColor: "rgba(0,106,78,0.05)",
          borderWidth: 1,
          borderDash: [2, 2],
          pointRadius: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: { stepSize: 25, font: { size: 10 } },
          pointLabels: { font: { size: 11 } },
        },
      },
      plugins: {
        legend: { position: "bottom", labels: { usePointStyle: true, padding: 12, font: { size: 11 } } },
      },
    },
  });
}

// --- Campaign Feed ---
function renderCampaignFeed() {
  const container = document.getElementById("campaignFeed");
  const sorted = [...RECENT_CAMPAIGNS].sort((a, b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = sorted.map(c => {
    const dateStr = new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isCrocs = c.brand === "Crocs";
    return `<div class="campaign-item" style="${isCrocs ? "border-left:3px solid #43B02A;" : ""}">
      <div class="campaign-brand">${c.brand}${isCrocs ? " (You)" : ""}</div>
      <div class="campaign-title">${c.title}</div>
      <div class="campaign-desc">${c.description}</div>
      <div class="campaign-meta">
        <span>${dateStr}</span>
        <span>${c.channel}</span>
        <span>Engagement: ${c.engagement}</span>
      </div>
    </div>`;
  }).join("");
}
