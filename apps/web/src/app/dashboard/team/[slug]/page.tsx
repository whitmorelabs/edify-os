import { ARCHETYPE_SLUGS } from "@/lib/archetype-config";
import TeamChatClient from "./TeamChatClient";

export function generateStaticParams() {
  return ARCHETYPE_SLUGS.map((slug) => ({ slug }));
}

export default function TeamChatPage({
  params,
}: {
  params: { slug: string };
}) {
  return <TeamChatClient params={params} />;
}
