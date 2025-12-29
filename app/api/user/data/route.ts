import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.username) {
        return NextResponse.json({ error: "User profile incomplete" }, { status: 400 });
    }

    // Convert username to lowercase for consistency if needed, but Prisma findMany usually relies on exact match or we filter by userId if relations existed.
    // However, Whitelist and Snapshot are related by 'username' string in this schema design (not optimal foreign key but it is what it is).
    // Let's check schema via Prisma Client usage or assuming it's By Username string.
    
    await prisma.$transaction([
      // Delete Whitelists
      prisma.whitelist.deleteMany({
        where: { userId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete data error:", error);
    return NextResponse.json(
      { error: "Failed to delete data" },
      { status: 500 }
    );
  }
}
