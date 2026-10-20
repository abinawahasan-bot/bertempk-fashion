import type { OrderItem } from "../types";

/**
 * The variant of one ordered line: `Size L · Jet`.
 *
 * A line recorded before the variant-aware cart has no size, and that gap is
 * stated out loud — an order never quietly hides that the studio has to ask
 * the customer which size they meant.
 */
export default function OrderVariant({ item }: { item: OrderItem }) {
  if (item.size === null) {
    return <span className="text-signal">Ukuran belum dipilih</span>;
  }
  return (
    <span>
      Size {item.size}
      {item.colorway ? ` · ${item.colorway}` : ""}
    </span>
  );
}
