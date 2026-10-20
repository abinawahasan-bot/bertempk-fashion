import { cn } from "../lib/utils";
import type { OrderStatus } from "../types";

const styles: Record<OrderStatus, string> = {
  pending_payment: "border-acid/60 text-acid",
  paid: "border-silver/60 text-silver",
  shipped: "border-bone/60 text-bone",
  delivered: "border-ash/60 text-ash",
  cancelled: "border-signal/60 text-signal",
};

const labels: Record<OrderStatus, string> = {
  pending_payment: "Awaiting payment",
  paid: "Paid",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-block border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em]",
        styles[status]
      )}
    >
      {labels[status]}
    </span>
  );
}
