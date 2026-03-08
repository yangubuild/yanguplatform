import { useState } from "react";
import { InvoiceEmptyState } from "./InvoiceEmptyState";
import { InvoiceComposer } from "./InvoiceComposer";

export default function InvoicesPage() {
  const [composerOpen, setComposerOpen] = useState(false);

  if (composerOpen) {
    return <InvoiceComposer onClose={() => setComposerOpen(false)} />;
  }

  return <InvoiceEmptyState onCreateInvoice={() => setComposerOpen(true)} />;
}
