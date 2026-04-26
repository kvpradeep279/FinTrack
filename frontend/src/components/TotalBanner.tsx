"use client";

interface Props {
  total: string;
  count: number;
  isLoading: boolean;
}

function formatCurrency(amount: string): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(parseFloat(amount));
}

export default function TotalBanner({ total, count, isLoading }: Props) {
  return (
    <div className="total-banner">
      <div className="total-banner__label">
        {isLoading ? "Loading…" : `${count} expense${count !== 1 ? "s" : ""}`}
      </div>
      <div className="total-banner__amount">
        {isLoading ? (
          <span className="skeleton-inline" />
        ) : (
          <>
            Total: <strong>{formatCurrency(total)}</strong>
          </>
        )}
      </div>
    </div>
  );
}
