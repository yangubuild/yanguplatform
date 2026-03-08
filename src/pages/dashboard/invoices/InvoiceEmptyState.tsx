import { Plus, FileText } from "lucide-react";

interface InvoiceEmptyStateProps {
  onCreateInvoice: () => void;
}

export function InvoiceEmptyState({ onCreateInvoice }: InvoiceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4"
      style={{ background: "#08120D" }}>
      {/* Illustration area */}
      <div className="mb-6">
        <div className="w-[160px] h-[130px] flex items-center justify-center">
          {/* Stylized envelope + phone illustration */}
          <svg viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            {/* Envelope back */}
            <path d="M30 55 L80 95 L130 55 L130 110 L30 110 Z" fill="#c0452a" />
            {/* Envelope front flap */}
            <path d="M30 55 L80 85 L130 55 L80 25 Z" fill="#e05535" />
            {/* Phone */}
            <rect x="62" y="15" width="36" height="65" rx="5" fill="#d4dce4" stroke="#a0aab4" strokeWidth="1.5" />
            <rect x="66" y="22" width="28" height="48" rx="2" fill="#e8eef2" />
            <rect x="75" y="17" width="10" height="2" rx="1" fill="#a0aab4" />
            {/* Card */}
            <rect x="52" y="50" width="40" height="26" rx="3" fill="#d4c940" stroke="#bab530" strokeWidth="1" transform="rotate(-15 72 63)" />
            <rect x="58" y="55" width="18" height="3" rx="1" fill="#a09820" transform="rotate(-15 67 56.5)" />
            {/* Sparkles */}
            <circle cx="45" cy="45" r="2" fill="white" opacity="0.7" />
            <circle cx="118" cy="70" r="1.5" fill="white" opacity="0.5" />
            <path d="M50 80 L52 76 L54 80 L50 80Z" fill="white" opacity="0.4" />
            <path d="M115 50 L117 46 L119 50 L115 50Z" fill="white" opacity="0.4" />
          </svg>
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-2">No invoices yet</h2>
      <p className="text-sm mb-16" style={{ color: "rgba(255,255,255,0.45)" }}>
        Create your first invoice to request payment directly from a customer.
      </p>

      {/* Bottom action bar */}
      <div
        className="flex items-center gap-3 px-6 py-4 rounded-2xl max-w-2xl w-full"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <p className="text-sm flex-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          Create your first invoice to request payment directly from a customer.
        </p>
        <button
          onClick={onCreateInvoice}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-black shrink-0"
          style={{ background: "white" }}
        >
          <Plus className="w-4 h-4" />
          Create invoice
        </button>
        <button
          className="text-sm font-medium text-white shrink-0 px-3 py-2.5 hover:underline"
        >
          View docs
        </button>
      </div>
    </div>
  );
}
