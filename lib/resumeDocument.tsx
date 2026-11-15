import { Document, Page, renderToBuffer, StyleSheet, Text, View } from "@react-pdf/renderer";
import { TRIM_STEP_COUNT, trimResumeContent, type ResumeContent } from "@/lib/resumeContent";

// Server-only: imported by the generate route and nothing in the browser. A PDF has no CSS variables, so the
// layout is monochrome and uses named colors rather than hex values. Helvetica ships with the renderer.

const styles = StyleSheet.create({
  page: { paddingTop: 36, paddingBottom: 36, paddingHorizontal: 42, fontFamily: "Helvetica", fontSize: 9.5, color: "black", lineHeight: 1.35 },
  name: { fontSize: 22, fontWeight: "bold", lineHeight: 1.2 },
  title: { fontSize: 11, color: "dimgray", marginTop: 3 },
  contact: { fontSize: 9, color: "dimgray", marginTop: 4 },
  section: { marginTop: 12 },
  heading: { fontSize: 10, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", borderBottomWidth: 0.75, borderBottomColor: "black", paddingBottom: 2, marginBottom: 5 },
  role: { marginBottom: 6 },
  roleHeader: { flexDirection: "row", justifyContent: "space-between" },
  roleTitle: { fontWeight: "bold" },
  dates: { color: "dimgray" },
  company: { color: "dimgray", marginBottom: 2 },
  bullet: { flexDirection: "row", marginTop: 1.5 },
  bulletMark: { width: 10 },
  bulletText: { flex: 1 },
  muted: { color: "dimgray" },
});

function ResumeDocument({ content }: { content: ResumeContent }) {
  return (
    <Document title={`${content.name} — Resume`} author={content.name}>
      <Page size="A4" style={styles.page}>
        <View>
          <Text style={styles.name}>{content.name}</Text>
          {content.title ? <Text style={styles.title}>{content.title}</Text> : null}
          {content.contact.length > 0 ? <Text style={styles.contact}>{content.contact.join("  |  ")}</Text> : null}
        </View>

        {content.summary ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Summary</Text>
            <Text>{content.summary}</Text>
          </View>
        ) : null}

        {content.roles.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Experience</Text>
            {content.roles.map((role, index) => (
              <View key={index} style={styles.role} wrap={false}>
                <View style={styles.roleHeader}>
                  <Text style={styles.roleTitle}>{role.title || role.company}</Text>
                  {role.dates ? <Text style={styles.dates}>{role.dates}</Text> : null}
                </View>
                {role.title && role.company ? <Text style={styles.company}>{role.company}</Text> : null}
                {role.bullets.map((bullet, bulletIndex) => (
                  <View key={bulletIndex} style={styles.bullet}>
                    <Text style={styles.bulletMark}>•</Text>
                    <Text style={styles.bulletText}>{bullet}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : null}

        {content.education ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Education</Text>
            <Text style={styles.roleTitle}>{content.education.heading}</Text>
            {content.education.detail ? <Text style={styles.muted}>{content.education.detail}</Text> : null}
          </View>
        ) : null}

        {content.skills.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.heading}>Skills</Text>
            <Text>{content.skills.join(", ")}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/** Counts page objects in the PDF; `/Pages` (the tree) is excluded by the word boundary. */
const countPages = (pdf: Buffer): number => (pdf.toString("latin1").match(/\/Type\s*\/Page\b/g) ?? []).length;

/**
 * Renders the resume to PDF bytes, always on a single page. Calls the component directly because renderToBuffer
 * wants the <Document> element itself. Content past one page is trimmed step by step and rendered again.
 */
export async function renderResumePdf(content: ResumeContent): Promise<Buffer> {
  let pdf = await renderToBuffer(ResumeDocument({ content }));
  for (let step = 0; step < TRIM_STEP_COUNT && countPages(pdf) > 1; step++) {
    pdf = await renderToBuffer(ResumeDocument({ content: trimResumeContent(content, step) }));
  }
  return pdf;
}
