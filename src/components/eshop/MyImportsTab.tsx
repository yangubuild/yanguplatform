import ImportTable from "./ImportTable";

const formatPrice = (cents: number | undefined, currency: string | undefined) => {
  if (cents == null || !currency) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
};

export default function MyImportsTab() {
  return (
    <div className="p-5">
      <ImportTable formatPrice={formatPrice} />
    </div>
  );
}
