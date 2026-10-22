import { ContentPageLayout } from "@/components/shared/ContentPageLayout";
import { RotateCcw, ShieldCheck, AlertCircle, CheckCircle2, MessageCircle } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata = {
  title: "Return & Refund Policy | Inheliq",
  description: "7-day replacement guarantee for defective hardware and clear guidelines on unopened e-liquid returns.",
  alternates: {
    canonical: `${siteUrl}/refund-policy`,
  },
};

export default function RefundPolicyPage() {
  return (
    <ContentPageLayout
      title="Return & Refund Policy"
      description="Clear, transparent terms regarding hardware warranty replacements, hygiene return criteria, and swift claim resolutions."
      lastUpdated="September 2026"
    >
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed">
        {/* Section 1: 7-Day DOA Replacement */}
        <section className="space-y-3">
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <RotateCcw className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>1. 7-Day Replacement Guarantee (DOA & Hardware Defects)</span>
          </h2>
          <p>
            We stand behind every device we dispatch. If your rechargeable vape mod, pod kit, or electronic accessory arrives <strong>Dead-On-Arrival (DOA)</strong>, fails to fire, or exhibits an undeniable manufacturing defect within <strong>7 days of delivery</strong>, we will replace it with a brand-new unit at no additional charge.
          </p>

          <div
            className="p-4 rounded-xl border space-y-1.5 transition-colors"
            style={{
              backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.04))",
              borderColor: "var(--theme-card-border, #e2e8f0)",
            }}
          >
            <div
              className="text-xs font-bold flex items-center gap-1.5"
              style={{ color: "var(--theme-text-heading, #0f172a)" }}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
              <span>What qualifies for hardware replacement:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs opacity-90">
              <li>Internal chip failure, charging port malfunction, or auto-fire defects.</li>
              <li>Display screen failure or refusal to hold battery charge out of the box.</li>
              <li>Incorrect item, color, or model variant delivered from our fulfillment center.</li>
            </ul>
          </div>
        </section>

        {/* Section 2: Consumables & Hygiene Safety */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>2. Consumable Items & Hygiene Regulations</span>
          </h2>
          <p>
            Due to strict consumer health, hygiene, and safety protocols, the following items <strong>cannot be returned or refunded once the tamper-evident packaging seal has been broken or unsealed</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div
              className="p-3.5 rounded-xl border transition-colors space-y-1"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <h4 className="font-bold text-xs" style={{ color: "var(--theme-text-heading, #0f172a)" }}>
                E-Liquids & Salt Nic
              </h4>
              <p className="text-[11px] opacity-75">
                Bottles with broken seals or signs of usage are non-returnable.
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
                Disposable Vapes
              </h4>
              <p className="text-[11px] opacity-75">
                Pre-filled pods & disposables once silicone seals are peeled open.
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
                Coils & Replacement Pods
              </h4>
              <p className="text-[11px] opacity-75">
                Opened blister packs or coils primed with liquid cannot be accepted.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: How to Submit a Claim */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <MessageCircle className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>3. How to Submit a Return or Replacement Claim</span>
          </h2>
          <p>
            Submitting a claim is direct and fast. Follow these simple steps within 7 days of receiving your order:
          </p>

          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Keep the original retail packaging:</strong> The box, barcode label, and authenticity security scratch code are required to process warranty returns with the manufacturer.
            </li>
            <li>
              <strong>Record a short video clip (15–30 seconds):</strong> Clearly show the device plugged into power or attempting to fire, demonstrating the defect.
            </li>
            <li>
              <strong>Reach out via WhatsApp or Email:</strong> Message our care team on WhatsApp with your Order ID (e.g. <code>ORD-2026-XXXXX</code>) and the video clip.
            </li>
            <li>
              <strong>Courier pickup & replacement dispatch:</strong> Once approved, our courier partner will collect the defective device and deliver your replacement.
            </li>
          </ol>
        </section>

        {/* Section 4: Refund Timelines */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>4. Refund Timelines & Payment Methods</span>
          </h2>
          <p>
            If a replacement unit is out of stock or an eligible unopened return is authorized, refunds are issued immediately upon return parcel inspection:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div
              className="p-3.5 rounded-xl border transition-colors space-y-1"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <span className="font-bold text-xs block" style={{ color: "var(--theme-text-heading, #0f172a)" }}>
                bKash / Nagad / Rocket
              </span>
              <p className="text-[11px] opacity-75">
                Sent directly to your sender wallet within 24 to 48 hours.
              </p>
            </div>

            <div
              className="p-3.5 rounded-xl border transition-colors space-y-1"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <span className="font-bold text-xs block" style={{ color: "var(--theme-text-heading, #0f172a)" }}>
                Debit / Credit Cards
              </span>
              <p className="text-[11px] opacity-75">
                Processed in 5 to 7 business days per banking gateway rules.
              </p>
            </div>

            <div
              className="p-3.5 rounded-xl border transition-colors space-y-1"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <span className="font-bold text-xs block" style={{ color: "var(--theme-text-heading, #0f172a)" }}>
                Store Credit / Exchange
              </span>
              <p className="text-[11px] opacity-75">
                Instant voucher credit applied to your customer profile.
              </p>
            </div>
          </div>
        </section>
      </div>
    </ContentPageLayout>
  );
}
