"use client";

import React, { useState } from "react";
import { ContentPageLayout } from "@/components/shared/ContentPageLayout";
import { ChevronDown, HelpCircle, Search } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: "Orders & Payments" | "Shipping & Delivery" | "Authenticity & Products" | "Safety & Age Policy";
}

export const FAQS: FAQItem[] = [
  {
    category: "Shipping & Delivery",
    question: "What are your delivery charges and timelines in Bangladesh?",
    answer: "Delivery inside Dhaka Metro is 60 Tk (typically delivered within 24 to 48 hours). Delivery outside Dhaka covering all 64 districts is 120 Tk (delivered within 2 to 4 business days) via our verified courier partners (Steadfast, Pathao, RedX). Orders qualifying for promotional free delivery thresholds receive automatic delivery fee waivers at checkout.",
  },
  {
    category: "Shipping & Delivery",
    question: "How do I track my order status in real time?",
    answer: "As soon as your order is dispatched, you will receive an SMS and email notification containing your courier tracking number. You can also visit our Track Order page at any time and enter your order number (e.g. ORD-2026-XXXXX) for live fulfillment updates.",
  },
  {
    category: "Orders & Payments",
    question: "What payment methods do you accept?",
    answer: "We support Cash on Delivery (COD) nationwide, alongside instant digital payments via bKash, Nagad, Rocket, and all major debit/credit cards (Visa, Mastercard, AMEX).",
  },
  {
    category: "Orders & Payments",
    question: "How do I apply a discount voucher or coupon code?",
    answer: "You can enter your promotional coupon code in your Cart Drawer or directly on the Checkout Summary page. The discount will instantly calculate and subtract from your order total before payment.",
  },
  {
    category: "Authenticity & Products",
    question: "Are your vape devices and e-liquids 100% authentic?",
    answer: "Yes, absolutely. All disposable devices, pod systems, coils, and e-liquids are sourced directly from authorized manufacturers and verified distributors. Most products feature holographic scratch-off security codes that you can authenticate on the manufacturer's official verification portal.",
  },
  {
    category: "Authenticity & Products",
    question: "What is the difference between Salt Nicotine and Freebase e-liquids?",
    answer: "Salt Nicotine e-liquids provide a smoother throat hit at higher nicotine strengths (typically 20mg–50mg) and are designed specifically for low-wattage refillable pod systems. Freebase e-liquids are usually formulated in lower strengths (3mg–12mg) with higher VG ratios, ideal for high-wattage sub-ohm tank setups producing dense clouds.",
  },
  {
    category: "Authenticity & Products",
    question: "What should I do if a brand-new device arrives defective (DOA)?",
    answer: "We offer a 7-day replacement guarantee on Dead-On-Arrival (DOA) or manufacturer hardware defects. Please keep the original packaging and contact our team via WhatsApp or email with a short video clip of the issue, and we will arrange a swift replacement.",
  },
  {
    category: "Safety & Age Policy",
    question: "What is your age verification policy?",
    answer: "In compliance with strict adult advocacy and consumer safety standards, our products are strictly intended for adult smokers and vapers of legal smoking age (18+). We do not sell to minors under any circumstances, and doorstep identity verification may be requested by delivery agents.",
  },
];

export default function FaqClient() {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1]);

  const categories = ["All", "Shipping & Delivery", "Orders & Payments", "Authenticity & Products", "Safety & Age Policy"];

  const filteredFaqs = FAQS.filter((faq) => {
    const matchesCategory = activeCategory === "All" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleIndex = (idx: number) => {
    setOpenIndexes((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <ContentPageLayout
      title="Frequently Asked Questions"
      description="Clear answers regarding order dispatch, delivery timelines, product authenticity, and payment methods."
    >
      <div className="space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 opacity-40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions (e.g. shipping, bKash, pod replacement, authentic)..."
            className="w-full h-10 rounded-xl pl-10 pr-4 text-xs focus:outline-none transition-colors"
            style={{
              backgroundColor: "var(--theme-card-bg, #ffffff)",
              border: "1px solid var(--theme-card-border, #e2e8f0)",
              color: "var(--theme-text-heading, #0f172a)",
            }}
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                style={
                  isActive
                    ? {
                        backgroundColor: "var(--theme-primary, #005826)",
                        color: "var(--theme-btn-primary-text, #ffffff)",
                      }
                    : {
                        backgroundColor: "var(--theme-hover-bg, rgba(0, 88, 38, 0.05))",
                        color: "var(--theme-text-body, #64748b)",
                        border: "1px solid var(--theme-card-border, #e2e8f0)",
                      }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-2.5 pt-1">
          {filteredFaqs.length === 0 ? (
            <div className="text-center py-12 space-y-2 opacity-60">
              <HelpCircle className="w-8 h-8 mx-auto" />
              <p className="text-xs">No questions matched your search criteria.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openIndexes.includes(idx);
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border overflow-hidden transition-colors"
                  style={{
                    backgroundColor: "var(--theme-card-bg, #ffffff)",
                    borderColor: "var(--theme-card-border, #e2e8f0)",
                  }}
                >
                  <button
                    onClick={() => toggleIndex(idx)}
                    className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <span
                      className="font-bold text-xs sm:text-sm flex items-center gap-2"
                      style={{ color: "var(--theme-text-heading, #0f172a)" }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ backgroundColor: "var(--theme-primary, #005826)" }}
                      />
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      style={{ color: "var(--theme-primary, #005826)" }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      className="px-4 pb-4 pt-1 text-xs leading-relaxed border-t"
                      style={{
                        borderColor: "var(--theme-card-border, #e2e8f0)",
                        color: "var(--theme-text-body, #475569)",
                      }}
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </ContentPageLayout>
  );
}
