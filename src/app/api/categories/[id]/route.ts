import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CategoryUpdate } from "@/types/database";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/categories/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;
  const body = (await request.json()) as CategoryUpdate;

  const { data, error } = await supabase
    .from("categories")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/categories/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { id } = await params;

  // Prevent deleting 'other' category (default fallback)
  if (id === "other") {
    return NextResponse.json(
      { error: "Cannot delete the default 'other' category" },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
