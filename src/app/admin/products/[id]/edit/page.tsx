"use client";

import React from "react";
import { useParams } from "next/navigation";
import { ProductFormPage } from "@/components/admin/products/ProductFormPage";

export default function EditProductRoutePage() {
  const params = useParams();
  const idStr = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const productId = idStr ? parseInt(idStr, 10) : undefined;

  return <ProductFormPage mode="edit" productId={productId} />;
}
