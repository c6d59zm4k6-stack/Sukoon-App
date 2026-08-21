import { jsPDF } from "jspdf";
import { buildReportSections } from "../data/planReport.js";

const MARGIN = 48;
const PAGE_WIDTH = 595; // A4 pt
const PAGE_HEIGHT = 842;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function downloadPlanPdf(profile) {
  const sections = buildReportSections(profile);
  if (!sections) return false;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (needed) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const title = `${profile?.name ? profile.name + "'s" : "My"} Sukoon Health Plan`;
  doc.text(title, MARGIN, y);
  y += 26;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text("Educational content, not a medical diagnosis.", MARGIN, y);
  doc.setTextColor(20);
  y += 24;

  sections.forEach((section) => {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(section.heading, MARGIN, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    section.lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(`•  ${line}`, CONTENT_WIDTH);
      ensureSpace(wrapped.length * 14 + 4);
      doc.text(wrapped, MARGIN, y);
      y += wrapped.length * 14 + 4;
    });
    y += 10;
  });

  const fileName = `sukoon-plan${profile?.name ? "-" + profile.name.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`;
  doc.save(fileName);
  return true;
}
