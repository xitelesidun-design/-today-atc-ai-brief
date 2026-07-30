import { readFile } from "node:fs/promises";

const requiredNewsFields = [
  "priority", "source", "sourceLanguage", "date", "titleEn", "titleZh",
  "original", "translation", "focus", "impact", "action", "url"
];
const requiredTechFields = ["mode", "title", "term", "lead", "why", "use", "tower", "sourceUrl", "sourceLabel"];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function httpsUrl(value, label) {
  try {
    assert(new URL(value).protocol === "https:", `${label} must use https`);
  } catch (error) {
    throw new Error(`${label} must be a valid https URL`);
  }
}

export function validateReport(report) {
  assert(/^\d{4}-\d{2}-\d{2}$/.test(report.reportDate), "reportDate must use YYYY-MM-DD");
  assert(typeof report.summary === "string" && report.summary.length >= 20, "summary is missing or too short");
  assert(Array.isArray(report.news) && report.news.length >= 3 && report.news.length <= 6, "news must contain 3-6 items");
  report.news.forEach((item, index) => {
    requiredNewsFields.forEach((field) => assert(typeof item[field] === "string" && item[field].trim(), `news[${index}].${field} is required`));
    assert(["high", "medium", "low"].includes(item.priority), `news[${index}].priority is invalid`);
    assert(item.original.split(/\s+/).filter(Boolean).length <= 25, `news[${index}].original must not exceed 25 words`);
    httpsUrl(item.url, `news[${index}].url`);
  });
  assert(report.tech && typeof report.tech === "object", "tech is required");
  requiredTechFields.forEach((field) => assert(typeof report.tech[field] === "string" && report.tech[field].trim(), `tech.${field} is required`));
  assert(["update", "term"].includes(report.tech.mode), "tech.mode is invalid");
  httpsUrl(report.tech.sourceUrl, "tech.sourceUrl");
  return true;
}

const file = process.argv[2];
if (file) {
  const report = JSON.parse(await readFile(file, "utf8"));
  validateReport(report);
  console.log(`Validated ${file}: ${report.news.length} news items, ${report.tech.mode} technology item.`);
}
