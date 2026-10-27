import PageTitle from "@/components/common/PageTitle";
import AddressBook from "@/components/mypage/AddressBook";

export const metadata = {
  title: "ADDRESS | MIYAO WORLD",
};

export default function AddressPage() {
  return (
    <>
      <PageTitle>Address</PageTitle>
      <AddressBook />
    </>
  );
}
