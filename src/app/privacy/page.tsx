import { ContentPageLayout } from "@/components/shared/ContentPageLayout";
import { Shield, Lock, Eye, Server, UserCheck } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata = {
  title: "Privacy Policy | Inheliq",
  description: "How Inheliq protects your personal information, delivery data, and order history.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <ContentPageLayout
      title="Privacy Policy"
      description="Our commitment to safeguarding your personal data, order records, and shopping privacy."
      lastUpdated="September 2026"
    >
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed">
        {/* Section 1: Information We Collect */}
        <section className="space-y-3">
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Shield className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>1. Information We Collect</span>
          </h2>
          <p>
            When you visit or place an order on Inheliq, we collect only the necessary information required to process your transaction, verify adult legal age compliance, and complete courier doorstep delivery:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Account & Contact Details:</strong> Full name, verified mobile contact number, and email address.
            </li>
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Logistics & Delivery Data:</strong> Exact delivery address, city, district, and courier delivery instructions.
            </li>
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Transaction Data:</strong> Ordered items, applied vouchers, payment references (e.g. bKash / Nagad transaction IDs, or gateway tokens). We do not store raw credit card numbers or banking passwords.
            </li>
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Age Verification Record:</strong> Confirmation that the purchaser is of legal adult smoking and vaping age (18+).
            </li>
          </ul>
        </section>

        {/* Section 2: How Your Data Is Used */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Lock className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>2. How Your Data Is Utilized</span>
          </h2>
          <p>
            We process your data strictly for legitimate operational and customer support purposes:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div
              className="p-3.5 rounded-xl border transition-colors space-y-1"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <h4 className="font-bold text-xs" style={{ color: "var(--theme-text-heading, #0f172a)" }}>
                Order Fulfillment & Tracking
              </h4>
              <p className="text-[11px] opacity-75">
                Packaging items securely, generating shipping manifests, and sending SMS delivery notifications.
              </p>
            </div>

            <div
              className="p-3.5 rounded-xl border transition-colors space-y-1"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <h4 className="font-bold text-xs" style={{ color: "var(--theme-text-heading, #0f172a)" }}>
                Fraud Prevention & Safety
              </h4>
              <p className="text-[11px] opacity-75">
                Protecting against automated bot purchases, malicious chargebacks, and unauthorized account access.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Cookie & Storage Policy */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Server className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>3. Cookies & Local Storage</span>
          </h2>
          <p>
            We use secure browser cookies and local storage exclusively for core storefront functionality: keeping items in your shopping cart, preserving your theme preference, and maintaining your logged-in session. <strong>We never sell, trade, or rent personal customer records to third-party advertisers.</strong>
          </p>
        </section>

        {/* Section 4: Customer Rights */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <UserCheck className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>4. Customer Rights & Data Management</span>
          </h2>
          <p>
            You maintain full ownership of your data. You may update your delivery addresses, review your past purchase invoices, or request complete account erasure at any time by messaging our care team via WhatsApp or submitting a request on our{" "}
            <a
              href="/contact"
              className="font-bold underline"
              style={{ color: "var(--theme-primary, #005826)" }}
            >
              Contact Support Page
            </a>
            .
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
