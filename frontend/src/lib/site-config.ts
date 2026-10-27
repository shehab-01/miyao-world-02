import { marketingNotice, privacyNotice, termsOfService } from "@/lib/legal";
export type UtilityNavItem = {
  label: string;
  href: string;
  action?: "logout";
};

const accountRow: UtilityNavItem[] = [
  { label: "CART", href: "/cart" },
  { label: "ORDER", href: "/order" },
  { label: "MYPAGE", href: "/mypage" },
];

export const utilityNav = {
  guest: [
    [{ label: "LOGIN", href: "/login" }, { label: "JOIN", href: "/join" }],
    accountRow,
  ] as UtilityNavItem[][],
  member: [
    [
      { label: "LOGOUT", href: "/", action: "logout" },
      { label: "EDIT", href: "/mypage/profile" },
    ],
    accountRow,
  ] as UtilityNavItem[][],
};

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

export const secondaryNav: NavItem[] = [
  { label: "ABOUT US", href: "/about" },
  { label: "CS CENTER", href: "/cs-center" },
  { label: "BANK ACCOUNT", href: "/bank-account" },
  { label: "DELIVERY", href: "/delivery" },
];

export const socialLinks = [
  { label: "Facebook", href: "#" },
  { label: "Twitter", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "Blog", href: "#" },
];

export const footerNav = [
  { label: "HOME", href: "/" },
  { label: "ABOUT US", href: "/about" },
  { label: "AGREEMENT", href: "/agreement" },
  { label: "PRIVACY POLICY", href: "/privacy" },
  { label: "GUIDE", href: "/guide" },
];

export const company = {
  tel: "010-7527-1673",
  bank: "신한은행 110-498-133973",
  accountHolder: "Miyaoworld",
  name: "미야오 월드 (Miyao world)",
  owner: "최수정",
  address: "서울 용산구 회나무로 12가길 13-4 /3",
  webMaster: "최수정 (sjek78@naver.com)",
  businessLicence: "739-19-01787",
  mailOrderLicence: "2022-서울용산-0864",
  copyright: "미야오월드",
};

export const productShipping = ["국내배송", "택배", "2,500원 (50,000원 이상 구매 시 무료)"];

export type JoinField = {
  id: string;
  label: string;
  required: boolean;
  type?: "text" | "password" | "email" | "phone";
  help?: string;
};

export const joinFields: JoinField[] = [
  {
    id: "memberId",
    label: "아이디",
    required: true,
    help: "(영문소문자/숫자, 4~16자)",
  },
  {
    id: "password",
    label: "비밀번호",
    required: true,
    type: "password",
    help: "(영문 대소문자/숫자/특수문자 중 2가지 이상 조합, 10자~16자)",
  },
  { id: "passwordConfirm", label: "비밀번호 확인", required: true, type: "password" },
  { id: "name", label: "이름", required: true },
  { id: "mobile", label: "휴대전화", required: false, type: "phone" },
  { id: "email", label: "이메일", required: true, type: "email" },
];

export const mobilePrefixes = ["010", "011", "016", "017", "018", "019"];

export const socialProviders = [
  { id: "kakao", name: "카카오", style: { backgroundColor: "#FEE500", color: "rgba(0, 0, 0, 0.85)" } },
  { id: "naver", name: "네이버", style: { backgroundColor: "#03C75A", color: "#ffffff" } },
] as const;

export const joinAgeCheck = { id: "over14", label: "[필수] 만 14세 이상입니다." };

export const requiredAgreementIds = ["service", "privacy", joinAgeCheck.id];

export const joinAgreeAllLabel =
  "이용약관 및 개인정보수집 및 이용, 쇼핑정보 수신(선택)에 모두 동의합니다.";

export const joinAgreements = [
  {
    title: "[필수] 이용약관 동의",
    content: termsOfService,
    checks: [{ id: "service", label: "이용약관에 동의하십니까?" }],
  },
  {
    title: "[필수] 개인정보 수집 및 이용 동의",
    content: privacyNotice,
    checks: [{ id: "privacy", label: "개인정보 수집 및 이용에 동의하십니까?" }],
  },
  {
    title: "[선택] 쇼핑정보 수신 동의",
    content: marketingNotice,
    checks: [
      { id: "sms", label: "SMS 수신을 동의하십니까?" },
      { id: "newsMail", label: "이메일 수신을 동의하십니까?" },
    ],
  },
];

export const myPageMenu = [
  { label: "주문내역 조회", href: "/mypage/orders" },
  { label: "관심상품", href: "/mypage/wishlist" },
  { label: "최근 본 상품", href: "/mypage/recent" },
  { label: "쿠폰", href: "/mypage/coupon" },
  { label: "적립금", href: "/mypage/mileage" },
  { label: "회원정보 수정", href: "/mypage/profile" },
];

