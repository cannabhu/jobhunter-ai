import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/insforge/profile";
import { createInsforgeServer, getUser } from "@/lib/insforge/server";
import { MAX_RESUME_SIZE_BYTES } from "@/lib/resume";

const PDF_SIGNATURE = "%PDF-";

const fail = (error: string, status: number) => NextResponse.json({ success: false, error }, { status });

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user) return fail("Your session has expired. Please sign in again.", 401);

    const formData = await req.formData();
    const file = formData.get("resume");
    if (!(file instanceof File)) return fail("Choose a PDF file to upload.", 400);
    if (file.type !== "application/pdf") return fail("Only PDF files are supported.", 400);
    if (file.size === 0) return fail("That file is empty. Please choose another PDF.", 400);
    if (file.size > MAX_RESUME_SIZE_BYTES) return fail("That file is larger than 5MB. Please choose a smaller PDF.", 413);

    // The declared type comes from the client, so also check the file really starts like a PDF.
    const header = await file.slice(0, PDF_SIGNATURE.length).text();
    if (header !== PDF_SIGNATURE) return fail("That file doesn't look like a valid PDF.", 400);

    // Makes sure the profiles row exists before we point it at the file.
    const profile = await getProfile();
    if (!profile) return fail("We couldn't load your profile. Please try again.", 500);

    const insforge = await createInsforgeServer();
    // The key is built from the session user, never from the request.
    const { data: uploaded, error: uploadError } = await insforge.storage
      .from("resumes")
      .upload(`${user.id}/resume.pdf`, file);
    if (uploadError || !uploaded) throw uploadError ?? new Error("Upload returned no data");

    const { data: updated, error: updateError } = await insforge.database
      .from("profiles")
      .update({ resume_pdf_url: uploaded.url })
      .eq("id", user.id)
      .select("id");
    if (updateError) throw updateError;
    if (!updated || updated.length === 0) throw new Error("Profile update matched no rows");

    revalidatePath("/profile");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[resume/upload]", error);
    return fail("We couldn't upload your resume. Please try again.", 500);
  }
}
