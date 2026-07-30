const colors = {
  high: { color: "#c85b2a", bg: "#fff0e7" },
  medium: { color: "#217b98", bg: "#eaf1f6" },
  low: { color: "#45805d", bg: "#e9f4eb" }
};

const priorityLabels = {
  high: "重点关注 · 高",
  medium: "趋势跟踪 · 中",
  low: "行业参考 · 低"
};

const list = document.querySelector("#news-list");
const reportDate = document.querySelector("#report-date");
const reportEdition = document.querySelector("#report-edition");
const reportStatus = document.querySelector("#report-status");
const briefingText = document.querySelector("#briefing-text");
const archivePicker = document.querySelector("#archive-picker");
const techContent = document.querySelector("#tech-content");
const sourceLine = document.querySelector("#source-line");

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;"
  }[character]));
}

function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "#";
  } catch {
    return "#";
  }
}

function updateCounts(items) {
  const totals = items.reduce((result, item) => {
    result[item.priority] = (result[item.priority] || 0) + 1;
    return result;
  }, { high: 0, medium: 0, low: 0 });
  document.querySelector("[data-filter='all'] span").textContent = items.length;
  ["high", "medium", "low"].forEach((priority) => {
    document.querySelector(`[data-filter='${priority}'] span`).textContent = totals[priority] || 0;
  });
  document.querySelector("#news-heading").textContent = `${items.length} 条精选资讯`;
  document.querySelector("#high-count").textContent = totals.high || 0;
  document.querySelector("#medium-count").textContent = totals.medium || 0;
  document.querySelector("#low-count").textContent = totals.low || 0;
}

function makeCard(item, number) {
  const palette = colors[item.priority] || colors.low;
  const article = document.createElement("article");
  article.className = "news-card";
  article.dataset.priority = item.priority;
  article.style.setProperty("--level-color", palette.color);
  article.style.setProperty("--level-bg", palette.bg);
  article.innerHTML = `
    <div class="card-top">
      <div>
        <p class="source-line">${String(number).padStart(2, "0")} · ${escapeHtml(item.source)}<span>${escapeHtml(item.date)}</span><span>${escapeHtml(item.sourceLanguage)}</span></p>
        <h3 class="english-title">${escapeHtml(item.titleEn)}</h3>
        <p class="chinese-title">${escapeHtml(item.titleZh)}</p>
      </div>
      <span class="tag">${escapeHtml(item.priorityLabel || priorityLabels[item.priority])}</span>
    </div>
    <div class="translation">
      <div><span class="label">ENGLISH SOURCE EXTRACT</span><p class="en">${escapeHtml(item.original)}</p></div>
      <div><span class="label">中文翻译</span><p>${escapeHtml(item.translation)}</p></div>
    </div>
    <div class="assessment">
      <div class="assessment-item"><strong>是否重点关注</strong><p>${escapeHtml(item.focus)}</p></div>
      <div class="assessment-item"><strong>AI 影响研判</strong><p>${escapeHtml(item.impact)}</p></div>
      <div class="assessment-item"><strong>建议动作</strong><p>${escapeHtml(item.action)}</p></div>
    </div>
    <a class="source-link" href="${safeUrl(item.url)}" target="_blank" rel="noopener noreferrer">查看英文官方原文</a>`;
  return article;
}

function renderTech(tech) {
  const isUpdate = tech.mode === "update";
  document.querySelector("#tech-kicker").textContent = isUpdate ? "TECHNOLOGY RADAR · UPDATE" : "TECHNOLOGY RADAR · DAILY TERM";
  document.querySelector("#tech-title").textContent = isUpdate ? `技术雷达：${tech.title}` : `今日名词学习：${tech.title}`;
  document.querySelector("#tech-badge").textContent = isUpdate ? "今日技术动态" : "今日无更高优先级技术发布";
  techContent.innerHTML = `
    <div class="tech-main">
      <p class="tech-term">${escapeHtml(tech.term)}</p>
      <p class="tech-lead">${escapeHtml(tech.lead)}</p>
    </div>
    <div class="tech-detail"><strong>${isUpdate ? "发生了什么" : "为什么出现"}</strong><p>${escapeHtml(tech.why)}</p></div>
    <div class="tech-detail"><strong>${isUpdate ? "运行价值" : "怎样用于运行"}</strong><p>${escapeHtml(tech.use)}</p></div>
    <div class="tech-detail"><strong>对塔台意味着什么</strong><p>${escapeHtml(tech.tower)}</p></div>
    <a class="source-link tech-link" href="${safeUrl(tech.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(tech.sourceLabel || "查看技术来源")}</a>`;
}

function renderReport(report) {
  const items = Array.isArray(report.news) ? report.news : [];
  list.replaceChildren(...items.map(makeCard));
  updateCounts(items);
  reportDate.textContent = (report.reportDate || "--").replaceAll("-", ".");
  reportEdition.textContent = report.edition || "今日快报";
  reportStatus.textContent = report.status === "published" ? "已完成来源核验" : "样例数据 · 待自动更新";
  reportStatus.classList.toggle("is-sample", report.status !== "published");
  briefingText.textContent = report.summary || "暂无本期摘要。";
  sourceLine.textContent = `信息截止：${report.generatedAt || report.reportDate || "--"} CST`;
  renderTech(report.tech);
}

async function loadArchiveIndex() {
  try {
    const response = await fetch("data/index.json", { cache: "no-store" });
    if (!response.ok) return;
    const index = await response.json();
    (index.reports || []).forEach((entry) => {
      if (entry.date === window.DAILY_REPORT?.reportDate) return;
      const option = document.createElement("option");
      option.value = entry.path;
      option.textContent = `${entry.date} · ${entry.title || "历史快报"}`;
      archivePicker.append(option);
    });
  } catch {
    // Local file preview has no fetch permission; the embedded latest report remains available.
  }
}

archivePicker.addEventListener("change", async () => {
  if (!archivePicker.value) {
    renderReport(window.DAILY_REPORT);
    return;
  }
  archivePicker.disabled = true;
  try {
    const response = await fetch(archivePicker.value, { cache: "no-store" });
    if (!response.ok) throw new Error("archive unavailable");
    renderReport(await response.json());
  } catch {
    archivePicker.value = "";
    window.alert("该期日报暂时无法加载，请稍后重试。");
  } finally {
    archivePicker.disabled = false;
  }
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach((item) => item.classList.toggle("active", item === button));
    document.querySelectorAll(".news-card").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.priority !== filter;
    });
  });
});

renderReport(window.DAILY_REPORT);
loadArchiveIndex();
