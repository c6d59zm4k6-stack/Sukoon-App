import { jsPDF } from "jspdf";
import { buildReportSections } from "../data/planReport.js";

// Renders the same sections used for the WhatsApp/email summary as an
// actual downloadable PDF, so what someone downloads matches what they'd
// share as text.
export function downloadPlanPdf(profile) {
  const sections = buildReportSections(profile);
  if (!sections) return false;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const name = profile?.name;
  doc.text(`${name ? name + "'s" : "My"} Sukoon Health Plan`, margin, y);
  y += 28;

  sections.forEach((section) => {
    ensureSpace(24);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(section.heading, margin, y);
    y += 18;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    section.lines.forEach((line) => {
      const wrapped = doc.splitTextToSize(`•  ${line}`, maxWidth);
      wrapped.forEach((row) => {
        ensureSpace(14);
        doc.text(row, margin, y);
        y += 14;
      });
    });
    y += 12;
  });

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  ensureSpace(20);
  doc.text("Educational only — not a medical diagnosis. Discuss with a doctor before acting on it.", margin, y);

  const fileName = `sukoon-plan${name ? "-" + name.toLowerCase().replace(/\s+/g, "-") : ""}.pdf`;
  doc.save(fileName);
  return true;
}
