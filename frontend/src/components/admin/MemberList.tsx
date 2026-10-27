"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  Empty,
  ErrorText,
  Loading,
  PageHeader,
  Pagination,
  inputClass,
  tableClass,
  tdClass,
  thClass,
} from "@/components/admin/ui";
import {
  ADMIN_PAGE_SIZE,
  adminRequest,
  formatDate,
  formatDateTime,
  toQuery,
  useAdminQuery,
  type Page,
} from "@/lib/admin";

type Member = {
  id: number;
  login_id: string | null;
  name: string;
  email: string;
  mobile: string | null;
  providers: ("kakao" | "naver")[];
  is_active: boolean;
  agree_sms: boolean;
  agree_email: boolean;
  last_login_at: string | null;
  created_at: string;
};

const providerLabels = { kakao: "카카오", naver: "네이버" };

export default function MemberList({ initialQuery }: { initialQuery: string }) {
  const [search, setSearch] = useState(initialQuery);
  const [q, setQ] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const { data, error: loadError, reload } = useAdminQuery<Page<Member>>(
    `/api/admin/members${toQuery({ q, page })}`,
  );

  const toggle = async (member: Member) => {
    const action = member.is_active ? "이용 정지" : "정지 해제";
    if (!confirm(`${member.name} 회원을 ${action}할까요?`)) return;
    setError("");
    try {
      await adminRequest("PATCH", `/api/admin/members/${member.id}`, { is_active: !member.is_active });
      reload();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="회원 관리" />
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search.trim());
            setPage(1);
          }}
          className="relative mb-[16px] w-full max-w-[320px]"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 아이디, 이메일, 휴대전화"
            className={`${inputClass} pr-[34px]`}
          />
          <button type="submit" aria-label="검색" className="absolute top-[9px] right-[10px]">
            <Search size={15} />
          </button>
        </form>

        <ErrorText>{loadError || error}</ErrorText>
        {!data ? (
          <Loading />
        ) : data.items.length === 0 ? (
          <Empty>회원이 없습니다.</Empty>
        ) : (
          <>
            <p className="mb-[8px] text-[12.5px] text-ink-muted">총 {data.total}명</p>
            <div className="overflow-x-auto">
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={thClass}>이름</th>
                    <th className={thClass}>가입 방법</th>
                    <th className={thClass}>이메일 / 휴대전화</th>
                    <th className={thClass}>수신 동의</th>
                    <th className={thClass}>가입일</th>
                    <th className={thClass}>최근 로그인</th>
                    <th className={thClass}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((member) => (
                    <tr key={member.id}>
                      <td className={tdClass}>{member.name}</td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-[4px]">
                          {member.login_id && <Badge>아이디 {member.login_id}</Badge>}
                          {member.providers.map((provider) => (
                            <Badge key={provider} tone={provider === "kakao" ? "amber" : "green"}>
                              {providerLabels[provider]}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className={tdClass}>
                        {member.email}
                        <span className="block text-[12px] text-ink-muted">{member.mobile ?? "-"}</span>
                      </td>
                      <td className={tdClass}>
                        SMS {member.agree_sms ? "O" : "X"} · 이메일 {member.agree_email ? "O" : "X"}
                      </td>
                      <td className={tdClass}>{formatDate(member.created_at)}</td>
                      <td className={tdClass}>{formatDateTime(member.last_login_at)}</td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-[8px]">
                          {member.is_active ? <Badge tone="green">정상</Badge> : <Badge tone="red">정지</Badge>}
                          <Button variant="secondary" className="h-[28px] px-[10px]" onClick={() => toggle(member)}>
                            {member.is_active ? "정지" : "해제"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {data && (
          <Pagination page={page} total={data.total} pageSize={ADMIN_PAGE_SIZE} onChange={setPage} />
        )}
      </Card>
    </>
  );
}
