import MemberList from "@/components/admin/MemberList";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return <MemberList initialQuery={q ?? ""} />;
}
