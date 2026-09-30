"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminApi } from "@/lib/adminApi";
import { Promotion } from "@/types";
import { PromotionForm } from "@/components/admin/promotions/PromotionForm";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditPromotionPage() {
  const params = useParams();
  const rawId = params?.id ? (Array.isArray(params.id) ? params.id[0] : params.id) : null;
  const promotionId = rawId ? parseInt(rawId, 10) : null;
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!promotionId || isNaN(promotionId)) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function loadPromotion() {
      setLoading(true);
      try {
        const data = await adminApi.getPromotion(promotionId!);
        const promoData = (data as any)?.promotion || data;
        if (isMounted) setPromotion(promoData);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to load promotion");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPromotion();
    return () => {
      isMounted = false;
    };
  }, [promotionId]);

  if (loading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        <span className="text-xs uppercase tracking-wider font-semibold">Loading Promotion Engine...</span>
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="p-16 text-center space-y-4 max-w-md mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
          <Loader2 className="w-6 h-6 rotate-45" />
        </div>
        <h3 className="text-sm font-bold text-white">Promotion Not Found</h3>
        <p className="text-xs text-slate-400">
          The requested promotion campaign (ID: {rawId}) could not be located or may have been deleted.
        </p>
        <div>
          <Link
            href="/admin/promotions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
          >
            Return to All Promotions
          </Link>
        </div>
      </div>
    );
  }

  return <PromotionForm initialData={promotion} isEdit={true} />;
}
