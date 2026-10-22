import { ContentPageLayout } from "@/components/shared/ContentPageLayout";
import { BookOpen, ShieldAlert, CreditCard, BatteryCharging, Scale } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata = {
  title: "Terms of Service | Inheliq",
  description: "Terms and conditions governing the purchase of authentic vape hardware and e-liquids on Inheliq.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

export default function TermsOfServicePage() {
  return (
    <ContentPageLayout
      title="Terms of Service"
      description="The standard legal terms establishing guidelines for orders, pricing, adult age restrictions, and customer conduct."
      lastUpdated="September 2026"
    >
      <div className="space-y-8 text-xs sm:text-sm leading-relaxed">
        {/* Section 1: Adult Age Restriction */}
        <section className="space-y-3">
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>1. Strict 18+ Adult Age Requirement</span>
          </h2>
          <p>
            By accessing Inheliq or placing an order, you certify that you are of legal adult smoking and vaping age (18 years or older). Nicotine is an addictive substance. Our products are exclusively marketed to and intended for existing adult smokers and vapers. We strictly prohibit purchasing on behalf of minors.
          </p>
        </section>

        {/* Section 2: Orders & Pricing */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <CreditCard className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>2. Orders, Pricing & Cash on Delivery (COD)</span>
          </h2>
          <p>
            All listed prices are displayed in Bangladeshi Taka (৳ / Tk). While we strive for complete pricing accuracy, we reserve the right to correct inadvertent errors before shipment.
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Order Confirmation:</strong> Order receipts sent via SMS or email confirm reception of your order request. Fulfillment is finalized upon dispatch with our courier partner.
            </li>
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Cash on Delivery Agreement:</strong> When choosing COD, the customer agrees to accept delivery and pay the full invoice amount in cash to the courier representative. Repeated unjustified order refusals at the door will result in permanent account suspension.
            </li>
            <li>
              <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>Discount Vouchers:</strong> Coupon codes must be entered prior to order checkout and cannot be applied retroactively to already dispatched orders.
            </li>
          </ul>
        </section>

        {/* Section 3: Battery & Device Safety */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <BatteryCharging className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>3. Lithium-Ion Battery & Device Safety</span>
          </h2>
          <p>
            Rechargeable vape mods and disposable devices contain lithium-ion batteries that require standard care and proper handling:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Always charge devices using certified wall adapters (recommended 5V/1A or 5V/2A) and avoid overnight unattended charging.</li>
            <li>Never expose devices, disposable pods, or batteries to extreme heat, open flame, direct sunlight, or water submersion.</li>
            <li>Never carry loose external batteries in pockets or bags alongside metal objects or coins.</li>
          </ul>
        </section>

        {/* Section 4: Limitation of Liability */}
        <section
          className="space-y-3 pt-6 border-t transition-colors"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Scale className="w-4 h-4 shrink-0" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>4. Limitation of Liability & Warranty</span>
          </h2>
          <p>
            Inheliq guarantees that all products sold are 100% authentic and sourced from authorized manufacturers. Inheliq shall not be held liable for damages, injuries, or device malfunctions arising from misuse, improper charging, unauthorized device modification, or failure to follow manufacturer instructions.
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
