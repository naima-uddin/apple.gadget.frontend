import UserSectionPage from "./PageClient";
export function generateStaticParams() {
  return [
    "profile",
    "orders",
    "wishlist",
    "cart",
    "address",
    "reviews",
    "rewards",
    "loyalty",
    "coupons",
  ].map((s) => ({ section: s }));
}
export default function Page() {
  return <UserSectionPage />;
}
