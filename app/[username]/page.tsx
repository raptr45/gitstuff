import { UserPageClient } from "@/components/user-page-client";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ username: string }>;
}

export default async function UserPage({ params }: Props) {
  const { username } = await params;

  if (!username) return notFound();

  return <UserPageClient username={username} />;
}
