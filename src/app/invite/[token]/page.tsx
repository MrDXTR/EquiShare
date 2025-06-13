import { InvitePageClient } from "../../_components/invite/InvitePageClient";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InvitePageClient token={token} />;
} 