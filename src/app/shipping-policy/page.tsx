import { ContentPageLayout } from "@/components/shared/ContentPageLayout";
import { Truck, MapPin, Clock, Box, ShieldCheck } from "lucide-react";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://inhaliq.com";

export const metadata = {
  title: "Shipping & Delivery Policy | Inheliq",
  description: "Fast express courier delivery across Dhaka and all 64 districts of Bangladesh.",
  alternates: {
    canonical: `${siteUrl}/shipping-policy`,
  },
};

export default function ShippingPolicyPage() {
  return (
    <ContentPageLayout
      title="Shipping & Delivery Policy"
      description="Reliable delivery timelines, transparent rates, secure tamper-evident packaging, and doorstep tracking."
      lastUpdated="September 2026"
    >
      <div className="space-y-8">
        {/* Delivery Rates */}
        <section className="space-y-4">
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Truck className="w-4 h-4" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>1. Domestic Delivery Rates & Timelines (Bangladesh)</span>
          </h2>
          <p className="leading-relaxed">
            We partner with premier domestic logistics networks (Steadfast Courier, Pathao, RedX) to provide seamless doorstep delivery across all 64 districts of Bangladesh.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div
              className="p-5 rounded-2xl border space-y-2 transition-colors"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-bold text-sm flex items-center gap-1.5"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  <MapPin className="w-4 h-4" style={{ color: "var(--theme-primary, #005826)" }} />
                  <span>Inside Dhaka Metro</span>
                </span>
                <span
                  className="text-base font-extrabold font-mono"
                  style={{ color: "var(--theme-primary, #005826)" }}
                >
                  60 Tk
                </span>
              </div>
              <p className="text-xs">
                Estimated Transit Time: <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>24 to 48 Hours</strong>
              </p>
              <p className="text-[11px] opacity-75">
                Swift dispatch from our central Dhaka hub directly to your door.
              </p>
            </div>

            <div
              className="p-5 rounded-2xl border space-y-2 transition-colors"
              style={{
                backgroundColor: "var(--theme-card-bg, #ffffff)",
                borderColor: "var(--theme-card-border, #e2e8f0)",
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-bold text-sm flex items-center gap-1.5"
                  style={{ color: "var(--theme-text-heading, #0f172a)" }}
                >
                  <MapPin className="w-4 h-4" style={{ color: "var(--theme-primary, #005826)" }} />
                  <span>Outside Dhaka (All 64 Districts)</span>
                </span>
                <span
                  className="text-base font-extrabold font-mono"
                  style={{ color: "var(--theme-primary, #005826)" }}
                >
                  120 Tk
                </span>
              </div>
              <p className="text-xs">
                Estimated Transit Time: <strong style={{ color: "var(--theme-text-heading, #0f172a)" }}>2 to 4 Business Days</strong>
              </p>
              <p className="text-[11px] opacity-75">
                Reliable doorstep delivery to Chittagong, Sylhet, Rajshahi, Khulna, Barisal, and Rangpur divisions.
              </p>
            </div>
          </div>
        </section>

        {/* Free Shipping Qualification */}
        <section
          className="space-y-3 pt-6 border-t"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Box className="w-4 h-4" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>2. Promotional Free Delivery</span>
          </h2>
          <p className="leading-relaxed">
            Qualifying orders exceeding our free shipping threshold (or orders utilizing an authorized free shipping promotional coupon) receive automatic delivery fee waivers. The shipping fee deduction will be clearly displayed on your checkout summary.
          </p>
        </section>

        {/* Packaging & Age Verification */}
        <section
          className="space-y-3 pt-6 border-t"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <ShieldCheck className="w-4 h-4" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>3. Discreet Packaging & Adult Verification</span>
          </h2>
          <p className="leading-relaxed">
            All shipments are dispatched in discreet, secure packaging to protect product integrity and customer privacy. Because our products are strictly intended for adults (18+), courier delivery partners may require valid age verification upon parcel handover.
          </p>
        </section>

        {/* Order Tracking */}
        <section
          className="space-y-3 pt-6 border-t"
          style={{ borderColor: "var(--theme-card-border, #e2e8f0)" }}
        >
          <h2
            className="text-base sm:text-lg font-bold flex items-center gap-2"
            style={{ color: "var(--theme-text-heading, #0f172a)" }}
          >
            <Clock className="w-4 h-4" style={{ color: "var(--theme-primary, #005826)" }} />
            <span>4. Live Order Tracking</span>
          </h2>
          <p className="leading-relaxed">
            Upon parcel handover to the courier, an automated SMS and email notification with your tracking code is dispatched. You can track your shipment status live at any time on our{" "}
            <a
              href="/track"
              className="font-bold underline"
              style={{ color: "var(--theme-primary, #005826)" }}
            >
              Order Tracking Page
            </a>
            .
          </p>
        </section>
      </div>
    </ContentPageLayout>
  );
}
