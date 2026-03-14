import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/transactions?month=2026-01&type=expense&category=food&search=apple
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = request.nextUrl;

  const month = searchParams.get("month"); // YYYY-MM
  const type = searchParams.get("type"); // income | expense
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const excludeInternal = searchParams.get("excludeInternal") !== "false"; // default true
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  let query = supabase
    .from("transactions")
    .select("*", { count: "exact" })
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (month) {
    const [year, mon] = month.split("-");
    const startDate = `${year}-${mon}-01`;
    const endDate = getLastDayOfMonth(parseInt(year), parseInt(mon));
    query = query.gte("date", startDate).lte("date", endDate);
  }

  if (type === "income" || type === "expense") {
    query = query.eq("type", type);
  }

  if (category) {
    query = query.eq("category_id", category);
  }

  if (search) {
    query = query.or(`merchant.ilike.%${search}%,description.ilike.%${search}%`);
  }

  if (excludeInternal) {
    query = query.eq("is_internal_transfer", false);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count });
}

// POST /api/transactions (single or batch insert)
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  // Support both single and batch insert
  const transactions = Array.isArray(body) ? body : [body];

  if (transactions.length === 0) {
    return NextResponse.json({ error: "No transactions provided" }, { status: 400 });
  }

  // Validate required fields
  for (const tx of transactions) {
    if (!tx.date || !tx.merchant || tx.amount === undefined || !tx.type || !tx.category_id) {
      return NextResponse.json(
        { error: "Missing required fields: date, merchant, amount, type, category_id" },
        { status: 400 }
      );
    }
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert(transactions)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

function getLastDayOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month, 0).getDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}