export const cartGuides = [
  {
    title: "장바구니 이용안내",
    items: [
      "해외배송 상품과 국내배송 상품은 함께 결제하실 수 없으니 장바구니 별로 따로 결제해 주시기 바랍니다.",
      "해외배송 가능 상품의 경우 국내배송 장바구니에 담았다가 해외배송 장바구니로 이동하여 결제하실 수 있습니다.",
      "선택하신 상품의 수량을 변경하시려면 수량변경 후 [변경] 버튼을 누르시면 됩니다.",
      "[쇼핑계속하기] 버튼을 누르시면 쇼핑을 계속 하실 수 있습니다.",
      "장바구니와 관심상품을 이용하여 원하시는 상품만 주문하거나 관심상품으로 등록하실 수 있습니다.",
      "파일첨부 옵션은 동일상품을 장바구니에 추가할 경우 마지막에 업로드 한 파일로 교체됩니다.",
    ],
  },
  {
    title: "무이자할부 이용안내",
    items: [
      "상품별 무이자할부 혜택을 받으시려면 무이자할부 상품만 선택하여 [주문하기] 버튼을 눌러 주문/결제 하시면 됩니다.",
      "[전체 상품 주문] 버튼을 누르시면 장바구니의 구분없이 선택된 모든 상품에 대한 주문/결제가 이루어집니다.",
      "단, 전체 상품을 주문/결제하실 경우, 상품별 무이자할부 혜택을 받으실 수 없습니다.",
    ],
  },
];

// TODO: replace with the shop's real delivery policy
export const deliveryInfo = {
  fee: {
    base: "2,500원",
    freeThreshold: "50,000원 이상 구매 시 무료배송",
    carrier: "택배",
  },
  schedule: [
    "결제 완료 후 1~3일 이내 출고됩니다.",
    "출고 후 택배사 배송 기준으로 1~2일이 추가로 소요됩니다.",
    "주말, 공휴일은 배송 준비 및 출고가 진행되지 않습니다.",
  ],
  remoteAreas: [
    { area: "제주", fee: "3,000원 추가" },
    { area: "도서/산간", fee: "5,000원 추가" },
  ],
  returns: [
    { label: "단순 변심", detail: "왕복 배송비 고객 부담" },
    { label: "상품 하자 / 오배송", detail: "배송비 전액 무료" },
  ],
};

export const bankAccountInfo = {
  bankName: company.bank.split(" ")[0],
  accountNumber: company.bank.split(" ").slice(1).join(" "),
  accountHolder: company.accountHolder,
  notices: [
    "입금자명은 주문자명과 동일하게 입력해 주세요. 다를 경우 입금 확인이 지연될 수 있습니다.",
    "주문 후 3일 이내 미입금 시 주문이 자동 취소됩니다.",
    "입금 확인은 영업일 기준 1~2시간 이내 처리되며, 은행 사정에 따라 다소 지연될 수 있습니다.",
  ],
};

// TODO: replace with the shop's real hours
export const csCenterInfo = {
  tel: company.tel,
  hours: "AM 10:00 ~ PM 18:00",
  lunch: "PM 12:00 ~ PM 13:00",
  offDays: "토, 일, 공휴일 휴무",
  bank: company.bank,
  accountHolder: company.accountHolder,
};

// TODO: replace with the shop's real FAQ
export const csFaq = [
  { question: "주문한 상품은 언제 배송되나요?", answer: "결제 완료 후 2~3일 이내 출고되며, 택배사 사정에 따라 1~2일이 추가로 걸릴 수 있습니다." },
  { question: "배송비는 얼마인가요?", answer: "택배 2,500원이며, 50,000원 이상 구매 시 무료배송입니다." },
  { question: "교환/반품은 어떻게 하나요?", answer: "상품 수령 후 7일 이내 1:1 문의를 통해 접수해 주시면 안내해 드립니다. 단순 변심은 왕복 배송비가 부과될 수 있습니다." },
  { question: "주문을 취소하고 싶어요.", answer: "배송 시작 전이라면 마이페이지 > 주문내역 조회에서 취소하실 수 있습니다. 이미 배송이 시작된 경우 1:1 문의로 접수해 주세요." },
  { question: "회원가입 없이 주문할 수 있나요?", answer: "네, 비회원으로도 주문이 가능합니다. 다만 적립금·쿠폰 등 회원 혜택은 받으실 수 없습니다." },
];

export const productPolicies = [
  { label: "PAYMENT", content: "결제 안내 내용을 입력해주세요." },
  { label: "SHIPPING", content: "배송 안내 내용을 입력해주세요." },
  { label: "RETURNS & EXCHANGES", content: "교환/반품 안내 내용을 입력해주세요." },
];

export type Slide = {
  src: string;
  alt: string;
  label?: string;
};

// TODO: replace with real banner images in /public/static
export const heroSlides: Slide[] = [
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=2000&q=80",
    alt: "Forest",
    label: "MIYAO WORLD",
  },
  {
    src: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=2000&q=80",
    alt: "Woodland",
    label: "MIYAO WORLD",
  },
  {
    src: "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?auto=format&fit=crop&w=2000&q=80",
    alt: "Pine trees",
    label: "MIYAO WORLD",
  },
];
