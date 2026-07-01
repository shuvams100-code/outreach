import { supabase } from "../../../../../../src/lib/supabase";

// Upload a knowledge-base document to Supabase Storage. Real text extraction is only built for plain
// text (.txt) files today — PDFs/DOCX are stored as-is (so nothing is lost) but their content isn't
// pulled into the knowledge base automatically yet; that needs a PDF/DOCX parser (tracked as a TODO).
export async function POST(req, { params }) {
  const { id } = await params;
  const form = await req.formData();
  const file = form.get("file");
  if (!file) return Response.json({ ok: false, error: "No file provided." }, { status: 400 });

  const path = `${id}/${Date.now()}-${file.name}`;
  const bytes = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage.from("knowledge-base-docs").upload(path, bytes, { contentType: file.type || "application/octet-stream" });
  if (upErr) return Response.json({ ok: false, error: upErr.message }, { status: 500 });

  let extractedText = null;
  if (file.name.toLowerCase().endsWith(".txt")) {
    extractedText = new TextDecoder("utf-8").decode(bytes);
  }

  return Response.json({ ok: true, name: file.name, path, extractedText });
}
