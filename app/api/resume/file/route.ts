import { connection, NextResponse, type NextRequest } from "next/server";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

/** Streams the signed-in user's own resume. The bucket is private, so this is the only way a browser reads it. */
export async function GET(req: NextRequest) {
  // Outside the try/catch: with cacheComponents Next prerenders GET handlers and ends that pass by rejecting here.
  await connection();
  try {
    const user = await getUser();
    // This URL is opened as a page navigation, so a dead session goes to the login screen, not a JSON error.
    if (!user) return NextResponse.redirect(new URL("/login?error=session", req.url));

    const insforge = await createInsforgeServer();
    const { data, error } = await insforge.storage.from("resumes").download(`${user.id}/resume.pdf`);
    if (error || !data) return fail("No resume found.", 404);

    return new Response(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="resume.pdf"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[resume/file]", error);
    return fail("We couldn't load your resume. Please try again.", 500);
  }
}
