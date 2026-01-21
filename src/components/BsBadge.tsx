import { useExchangeRate } from "@/context/ExchangeRateContext";

interface BsBadgeProps {
    amount: number;
    className?: string; // Allow styling overrides (e.g., colors)
    prefix?: string; // Optional prefix like "Gen." or "~"
}

export default function BsBadge({ amount, className = "", prefix = "" }: BsBadgeProps) {
    const { formatBs } = useExchangeRate();

    if (amount <= 0 || isNaN(amount)) return null;

    // determine default colors if not provided in className
    const defaultStyles = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    const finalClass = className.includes("bg-") ? className : `${defaultStyles} ${className}`;

    // formatBs typically returns the currency symbol, so we don't force "Bs" here unless needed.
    // However, for badge consistency, we might strip it or just use it.
    // Let's rely on formatBs for the value string.

    return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm backdrop-blur-sm pointer-events-none ${finalClass}`}>
            {prefix && <span className="opacity-70 mr-0.5">{prefix}</span>}
            {formatBs(amount)}
        </span>
    );
}
