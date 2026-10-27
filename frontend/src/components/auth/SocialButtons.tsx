import { socialProviders } from "@/lib/site-config";

export default function SocialButtons({
  action,
  next = "/",
}: {
  action: "로그인" | "로 시작하기";
  next?: string;
}) {
  return (
    <ul className="space-y-[5px] text-[13px]">
      {socialProviders.map((provider) => (
        <li key={provider.id}>
          {/* Plain links: the API redirects the whole page to Kakao / Naver */}
          <a
            href={`/api/auth/${provider.id}/login?next=${encodeURIComponent(next)}`}
            className="block w-full py-[12px] text-center text-[13px] leading-none hover:opacity-85"
            style={provider.style}
          >
            {provider.name}
            {action === "로그인" ? " 로그인" : action}
          </a>
        </li>
      ))}
    </ul>
  );
}
