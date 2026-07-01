import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.status === "string") data.status = body.status;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const job = await prisma.job.update({ where: { id: Number(id) }, data });
  return NextResponse.json(job);
}
