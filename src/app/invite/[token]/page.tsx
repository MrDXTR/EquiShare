import { InvitePageClient } from "../../_components/invite/InvitePageClient";

export const dynamic = 'force-dynamic';

export default function InvitePage({
  params,
}: {
  params: { token: string };
}) {
  return <InvitePageClient token={params.token} />;
}
