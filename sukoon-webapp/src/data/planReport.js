// Renders the AI questionnaire's original, un-flattened output (see
// aiPlanMapper.js's `raw` field) as a plain-text report — the same
// structure used for both the downloadable PDF and the WhatsApp/email
// share text, so all three always say the same thing.

export function buildReportSections(profile) {
  const raw = profile?.plan?.raw;
  if (!raw) return null;

  const sections = [];

  if (raw.profile) {
    const { title, mainDriver, overlay, ruleOut, explanation } = raw.profile;
    sections.push({
      heading: "My Likely Type",
      lines: [
        title,
        [mainDriver, overlay].filter(Boolean).join(" "),
        ruleOut ? `Rule out: ${ruleOut}` : null,
        explanation,
      ].filter(Boolean),
    });
  }

  if (raw.tests?.length) {
    sections.push({
      heading: "Tests to Get",
      lines: raw.tests.map((t) => `${t.name} — ${t.note}`),
    });
  }

  if (raw.plate?.length) {
    sections.push({
      heading: "Plate (What to Eat)",
      lines: [...raw.plate, raw.plateNote].filter(Boolean),
    });
  }

  if (raw.movement?.length) {
    sections.push({
      heading: "Movement",
      lines: [...raw.movement, raw.movementNote].filter(Boolean),
    });
  }

  if (raw.clinician?.length) {
    sections.push({
      heading: "Discuss with Your Doctor",
      lines: [...raw.clinician, raw.clinicianNote].filter(Boolean),
    });
  }

  if (raw.timeline?.length) {
    sections.push({
      heading: "Timeline",
      lines: raw.timeline.map((t) => `${t.when}: ${t.what}`),
    });
  }

  return sections;
}

export function buildReportSummaryText(profile) {
  const sections = buildReportSections(profile);
  if (!sections) return "";
  const name = profile?.name;
  const header = `${name ? name + "'s" : "My"} Sukoon Health Plan\n\n`;
  const body = sections
    .map((s) => `${s.heading}\n${s.lines.map((l) => `• ${l}`).join("\n")}`)
    .join("\n\n");
  return header + body;
}
