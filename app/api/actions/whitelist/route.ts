import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUsername = searchParams.get("targetUsername");

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const whitelists = await prisma.whitelist.findMany({
    where: {
      userId: session.user.id,
      ...(targetUsername ? { targetUsername } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    data: whitelists.map((w) => ({
      targetUsername: w.targetUsername,
      whiteListed: w.whiteListed,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUsername, login, action } = await req.json();

  if (!targetUsername || !login) {
    return NextResponse.json(
      { error: "targetUsername and login are required" },
      { status: 400 }
    );
  }

  if (action === "toggle") {
    const existing = await prisma.whitelist.findUnique({
      where: {
        userId_targetUsername_whiteListed: {
          userId: session.user.id,
          targetUsername,
          whiteListed: login,
        },
      },
    });

    if (existing) {
      await prisma.whitelist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, whitelisted: false });
    } else {
      await prisma.whitelist.create({
        data: {
          userId: session.user.id,
          targetUsername,
          whiteListed: login,
        },
      });
      return NextResponse.json({ success: true, whitelisted: true });
    }
  }

  // Bulk sync logic removed for now
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
