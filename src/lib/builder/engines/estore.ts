import type { BuilderEngine } from "../types";

export const estoreEngine: BuilderEngine = {
  key: "estore",
  surfaceType: "store_listing",
  label: "Estore",
  description: "Create a store listing for wholesale, trading, or bulk business.",
  publishDomain: "yangu.store",
  icon: "Warehouse",
  industries: [
    { value: "trading", label: "Trading" },
    { value: "wholesale", label: "Wholesale" },
    { value: "distribution", label: "Distribution" },
    { value: "agriculture", label: "Agriculture Inputs" },
    { value: "construction", label: "Construction Materials" },
    { value: "supermarket", label: "Supermarket" },
    { value: "hardware", label: "Hardware Supplies" },
    { value: "bulk_supplier", label: "Bulk Supplier" },
    { value: "industrial", label: "Industrial Supplies" },
    { value: "other", label: "Other" },
  ],
  manualSteps: [
    {
      title: "Store Information",
      subtitle: "Tell us about your store or trading business",
      continueLabel: "Continue to Branding →",
      fields: [
        { key: "business_name", label: "Store / Company Name", type: "text", required: true, placeholder: "e.g. ABC Distributors" },
        { key: "slug", label: "Store URL Slug", type: "slug", slugDomain: "yangu.store", slugSource: "business_name", required: true },
        { key: "industry", label: "Industry", type: "select", options: [], required: true },
        { key: "business_description", label: "What do you supply?", type: "textarea", placeholder: "Products and services…" },
        { key: "contact_email", label: "Contact Email", type: "email", required: true, colSpan: 1 },
        { key: "contact_phone", label: "Contact Phone", type: "tel", colSpan: 1 },
        { key: "location", label: "Location / Warehouse Address", type: "text" },
      ],
    },
    {
      title: "Branding",
      subtitle: "Set your store's visual identity",
      continueLabel: "Continue to Settings →",
      fields: [
        { key: "logo_url", label: "Company Logo", type: "file" },
        { key: "primary_color", label: "Primary Color", type: "color", defaultValue: "#0d9488" },
      ],
    },
    {
      title: "Store Settings",
      subtitle: "Configure quoting and payment options",
      continueLabel: "Create Store ✓",
      fields: [
        { key: "enable_quotes", label: "Enable Quote Requests", type: "switch", defaultValue: true },
        { key: "enable_bulk_pricing", label: "Show Bulk Pricing Tiers", type: "switch", defaultValue: true },
        { key: "min_order_value", label: "Minimum Order Value", type: "text", placeholder: "e.g. 100,000" },
        { key: "pay_bank_transfer", label: "Bank Transfer", type: "checkbox", defaultValue: true },
        { key: "pay_mobile_money", label: "Mobile Money", type: "checkbox" },
      ],
    },
  ],
  aiQuestions: [
    { key: "business_name", label: "Company name", type: "text", required: true },
    { key: "industry", label: "What do you trade/supply?", type: "text", placeholder: "e.g. Building materials, Agriculture" },
    { key: "location", label: "Location", type: "text" },
  ],
  defaultSections: [
    { type: "hero", schema: { headline: "", subheadline: "Your trusted supplier" } },
    { type: "products", schema: { heading: "Our Products", items: [], layout: "grid" } },
    { type: "text", schema: { heading: "Why Choose Us", body: "" } },
    { type: "contact", schema: { heading: "Get a Quote", email: "", phone: "" } },
  ],
  editorModules: ["products", "catalog", "bulk_pricing", "quotes", "contact"],
};
