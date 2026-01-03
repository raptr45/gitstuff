import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await prisma.followerSnapshot.findUnique({
      where: { userId: session.user.id },
    });
    return NextResponse.json({ success: true, snapshot });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch snapshot" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { followers, following } = await req.json();

  if (!followers || !following) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  try {
    const snapshot = await prisma.followerSnapshot.upsert({
      where: { userId: session.user.id },
      update: { followers, following },
      create: {
        userId: session.user.id,
        followers,
        following,
      },
    });
    return NextResponse.json({ success: true, snapshot });
  } catch {
    return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
  }
}
