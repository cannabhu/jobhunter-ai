import { connection, NextResponse, type NextRequest } from "next/server";
import { downloadResume } from "@/lib/insforge/resumeStorage";
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
    const download = await downloadResume(insforge, user.id, "resume/file");
    if (!download.ok) {
      // Only a real "no such file" is a 404; anything else is a storage failure and the user can try again.
      return download.status === 404
        ? fail("No resume found.", 404)
        : fail("We couldn't load your resume right now. Please try again in a moment.", 502);
    }

    return new Response(download.file, {
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
