"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Eye, 
  Edit3, 
  Trash2,
  RotateCcw, 
  Sparkles,
  ChevronRight,
  Plus,
  Calendar,
  AlertTriangle,
  X,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Unlock,
  UserCheck,
  ExternalLink,
  Lock,
  Shield,
  RefreshCw,
  Loader2,
  Receipt,
  BadgeDollarSign,
  Printer,
  Calculator,
  Barcode
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Order, Product, SalesInvoice, SalesSummary } from "@/types";
import { formatPrice, formatDate } from "@/lib/utils";
import { ScrollableTableCard } from "@/components/admin/ScrollableTableCard";
import { AdminCheckbox } from "@/components/admin/AdminCheckbox";
import { AdminDropdown } from "@/components/admin/AdminDropdown";
import { BulkActionBar } from "@/components/admin/BulkActionBar";
import { AdminPageHeader, AdminStatusBadge, AdminEmptyState, FilterDrawer, AdminStatStrip } from "@/components/admin/ui";
import { OrderInvoiceModal } from "@/components/admin/orders/OrderInvoiceModal";

import { toast } from "sonner";


export default function AdminOrdersPage() {
  return (
    <Suspense fallback={
      <div className="p-12 text-center text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#A78BFA] mb-2" />
        Loading Orders & Fulfillment...
      </div>
    }>
      <OrdersContent />
    </Suspense>
  );
}

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChannel = searchParams.get("channel") || "all";

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [statusTab, setStatusTab] = useState("all");
  const [channelTab, setChannelTab] = useState<string>(initialChannel);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [minTotal, setMinTotal] = useState("");
  const [maxTotal, setMaxTotal] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [orderCounts, setOrderCounts] = useState<{
    all: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    refunded: number;
    payment_pending: number;
    payment_paid: number;
  }>({
    all: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
    payment_pending: 0,
    payment_paid: 0,
  });

  // Commercial Invoice Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Inspect / Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderTimeline, setOrderTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  // IP Block & Restriction Modal State
  const [ipBlockModalData, setIpBlockModalData] = useState<{
    ip: string;
    isBlocked: boolean;
    blockId?: number;
    existingReason?: string;
    existingExpiresAt?: string | null;
  } | null>(null);
  const [blockDuration, setBlockDuration] = useState<"permanent" | "1_hour" | "24_hours" | "7_days" | "30_days" | "custom">("permanent");
  const [customBlockExpiresAt, setCustomBlockExpiresAt] = useState("");
  const [blockReason, setBlockReason] = useState("Abusive order behavior / Risk mitigation");
  const [blockNotes, setBlockNotes] = useState("");
  const [isSubmittingIpBlock, setIsSubmittingIpBlock] = useState(false);
  const [isCheckingIpStatus, setIsCheckingIpStatus] = useState(false);

  // Bulk Selection & Deletion State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Bulk Courier & Thermal Labels State
  const [bulkBookingLoading, setBulkBookingLoading] = useState(false);
  const [bulkLabelsData, setBulkLabelsData] = useState<any[] | null>(null);
  const [isBulkLabelsModalOpen, setIsBulkLabelsModalOpen] = useState(false);

  // Fraud & Risk Inspection Modal State
  const [selectedRiskOrder, setSelectedRiskOrder] = useState<Order | null>(null);

  // Quick Staff Note State
  const [newStaffNoteText, setNewStaffNoteText] = useState("");
  const [savingStaffNote, setSavingStaffNote] = useState(false);

  // Smart View Triage Filter State
  const [smartTriageFilter, setSmartTriageFilter] = useState<"all" | "high_risk" | "ready_pack" | "in_transit" | "rto_issues">("all");

  // Order Creation Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newAddressLine, setNewAddressLine] = useState("742 Evergreen Terrace");
  const [newCity, setNewCity] = useState("San Francisco");
  const [newState, setNewState] = useState("CA");
  const [newPostal, setNewPostal] = useState("94102");
  const [newCountry, setNewCountry] = useState("United States");
  const [orderItems, setOrderItems] = useState<{ productId: number; quantity: number; unitPrice: number }[]>([]);
  const [selectedProdId, setSelectedProdId] = useState<string>("");
  const [itemQty, setItemQty] = useState<string>("1");
  const [newOrderStatus, setNewOrderStatus] = useState<string>("processing");
  const [newPaymentStatus, setNewPaymentStatus] = useState<string>("pending");
  const [newPaymentMethod, setNewPaymentMethod] = useState<string>("cod");
  const [newCarrier, setNewCarrier] = useState<string>("");
  const [newTracking, setNewTracking] = useState<string>("");
  const [newShippingAmount, setNewShippingAmount] = useState<string>("0");
  const [creating, setCreating] = useState(false);

  // Edit Order Modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustName, setEditCustName] = useState("");
  const [editCustEmail, setEditCustEmail] = useState("");
  const [editCustPhone, setEditCustPhone] = useState("");
  const [editOrderStatus, setEditOrderStatus] = useState("processing");
  const [editPaymentStatus, setEditPaymentStatus] = useState("paid");
  const [editCarrier, setEditCarrier] = useState("");
  const [editTracking, setEditTracking] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Confirm Modal
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("Customer requested cancellation");
  const [restock, setRestock] = useState(true);
  const [refunding, setRefunding] = useState(false);

  // Courier Booking Modal
  const [bookingOrder, setBookingOrder] = useState<Order | null>(null);
  const [courierOptions, setCourierOptions] = useState<any | null>(null);
  const [loadingCourierOptions, setLoadingCourierOptions] = useState(false);
  const [selectedCourier, setSelectedCourier] = useState("steadfast");
  const [bookingWeight, setBookingWeight] = useState(0.5);
  const [bookingCod, setBookingCod] = useState(0);
  const [bookingPickupStore, setBookingPickupStore] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingDeliveryArea, setBookingDeliveryArea] = useState("");
  const [isBookingCourier, setIsBookingCourier] = useState(false);

  // Pathao Location Specifics
  const [pathaoCities, setPathaoCities] = useState<Array<{ city_id: number; city_name: string }>>([]);
  const [pathaoZones, setPathaoZones] = useState<Array<{ zone_id: number; zone_name: string }>>([]);
  const [pathaoAreas, setPathaoAreas] = useState<Array<{ area_id: number; area_name: string }>>([]);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<{
    price: number;
    delivery_charge: number;
    additional_charge: number;
    cod_charge: number;
    total_charge: number;
    plan: string;
  } | null>(null);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Thermal Shipping Label Modal
  const [shippingLabelData, setShippingLabelData] = useState<any | null>(null);
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);

  // Load Order Lifecycle Timeline on Inspect Modal Open
  useEffect(() => {
    if (!selectedOrder) {
      setOrderTimeline([]);
      return;
    }
    setLoadingTimeline(true);
    adminApi.getOrderTimeline(selectedOrder.id)
      .then((res) => {
        setOrderTimeline(res.timeline || []);
      })
      .catch((err) => {
        console.error("Failed to fetch order timeline:", err);
      })
      .finally(() => {
        setLoadingTimeline(false);
      });
  }, [selectedOrder?.id]);

  // Load Pathao Cities when Pathao is selected
  useEffect(() => {
    if (selectedCourier === "pathao" && bookingOrder) {
      if (pathaoCities.length === 0) {
        setLoadingCities(true);
        adminApi.getPathaoCities()
          .then((res) => {
            setPathaoCities(res.cities || []);
          })
          .catch((err) => console.error("Failed to load Pathao cities", err))
          .finally(() => setLoadingCities(false));
      }
    }
  }, [selectedCourier, bookingOrder]);

  const handleCityChange = async (cityId: number) => {
    setSelectedCityId(cityId);
    setSelectedZoneId(null);
    setSelectedAreaId(null);
    setPathaoZones([]);
    setPathaoAreas([]);
    setEstimatedPrice(null);
    setPriceError(null);
    if (!cityId) return;
    setLoadingZones(true);
    try {
      const res = await adminApi.getPathaoZones(cityId);
      setPathaoZones(res.zones || []);
    } catch (err) {
      console.error("Failed to load Pathao zones", err);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleZoneChange = async (zoneId: number) => {
    setSelectedZoneId(zoneId);
    setSelectedAreaId(null);
    setPathaoAreas([]);
    setEstimatedPrice(null);
    setPriceError(null);
    if (!zoneId) return;
    setLoadingAreas(true);
    try {
      const res = await adminApi.getPathaoAreas(zoneId);
      setPathaoAreas(res.areas || []);
    } catch (err) {
      console.error("Failed to load Pathao areas", err);
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleOpenBookCourier = async (order: Order) => {
    setBookingOrder(order);
    setSelectedCityId((order as any).shipping_city_id || null);
    setSelectedZoneId((order as any).shipping_zone_id || null);
    setSelectedAreaId((order as any).shipping_area_id || null);
    setEstimatedPrice(null);
    setPriceError(null);
    setLoadingCourierOptions(true);
    try {
      const res = await adminApi.getCourierOptions(order.id);
      setCourierOptions(res);
      setSelectedCourier(res.default_provider || "steadfast");
      setBookingWeight(res.suggested_weight || 0.5);
      setBookingCod(res.suggested_cod_amount || 0);
      setBookingDeliveryArea(res.shipping_address?.city || "");
      setBookingNotes(order.notes || "");
      const pathaoProvider = res.providers?.find((p: any) => p.provider === "pathao");
      if (pathaoProvider?.stores?.[0]) {
        setBookingPickupStore(String(pathaoProvider.stores[0].store_id));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load courier options.");
    } finally {
      setLoadingCourierOptions(false);
    }
  };

  const handleCalculatePrice = async () => {
    if (!bookingOrder) return;
    if (!selectedCityId || !selectedZoneId) {
      toast.error("Please select both City and Zone to calculate Pathao rate.");
      return;
    }
    setCalculatingPrice(true);
    setPriceError(null);
    try {
      const res = await adminApi.calculateCourierPrice(bookingOrder.id, {
        provider: "pathao",
        recipient_city_id: selectedCityId,
        recipient_zone_id: selectedZoneId,
        recipient_area_id: selectedAreaId || undefined,
        weight: Number(bookingWeight) || 0.5,
        pickup_store_id: bookingPickupStore || undefined,
      });
      if (res.success && res.pricing) {
        setEstimatedPrice(res.pricing);
        toast.success(`Estimated delivery: ৳${res.pricing.delivery_charge} · Total: ৳${res.pricing.total_charge}`);
      } else {
        setPriceError(res.pricing?.message || "Unable to calculate Pathao delivery charge.");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Unable to calculate Pathao delivery charge. Please try again.";
      setPriceError(msg);
      toast.error(msg);
    } finally {
      setCalculatingPrice(false);
    }
  };

  const handleExecuteBookCourier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingOrder) return;
    setIsBookingCourier(true);
    try {
      const res = await adminApi.bookShipment(bookingOrder.id, {
        provider: selectedCourier,
        weight: Number(bookingWeight),
        cod_amount: Number(bookingCod),
        pickup_store_id: bookingPickupStore || undefined,
        delivery_area: bookingDeliveryArea || undefined,
        recipient_city_id: selectedCourier === "pathao" && selectedCityId ? selectedCityId : undefined,
        recipient_zone_id: selectedCourier === "pathao" && selectedZoneId ? selectedZoneId : undefined,
        recipient_area_id: selectedCourier === "pathao" && selectedAreaId ? selectedAreaId : undefined,
        notes: bookingNotes || undefined,
      });
      toast.success(res.message);
      setBookingOrder(null);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Courier booking failed.");
    } finally {
      setIsBookingCourier(false);
    }
  };

  const handleTrackShipment = async (orderId: number, shipmentId: number) => {
    try {
      const res = await adminApi.trackShipment(orderId, shipmentId);
      toast.success(res.message);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to sync tracking status.");
    }
  };

  const handleCancelShipment = async (orderId: number, shipmentId: number) => {
    if (!confirm("Are you sure you want to cancel this courier consignment?")) return;
    try {
      const res = await adminApi.cancelShipment(orderId, shipmentId);
      toast.success(res.message);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to cancel shipment.");
    }
  };

  const handlePrintLabel = async (orderId: number, shipmentId: number) => {
    try {
      const res = await adminApi.getShippingLabel(orderId, shipmentId);
      setShippingLabelData(res.label);
      setIsLabelModalOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to generate shipping label.");
    }
  };

  const openInvoiceModal = async (orderId: number) => {
    setLoadingInvoice(true);
    try {
      const inv = await adminApi.getSalesInvoice(orderId);
      setSelectedInvoice(inv);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load commercial invoice.");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadOrders = async (targetPage = currentPage) => {
    setLoading(true);
    try {
      const [ordRes, prodRes, salesRes, countsRes] = await Promise.all([
        adminApi.getOrders({
          status: statusTab !== "all" ? statusTab : undefined,
          payment_status: paymentStatusFilter !== "all" ? paymentStatusFilter : undefined,
          payment_method: paymentMethodFilter !== "all" ? paymentMethodFilter : undefined,
          source: channelTab !== "all" ? channelTab : undefined,
          search: search.trim() || undefined,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          min_total: minTotal || undefined,
          max_total: maxTotal || undefined,
          page: targetPage,
          per_page: 25,
        }),
        adminApi.getProducts({ per_page: 100 }),
        adminApi.getSales({ per_page: 1 }).catch(() => null),
        adminApi.getOrderCounts().catch(() => null),
      ]);
      setOrders(ordRes.data || []);
      setCurrentPage(ordRes.current_page || 1);
      setLastPage(ordRes.last_page || 1);
      setTotalOrders(ordRes.total || 0);
      setProducts(prodRes.data || []);
      if (salesRes?.summary) {
        setSalesSummary(salesRes.summary);
      }
      if (countsRes) {
        setOrderCounts(countsRes);
      }
    } catch {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    loadOrders(1);
  }, [statusTab, paymentStatusFilter, paymentMethodFilter, channelTab, dateFrom, dateTo, minTotal, maxTotal]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadOrders(1);
  };

  const handleResetFilters = () => {
    setStatusTab("all");
    setSearch("");
    setPaymentStatusFilter("all");
    setPaymentMethodFilter("all");
    setDateFrom("");
    setDateTo("");
    setMinTotal("");
    setMaxTotal("");
    setShowAdvancedFilters(false);
    setCurrentPage(1);
    loadOrders(1);
    toast.success("Filters reset.");
  };

  const handleQuickStatusChange = async (orderId: number, newStatus: string) => {
    if (newStatus === "cancelled") {
      if (!confirm("Are you sure you want to cancel this order? This will safely restore inventory to stock, reverse promotions, and post accounting adjustments.")) {
        return;
      }
    }

    setIsUpdatingStatus(true);
    try {
      const res = await adminApi.updateOrderStatus(orderId, { order_status: newStatus });
      toast.success(res.message || `Order status updated to ${newStatus}.`);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(res.order);
      }
      adminApi.getOrderCounts().then(setOrderCounts).catch(() => null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRecordCodPayment = async (orderId: number) => {
    if (!confirm("Confirm cash on delivery payment collection for this order?")) {
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const res = await adminApi.recordOrderPayment(orderId);
      toast.success(res.message || "COD payment recorded successfully.");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? res.order : o)));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(res.order);
      }
      adminApi.getOrderCounts().then(setOrderCounts).catch(() => null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || "Failed to record payment.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = products.find((p) => p.id === Number(selectedProdId));
    if (!prod) return;

    const qty = Number(itemQty) || 1;
    const existingIndex = orderItems.findIndex((i) => i.productId === prod.id);

    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += qty;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { productId: prod.id, quantity: qty, unitPrice: prod.price }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the order.");
      return;
    }
    setCreating(true);

    const payload = {
      customer_name: newCustName,
      customer_email: newCustEmail,
      customer_phone: newCustPhone || null,
      shipping_address: {
        full_name: newCustName,
        address_line1: newAddressLine,
        city: newCity,
        state: newState,
        postal_code: newPostal,
        country: newCountry,
      },
      items: orderItems.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        unit_price: i.unitPrice,
      })),
      shipping_amount: Number(newShippingAmount) || 0,
      payment_status: newPaymentStatus,
      payment_method: newPaymentMethod,
      order_status: newOrderStatus,
      carrier: newCarrier || null,
      tracking_code: newTracking || null,
    };

    try {
      const res = await adminApi.createOrder(payload);
      setOrders([res.order, ...orders]);
      toast.success(`Order #${res.order.order_number} created.`);
      setIsCreateModalOpen(false);
      setOrderItems([]);
      setNewCustName("");
      setNewCustEmail("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create order.");
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (ord: Order) => {
    setEditingOrder(ord);
    setEditCustName(ord.customer_name);
    setEditCustEmail(ord.customer_email);
    setEditCustPhone(ord.customer_phone || "");
    setEditOrderStatus(ord.order_status);
    setEditPaymentStatus(ord.payment_status);
    setEditCarrier(ord.carrier || "");
    setEditTracking(ord.tracking_code || "");
    setEditNotes(ord.notes || "");
  };

  const isEditDirty = Boolean(
    editingOrder && (
      editCustName.trim() !== (editingOrder.customer_name || "").trim() ||
      editCustEmail.trim() !== (editingOrder.customer_email || "").trim() ||
      editCustPhone.trim() !== (editingOrder.customer_phone || "").trim() ||
      editOrderStatus !== editingOrder.order_status ||
      editPaymentStatus !== editingOrder.payment_status ||
      editCarrier.trim() !== (editingOrder.carrier || "").trim() ||
      editTracking.trim() !== (editingOrder.tracking_code || "").trim() ||
      editNotes.trim() !== (editingOrder.notes || "").trim()
    )
  );

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (!isEditDirty) {
      toast.info("No changes were made.");
      return;
    }
    setSavingEdit(true);

    try {
      const res = await adminApi.updateOrder(editingOrder.id, {
        customer_name: editCustName,
        customer_email: editCustEmail,
        customer_phone: editCustPhone || null,
        order_status: editOrderStatus,
        payment_status: editPaymentStatus,
        carrier: editCarrier || null,
        tracking_code: editTracking || null,
        notes: editNotes || null,
      });

      setOrders(orders.map((o) => (o.id === editingOrder.id ? res.order : o)));
      if (selectedOrder?.id === editingOrder.id) {
        setSelectedOrder(res.order);
      }
      toast.success(`Order #${res.order.order_number} updated.`);
      setEditingOrder(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update order.");
    } finally {
      setSavingEdit(false);
    }
  };

  const openIpBlockModal = async (ip: string) => {
    setIsCheckingIpStatus(true);
    setBlockDuration("permanent");
    setCustomBlockExpiresAt("");
    setBlockReason("Abusive order behavior / Risk mitigation");
    setBlockNotes("");
    
    try {
      const res = await adminApi.getBlockedIps({ search: ip });
      const activeRule = (res.data || []).find((r: any) => r.ip_address === ip && r.is_active);
      setIpBlockModalData({
        ip,
        isBlocked: !!activeRule,
        blockId: activeRule?.id,
        existingReason: activeRule?.reason,
        existingExpiresAt: activeRule?.expires_at,
      });
    } catch {
      setIpBlockModalData({
        ip,
        isBlocked: false,
      });
    } finally {
      setIsCheckingIpStatus(false);
    }
  };

  const handleExecuteBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipBlockModalData || !blockReason.trim()) return;

    try {
      setIsSubmittingIpBlock(true);
      const res = await adminApi.blockIp({
        ip_address: ipBlockModalData.ip,
        reason: blockReason.trim(),
        notes: blockNotes.trim() || undefined,
        duration: blockDuration,
        custom_expires_at: blockDuration === "custom" ? customBlockExpiresAt : undefined,
      });

      toast.success(res.message);
      if (res.co_tenant_warning) {
        toast.warning(res.co_tenant_warning);
      }
      setIpBlockModalData((prev) => prev ? {
        ...prev,
        isBlocked: true,
        blockId: res.blocked_ip.id,
        existingReason: res.blocked_ip.reason,
        existingExpiresAt: res.blocked_ip.expires_at,
      } : null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to block IP.");
    } finally {
      setIsSubmittingIpBlock(false);
    }
  };

  const handleExecuteUnblockIp = async () => {
    if (!ipBlockModalData?.blockId) return;

    try {
      setIsSubmittingIpBlock(true);
      const res = await adminApi.unblockIp(ipBlockModalData.blockId);
      toast.success(res.message);
      setIpBlockModalData((prev) => prev ? {
        ...prev,
        isBlocked: false,
        blockId: undefined,
        existingReason: undefined,
        existingExpiresAt: undefined,
      } : null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to unblock IP.");
    } finally {
      setIsSubmittingIpBlock(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!deletingOrder) return;
    setDeleting(true);

    try {
      await adminApi.deleteOrder(deletingOrder.id);
      setOrders(orders.filter((o) => o.id !== deletingOrder.id));
      setSelectedIds((prev) => prev.filter((id) => id !== deletingOrder.id));
      if (selectedOrder?.id === deletingOrder.id) setSelectedOrder(null);
      toast.success(`Order #${deletingOrder.order_number} deleted.`);
      setDeletingOrder(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete order.");
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      const res = await adminApi.bulkDeleteOrders(selectedIds);
      const deletedIds = [...selectedIds];
      setOrders((prev) => prev.filter((o) => !deletedIds.includes(o.id)));
      if (selectedOrder && deletedIds.includes(selectedOrder.id)) {
        setSelectedOrder(null);
      }
      setSelectedIds([]);
      toast.success(res.message || `Deleted ${deletedIds.length} orders.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to delete selected orders.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkBookCourier = async (provider = "steadfast") => {
    if (selectedIds.length === 0) return;
    setBulkBookingLoading(true);
    try {
      const res = await adminApi.bulkBookCourier(selectedIds, provider);
      toast.success(res.message);
      setSelectedIds([]);
      loadOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Bulk courier booking failed.");
    } finally {
      setBulkBookingLoading(false);
    }
  };

  const handleBulkPrintLabels = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await adminApi.getBulkShippingLabels(selectedIds);
      setBulkLabelsData(res.labels || []);
      setIsBulkLabelsModalOpen(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load bulk thermal labels.");
    }
  };

  const handleAddStaffNote = async () => {
    if (!selectedOrder || !newStaffNoteText.trim()) return;
    setSavingStaffNote(true);
    try {
      const timestamp = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      const currentNotes = selectedOrder.notes ? `${selectedOrder.notes}\n` : "";
      const updatedNotes = `${currentNotes}[${timestamp} Staff]: ${newStaffNoteText.trim()}`;

      const res = await adminApi.updateOrder(selectedOrder.id, {
        notes: updatedNotes,
      });
      setSelectedOrder(res.order);
      setOrders(orders.map((o) => (o.id === res.order.id ? res.order : o)));
      setNewStaffNoteText("");
      toast.success("Staff note appended to order.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save note.");
    } finally {
      setSavingStaffNote(false);
    }
  };

  const handleExecuteRefund = async () => {
    if (!selectedOrder) return;
    setRefunding(true);

    try {
      const res = await adminApi.refundOrder(selectedOrder.id, {
        reason: refundReason,
        restock: restock,
      });

      setOrders(orders.map((o) => (o.id === selectedOrder.id ? res.order : o)));
      setSelectedOrder(res.order);
      setIsRefundModalOpen(false);
      toast.success(`Order #${res.order.order_number} refunded.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process refund.");
    } finally {
      setRefunding(false);
    }
  };

  const handleToggleSelectAll = () => {
    if (orders.length > 0 && selectedIds.length === orders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(orders.map((o) => o.id));
    }
  };

  const handleToggleSelectRow = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredOrders = orders.filter((ord) => {
    if (dateFrom && new Date(ord.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(ord.created_at) > new Date(dateTo + "T23:59:59")) return false;
    if (minTotal && ord.total_amount < parseFloat(minTotal)) return false;
    if (maxTotal && ord.total_amount > parseFloat(maxTotal)) return false;

    // Smart Triage Presets
    if (smartTriageFilter === "high_risk" && ord.risk_level !== "high" && ord.risk_level !== "moderate") return false;
    if (smartTriageFilter === "ready_pack" && !["confirmed", "processing"].includes(ord.order_status)) return false;
    if (smartTriageFilter === "in_transit" && ord.order_status !== "shipped") return false;
    if (smartTriageFilter === "rto_issues" && !(ord.return_status && ord.return_status !== "none") && ord.order_status !== "returned") return false;

    return true;
  });

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Unified Header */}
      <AdminPageHeader
        title="Orders & Fulfillment"
        description="Comprehensive workspace for online orders, POS sales receipts, fulfillment, and commercial invoices"
        badge={`${filteredOrders.length} orders`}
        breadcrumbs={[
          { label: "Operations" },
          { label: "Orders & Fulfillment" },
        ]}
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/orders/scan-to-pack"
              className="px-3 py-1.5 rounded-md bg-[#171B26] hover:bg-[#1E2333] border border-[#272B35] hover:border-[#A78BFA]/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Open Barcode Scan-to-Pack Fulfillment Workstation"
            >
              <Barcode className="w-3.5 h-3.5 text-[#A78BFA]" />
              Scan-to-Pack
            </Link>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Create Order
            </button>
          </div>
        }
      />

      {/* Sales & Revenue Stats Summary */}
      {salesSummary && (
        <AdminStatStrip
          stats={[
            {
              label: "Total Sales",
              value: formatPrice(salesSummary.total_sales),
              change: `${salesSummary.total_transactions} transactions`,
              trend: "up",
              icon: BadgeDollarSign,
            },
            {
              label: "Online Revenue",
              value: formatPrice(salesSummary.online_sales),
              change: "Web Checkout",
              trend: "neutral",
              icon: ShoppingBag,
            },
            {
              label: "In-Store POS",
              value: formatPrice(salesSummary.pos_sales),
              change: "Terminal Registers",
              trend: "neutral",
              icon: Receipt,
            },
            {
              label: "Average Order Value",
              value: formatPrice(salesSummary.average_invoice_value),
              change: "Gross Average",
              trend: "neutral",
              icon: DollarSign,
            },
          ]}
        />
      )}

      {/* Channel Navigation Strip */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.08] pb-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Channel:</span>
          {[
            { id: "all", label: "All Channels" },
            { id: "web", label: "Online Store" },
            { id: "pos", label: "POS Terminal" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setChannelTab(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                channelTab === tab.id
                  ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Operational Status Pills */}
      {orderCounts && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: "all", label: "All Orders", count: orderCounts.all },
            { id: "pending", label: "Pending", count: orderCounts.pending, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
            { id: "confirmed", label: "Confirmed", count: orderCounts.confirmed, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
            { id: "processing", label: "Processing", count: orderCounts.processing, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
            { id: "shipped", label: "Shipped", count: orderCounts.shipped, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
            { id: "delivered", label: "Delivered", count: orderCounts.delivered, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            { id: "cancelled", label: "Cancelled", count: orderCounts.cancelled, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
            { id: "refunded", label: "Refunded", count: orderCounts.refunded, color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => {
                setStatusTab(pill.id);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-md font-semibold shrink-0 border transition-all cursor-pointer flex items-center gap-1.5 ${
                statusTab === pill.id
                  ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30 shadow-xs"
                  : "bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06] hover:bg-white/[0.04]"
              }`}
            >
              <span>{pill.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${pill.color || "bg-white/10 text-slate-300"}`}>
                {pill.count ?? 0}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Smart Triage View Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-[#A78BFA]" />
          Smart Views:
        </span>
        {[
          { id: "all", label: "Default All" },
          { id: "high_risk", label: "⚠️ High Return Risk" },
          { id: "ready_pack", label: "📦 Ready to Pack" },
          { id: "in_transit", label: "🚚 In Courier Transit" },
          { id: "rto_issues", label: "🚨 Failed / RTO" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setSmartTriageFilter(v.id as any)}
            className={`px-2.5 py-1 rounded-md text-xs font-semibold shrink-0 border transition-all cursor-pointer ${
              smartTriageFilter === v.id
                ? "bg-[#211B32] text-[#A78BFA] border-[#A78BFA]/40 shadow-xs"
                : "bg-white/[0.02] text-slate-400 hover:text-white border-white/[0.06] hover:bg-white/[0.04]"
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-2.5 rounded-md bg-[#0f121b] border border-white/[0.08] space-y-2.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-2.5">
          <form onSubmit={handleSearch} className="relative w-full lg:w-72">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, customer, email..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-md pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#A78BFA]/50 transition-colors"
            />
          </form>


          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap">
            <AdminDropdown
              value={statusTab}
              onChange={(val) => {
                setStatusTab(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "all", label: "All Statuses" },
                { value: "pending", label: "Pending" },
                { value: "confirmed", label: "Confirmed" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
                { value: "returned", label: "Returned" },
                { value: "partially_cancelled", label: "Partially Cancelled" },
              ]}
            />

            <AdminDropdown
              value={paymentStatusFilter}
              onChange={(val) => {
                setPaymentStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "all", label: "All Payments" },
                { value: "paid", label: "Paid" },
                { value: "pending", label: "Pending" },
                { value: "unpaid", label: "Unpaid" },
                { value: "partially_paid", label: "Partially Paid" },
                { value: "partially_refunded", label: "Partially Refunded" },
                { value: "refunded", label: "Refunded" },
                { value: "failed", label: "Failed" },
              ]}
            />

            <AdminDropdown
              value={paymentMethodFilter}
              onChange={(val) => {
                setPaymentMethodFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { value: "all", label: "All Methods" },
                { value: "cash_on_delivery", label: "COD" },
                { value: "online", label: "Online Gateway" },
                { value: "cash", label: "POS Cash" },
                { value: "card", label: "POS Card" },
              ]}
            />

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(true)}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                dateFrom || dateTo || minTotal || maxTotal
                  ? "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                  : "bg-white/5 text-slate-400 hover:text-white border-white/10"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filters</span>
              {(dateFrom || dateTo || minTotal || maxTotal) && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
              )}
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Minimal Right Slide-Over Filter Drawer */}
        <FilterDrawer
          open={showAdvancedFilters}
          onOpenChange={setShowAdvancedFilters}
          title="Filter Orders"
          onApply={() => setShowAdvancedFilters(false)}
          onReset={handleResetFilters}
          applyLabel="Done"
          resetLabel="Reset"
          accentColor="amber"
        >
          <div className="space-y-5">
            {/* Quick Date Presets */}
            <div>
              <span className="text-[11px] font-medium text-slate-400 block mb-2">
                Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date().toISOString().split("T")[0];
                    const start = new Date();
                    start.setDate(start.getDate() - 7);
                    setDateFrom(start.toISOString().split("T")[0]);
                    setDateTo(end);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] transition cursor-pointer"
                >
                  7 Days
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const end = new Date().toISOString().split("T")[0];
                    const start = new Date();
                    start.setDate(start.getDate() - 30);
                    setDateFrom(start.toISOString().split("T")[0]);
                    setDateTo(end);
                  }}
                  className="px-2.5 py-1 rounded-md text-xs text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] hover:text-white border border-white/[0.06] transition cursor-pointer"
                >
                  30 Days
                </button>
              </div>
            </div>

            {/* Date Boundaries */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white focus:border-[#A78BFA]/50 focus:outline-none transition [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Price Thresholds */}
            <div className="space-y-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[11px] font-medium text-slate-400 block mb-1">
                Order Value ($)
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Min</label>
                  <input
                    type="number"
                    value={minTotal}
                    onChange={(e) => setMinTotal(e.target.value)}
                    placeholder="0"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Max</label>
                  <input
                    type="number"
                    value={maxTotal}
                    onChange={(e) => setMaxTotal(e.target.value)}
                    placeholder="10000"
                    className="w-full h-9 rounded-md border border-white/10 bg-[#131722] px-3 text-xs text-white font-mono focus:border-[#A78BFA]/50 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>
        </FilterDrawer>
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedIds.length}
        totalCount={filteredOrders.length}
        onClearSelection={() => setSelectedIds([])}
        onConfirmDelete={handleBulkDelete}
        isDeleting={isBulkDeleting}
        itemName="order"
        extraActions={[
          {
            label: "Print 4×6 Labels",
            icon: Printer,
            variant: "primary",
            onClick: handleBulkPrintLabels,
          },
          {
            label: bulkBookingLoading ? "Booking Steadfast..." : "Book Steadfast",
            icon: Truck,
            variant: "emerald",
            onClick: () => handleBulkBookCourier("steadfast"),
            disabled: bulkBookingLoading,
          },
          {
            label: bulkBookingLoading ? "Booking Pathao..." : "Book Pathao",
            icon: Truck,
            variant: "secondary",
            onClick: () => handleBulkBookCourier("pathao"),
            disabled: bulkBookingLoading,
          },
        ]}
      />

      {/* Orders Table Card */}
      <ScrollableTableCard
        className="bg-[#0f121b] border-white/[0.08]"
        maxHeight="calc(100vh - 270px)"
      >
        <table className="w-full text-left text-xs text-slate-300 min-w-[1020px] border-separate border-spacing-0">
          <thead className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="sticky top-0 left-0 z-30 bg-[#0e121e] border-b border-white/10 w-12 min-w-[48px] max-w-[48px] py-3.5 pl-5 pr-2 text-left">
                <AdminCheckbox
                  checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                  indeterminate={selectedIds.length > 0 && selectedIds.length < filteredOrders.length}
                  onChange={handleToggleSelectAll}
                  title="Select all orders"
                />
              </th>
              <th className="sticky top-0 left-[48px] z-30 bg-[#0e121e] border-b border-r border-white/10 p-3 text-left w-[14%] min-w-[130px] shadow-[3px_0_6px_-2px_rgba(0,0,0,0.5)]">
                Order Number
              </th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[18%] min-w-[150px]">Customer</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[11%] min-w-[90px]">Amount</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[12%] min-w-[100px]">Payment</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[12%] min-w-[100px]">Fulfillment</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[14%] min-w-[130px]">Logistics / Courier</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[12%] min-w-[110px]">IP / Security</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-left w-[11%] min-w-[100px]">Date</th>
              <th className="sticky top-0 z-20 bg-[#0e121e] border-b border-white/10 p-3 text-center min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              <tr>
                <td colSpan={10} className="p-12 text-center text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                  <span>Loading orders...</span>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-0">
                  <AdminEmptyState
                    title="No orders found"
                    description="No customer orders matched your current filters."
                  />
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedIds.includes(order.id);
                const ip = order.ip_address || "127.0.0.1";

                return (
                  <tr
                    key={order.id}
                    className={`group transition-colors ${
                      isSelected ? "bg-[#211B32]" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    <td
                      className={`sticky left-0 z-10 w-12 min-w-[48px] max-w-[48px] py-3 pl-5 pr-2 text-left transition-colors ${
                        isSelected ? "bg-[#161c28]" : "bg-[#0f121b] group-hover:bg-[#141926]"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <AdminCheckbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(order.id)}
                        title={`Select order ${order.order_number}`}
                      />
                    </td>

                    {/* Order Number (Pinned Left Identifier) */}
                    <td
                      className={`sticky left-[48px] z-10 p-3 text-left font-mono font-bold whitespace-nowrap border-r border-white/10 shadow-[3px_0_6px_-2px_rgba(0,0,0,0.5)] transition-colors ${
                        isSelected ? "bg-[#161c28]" : "bg-[#0f121b] group-hover:bg-[#141926]"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                        title={`View order #${order.order_number} details`}
                      >
                        {order.order_number}
                      </button>
                    </td>

                    {/* Customer */}
                    <td className="p-3 text-left">
                      <div className="truncate max-w-[180px]" title={`${order.customer_name} (${order.customer_email})`}>
                        <span className="font-bold text-white block truncate">{order.customer_name}</span>
                        <span className="text-[10.5px] text-slate-400 block truncate">{order.customer_email}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-3 text-left font-mono font-bold text-white whitespace-nowrap">
                      {formatPrice(order.total_amount)}
                    </td>

                    {/* Payment */}
                    <td className="p-3 text-left whitespace-nowrap">
                      <AdminStatusBadge status={order.payment_status} />
                      {order.amount_collected_courier && order.amount_collected_courier > 0 && order.payment_status !== 'paid' ? (
                        <span className="block text-[9.5px] font-mono text-amber-400/90 mt-0.5" title="Collected by courier">
                          Coll: {formatPrice(order.amount_collected_courier)}
                        </span>
                      ) : null}
                    </td>

                    {/* Fulfillment & Return Deep-Link */}
                    <td className="p-3 text-left whitespace-nowrap">
                      <AdminStatusBadge status={order.order_status} />
                      {order.return_status && order.return_status !== 'none' ? (
                        <Link
                          href={
                            order.latest_return?.return_number
                              ? `/admin/orders/returns?returnId=${encodeURIComponent(order.latest_return.return_number)}`
                              : `/admin/orders/returns?search=${encodeURIComponent(order.order_number)}`
                          }
                          className="block text-[9.5px] font-semibold text-purple-400 hover:text-purple-300 hover:underline mt-0.5"
                          title="Inspect Return / RTO details"
                        >
                          Return: {order.return_status.replace(/_/g, ' ')}
                        </Link>
                      ) : null}
                    </td>

                      {/* Logistics / Courier */}
                      {/* Logistics / Courier */}
                      <td className="p-3 text-left whitespace-nowrap">
                        {(() => {
                          const shipment = order.latest_shipment || (order.shipments && order.shipments[0]);
                          if (shipment) {
                            return (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9.5px] font-bold uppercase tracking-wider">
                                    {shipment.provider}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide ${
                                    shipment.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400' :
                                    shipment.status === 'in_transit' ? 'bg-sky-500/20 text-sky-400' :
                                    shipment.status === 'out_for_delivery' ? 'bg-cyan-500/20 text-cyan-400' :
                                    shipment.status === 'delivery_failed' ? 'bg-rose-500/20 text-rose-400' :
                                    'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {shipment.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  {shipment.consignment_id && (
                                    <span className="font-mono text-slate-400 truncate max-w-[110px]" title={`Consignment ID: ${shipment.consignment_id}`}>
                                      {shipment.consignment_id}
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleTrackShipment(order.id, shipment.id)}
                                    className="text-slate-400 hover:text-cyan-400 transition-colors p-0.5"
                                    title="Sync live tracking from courier"
                                  >
                                    <RefreshCw className="w-2.5 h-2.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePrintLabel(order.id, shipment.id)}
                                    className="text-slate-400 hover:text-[#A78BFA] transition-colors p-0.5"
                                    title="Print 4x6 Thermal Label"
                                  >
                                    <Printer className="w-2.5 h-2.5" />
                                  </button>
                                  {shipment.tracking_url && (
                                    <a
                                      href={shipment.tracking_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-slate-400 hover:text-indigo-400 transition-colors p-0.5"
                                      title="Open courier tracking portal"
                                    >
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenBookCourier(order)}
                              className="px-2 py-1 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 text-[10.5px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Truck className="w-3 h-3" /> Book Courier
                            </button>
                          );
                        })()}
                      </td>

                      {/* Fraud & Return-Risk Shield */}
                      <td className="p-3 text-left whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedRiskOrder(order)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors border ${
                              order.risk_level === "high"
                                ? "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500/25"
                                : order.risk_level === "moderate"
                                ? "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
                                : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25"
                            }`}
                            title="View Customer Delivery History & Risk Breakdown"
                          >
                            {order.risk_level === "high" ? (
                              <ShieldAlert className="w-3 h-3 text-rose-400" />
                            ) : order.risk_level === "moderate" ? (
                              <AlertTriangle className="w-3 h-3 text-amber-400" />
                            ) : (
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            )}
                            <span className="capitalize">{order.risk_level || "low"} Risk</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openIpBlockModal(ip)}
                            className="text-[9.5px] font-mono text-slate-500 hover:text-slate-300 transition-colors truncate max-w-[100px] text-left"
                            title={`IP: ${ip} (Click to inspect or restrict)`}
                          >
                            {ip}
                          </button>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-3 text-left text-slate-400 text-[11px] whitespace-nowrap">
                        {formatDate(order.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {(() => {
                            const s = order.latest_shipment || (order.shipments && order.shipments[0]);
                            if (s) {
                              return (
                                <button
                                  onClick={() => handlePrintLabel(order.id, s.id)}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-[#A78BFA] hover:bg-[#211B32] transition-colors cursor-pointer"
                                  title="Print 4x6 Thermal Shipping Label"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              );
                            }
                            return (
                              <button
                                onClick={() => handleOpenBookCourier(order)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                                title="Book Courier Consignment"
                              >
                                <Truck className="w-3.5 h-3.5" />
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => openInvoiceModal(order.id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-[#A78BFA] hover:bg-[#211B32] transition-colors cursor-pointer"
                            title="View & Print Commercial Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Inspect order details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(order)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-[#A78BFA] hover:bg-white/10 transition-colors cursor-pointer"
                            title="Edit order details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingOrder(order)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
      </ScrollableTableCard>

      {/* Server-Side Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-2 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>
            Showing page <strong className="text-white font-mono">{currentPage}</strong> of{" "}
            <strong className="text-white font-mono">{lastPage}</strong> ({totalOrders} total orders)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => loadOrders(currentPage - 1)}
            className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium transition cursor-pointer flex items-center gap-1"
          >
            Previous
          </button>
          <span className="px-2 font-mono text-slate-300">
            {currentPage} / {lastPage}
          </span>
          <button
            type="button"
            disabled={currentPage >= lastPage || loading}
            onClick={() => loadOrders(currentPage + 1)}
            className="px-3 py-1.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed text-white font-medium transition cursor-pointer flex items-center gap-1"
          >
            Next
          </button>
        </div>
      </div>

      {/* ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e121e] border border-white/15 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3.5 border-b border-white/10 shrink-0 bg-[#0e121e]">
              <div>
                <h3 className="text-sm font-black text-white">Order #{selectedOrder.order_number}</h3>
                <span className="text-[10.5px] text-slate-400">{formatDate(selectedOrder.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openInvoiceModal(selectedOrder.id)}
                  className="px-2.5 py-1 rounded-md bg-[#211B32] border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-bold hover:bg-amber-500/25 transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Generate Commercial Invoice"
                >
                  <Receipt className="w-3.5 h-3.5" /> Commercial Invoice
                </button>
                {selectedOrder.payment_status === "paid" && (
                  <button
                    onClick={() => setIsRefundModalOpen(true)}
                    className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold hover:bg-purple-500/25 transition-colors cursor-pointer"
                  >
                    Issue Refund
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Content Body with Sleek Scrollbar */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
              {/* Order Status & Financial State Header */}
              <div className="p-3.5 rounded-md bg-white/[0.03] border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                    selectedOrder.order_status === "delivered" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                    selectedOrder.order_status === "shipped" ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" :
                    selectedOrder.order_status === "processing" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" :
                    selectedOrder.order_status === "confirmed" ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" :
                    selectedOrder.order_status === "cancelled" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                    selectedOrder.order_status === "returned" ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" :
                    "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}>
                    {selectedOrder.order_status}
                  </span>

                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-2">Payment:</span>
                  <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold uppercase ${
                    selectedOrder.payment_status === "paid" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                    selectedOrder.payment_status === "refunded" ? "bg-purple-500/15 text-purple-400 border border-purple-500/30" :
                    "bg-[#211B32] text-[#A78BFA] border border-[#A78BFA]/30"
                  }`}>
                    {selectedOrder.payment_status}
                  </span>

                  <span className="text-[10.5px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/5 uppercase">
                    {selectedOrder.payment_method?.replace(/_/g, " ") || "COD"}
                  </span>
                </div>

                {/* COD Record Cash Collection */}
                {selectedOrder.payment_method === "cash_on_delivery" && selectedOrder.payment_status !== "paid" && selectedOrder.order_status !== "cancelled" && (
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleRecordCodPayment(selectedOrder.id)}
                    className="px-3 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Record COD Cash Collection
                  </button>
                )}
              </div>

              {/* Status Workflow Action Transitions */}
              {selectedOrder.order_status !== "cancelled" && selectedOrder.order_status !== "refunded" && (
                <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Authoritative State Transitions
                    </span>
                    {isUpdatingStatus && <span className="text-[10px] text-[#A78BFA] animate-pulse">Updating order...</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOrder.order_status === "pending" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "confirmed")}
                          className="px-3 py-1.5 rounded-md bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Confirm Order &rarr;
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "processing")}
                          className="px-3 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Start Processing &rarr;
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "cancelled")}
                          className="px-3 py-1.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {selectedOrder.order_status === "confirmed" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "processing")}
                          className="px-3 py-1.5 rounded-md bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Start Processing &rarr;
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "shipped")}
                          className="px-3 py-1.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Mark Shipped &rarr;
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "cancelled")}
                          className="px-3 py-1.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {selectedOrder.order_status === "processing" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "shipped")}
                          className="px-3 py-1.5 rounded-md bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Mark Shipped &rarr;
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "cancelled")}
                          className="px-3 py-1.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    {selectedOrder.order_status === "shipped" && (
                      <>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "delivered")}
                          className="px-3 py-1.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Confirm Delivered &#10003;
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingStatus}
                          onClick={() => handleQuickStatusChange(selectedOrder.id, "returned")}
                          className="px-3 py-1.5 rounded-md bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Mark Returned
                        </button>
                      </>
                    )}
                    {selectedOrder.order_status === "delivered" && (
                      <span className="text-xs text-slate-400 italic">
                        Order is delivered. You may initiate a return if customer requests it.
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                  <span className="font-bold text-white block">{selectedOrder.customer_name}</span>
                  <span className="text-slate-400 block">{selectedOrder.customer_email}</span>
                  {selectedOrder.customer_phone && (
                    <span className="text-slate-400 block font-mono">{selectedOrder.customer_phone}</span>
                  )}
                </div>

                <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Shipping Address</span>
                  <span className="text-white block">
                    {selectedOrder.shipping_address?.address_line1 || "No street address recorded"}
                  </span>
                  <span className="text-slate-400 block">
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.country}
                  </span>
                  {selectedOrder.carrier && (
                    <span className="text-cyan-400 text-[11px] block font-mono pt-1">
                      Carrier: {selectedOrder.carrier} {selectedOrder.tracking_code ? `(${selectedOrder.tracking_code})` : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block">Ordered Items</span>
                <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 divide-y divide-white/5 text-xs">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white block">{item.product_name || `Product #${item.product_id}`}</span>
                        {item.variant_name && (
                          <span className="text-[10px] text-[#A78BFA] block font-medium">Variant: {item.variant_name}</span>
                        )}
                        {item.sku && (
                          <span className="text-[10px] text-slate-500 font-mono block">SKU: {item.sku}</span>
                        )}
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity} × {formatPrice(item.unit_price)}</span>
                      </div>
                      <span className="font-bold font-mono text-white">{formatPrice(item.quantity * item.unit_price)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3 rounded-md bg-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">{formatPrice(selectedOrder.subtotal || selectedOrder.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) || selectedOrder.total_amount)}</span>
                </div>
                {Number(selectedOrder.discount_amount) > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount {selectedOrder.coupon_code ? `(${selectedOrder.coupon_code})` : ""}</span>
                    <span className="font-mono">-{formatPrice(selectedOrder.discount_amount)}</span>
                  </div>
                )}
                {Number(selectedOrder.shipping_amount) > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>Shipping</span>
                    <span className="font-mono text-white">+{formatPrice(selectedOrder.shipping_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10 font-bold text-white">
                  <span className="text-sm">Total Authoritative Amount</span>
                  <span className="text-base text-cyan-400 font-mono font-black">{formatPrice(selectedOrder.total_amount)}</span>
                </div>
              </div>

            {/* Return / RTO Status Banner & Deep-Link */}
            {selectedOrder.return_status && selectedOrder.return_status !== 'none' && (
              <div className="p-3.5 rounded-md bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Return / RTO Initiated</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {selectedOrder.return_status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {selectedOrder.latest_return?.return_number && (
                      <span className="text-[11px] font-mono text-purple-300/80 block mt-0.5">
                        Return ID: {selectedOrder.latest_return.return_number}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={
                    selectedOrder.latest_return?.return_number
                      ? `/admin/orders/returns?returnId=${encodeURIComponent(selectedOrder.latest_return.return_number)}`
                      : `/admin/orders/returns?search=${encodeURIComponent(selectedOrder.order_number)}`
                  }
                  className="px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
                >
                  Inspect Return Details &rarr;
                </Link>
              </div>
            )}

            {/* Logistics & Fulfillment Details */}
            {(() => {
              const shipment = selectedOrder.latest_shipment || (selectedOrder.shipments && selectedOrder.shipments[0]);
              return (
                <div className="p-3.5 rounded-md bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Logistics & Courier Consignment</span>
                    </div>
                    {shipment && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        shipment.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        shipment.status === 'in_transit' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' :
                        shipment.status === 'out_for_delivery' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                        shipment.status === 'delivery_failed' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {shipment.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>

                  {shipment ? (
                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div className="p-2 rounded-md bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Courier</span>
                          <span className="font-bold text-white uppercase">{shipment.provider}</span>
                        </div>
                        <div className="p-2 rounded-md bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Consignment ID</span>
                          <span className="font-mono font-bold text-cyan-400 block truncate">{shipment.consignment_id || 'N/A'}</span>
                        </div>
                        <div className="p-2 rounded-md bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">Tracking Code</span>
                          <span className="font-mono font-bold text-slate-300 block truncate">{shipment.tracking_code || 'N/A'}</span>
                        </div>
                        <div className="p-2 rounded-md bg-black/30 border border-white/5">
                          <span className="text-[10px] text-slate-400 block">COD Collectable</span>
                          <span className="font-mono font-bold text-emerald-400">{formatPrice(shipment.cod_amount || 0)}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => handleTrackShipment(selectedOrder.id, shipment.id)}
                          className="px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3 text-cyan-400" /> Sync Tracking
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintLabel(selectedOrder.id, shipment.id)}
                          className="px-2.5 py-1.5 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Printer className="w-3 h-3" /> Thermal Shipping Label
                        </button>
                        {shipment.tracking_url && (
                          <a
                            href={shipment.tracking_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" /> Courier Tracking Portal
                          </a>
                        )}
                        {!['delivered', 'cancelled', 'returned'].includes(shipment.status) && (
                          <button
                            type="button"
                            onClick={() => handleCancelShipment(selectedOrder.id, shipment.id)}
                            className="px-2.5 py-1.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ml-auto cursor-pointer"
                          >
                            <Ban className="w-3 h-3" /> Cancel Consignment
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-slate-400">
                        No courier consignment booked yet. Dispatch this package via Steadfast, Pathao, or RedX.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const ord = selectedOrder;
                          setSelectedOrder(null);
                          handleOpenBookCourier(ord);
                        }}
                        className="px-3 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Truck className="w-3.5 h-3.5" /> Book Courier
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* ORDER LIFECYCLE AUDIT TRAIL & MILESTONES */}
            <div className="p-4 rounded-md bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#A78BFA]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Order Lifecycle Milestones</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono px-2 py-0.5 rounded bg-white/5">
                  {orderTimeline.length} Event{orderTimeline.length === 1 ? '' : 's'}
                </span>
              </div>

              {loadingTimeline ? (
                <div className="py-6 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1.5 text-amber-400" />
                  <span className="text-xs">Loading lifecycle audit trail...</span>
                </div>
              ) : orderTimeline.length === 0 ? (
                <div className="py-4 text-center text-slate-500 text-xs italic">
                  No lifecycle events recorded for this order yet.
                </div>
              ) : (
                <div className="relative pl-7 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                  {orderTimeline.map((evt, idx) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={evt.id || idx} className="relative group">
                        {/* Dot indicator */}
                        <div className={`absolute -left-7 top-0.5 w-5 h-5 rounded bg-[#0e121e] border flex items-center justify-center ${
                          isLatest ? 'border-[#A78BFA] text-[#A78BFA] ring-2 ring-[#A78BFA]/20' : 'border-white/20 text-slate-400'
                        }`}>
                          {(() => {
                            switch (evt.event_type) {
                              case 'order_placed':
                              case 'confirmed':
                                return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
                              case 'courier_booked':
                              case 'picked_up':
                              case 'out_for_delivery':
                                return <Truck className="w-3 h-3 text-cyan-400" />;
                              case 'delivered':
                                return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
                              case 'customer_refused':
                              case 'delivery_failed':
                              case 'cancelled':
                                return <AlertTriangle className="w-3 h-3 text-rose-400" />;
                              case 'rto_initiated':
                              case 'returned_to_warehouse':
                              case 'restocked':
                                return <RotateCcw className="w-3 h-3 text-purple-400" />;
                              case 'accounting_adjusted':
                                return <BadgeDollarSign className="w-3 h-3 text-[#A78BFA]" />;
                              default:
                                return <Clock className="w-3 h-3 text-slate-400" />;
                            }
                          })()}
                        </div>

                        <div className="text-xs space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-white text-[12.5px]">{evt.title}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {evt.occurred_at ? formatDate(evt.occurred_at) : ''}
                            </span>
                          </div>
                          {evt.description && (
                            <p className="text-[11.5px] text-slate-300 leading-relaxed">{evt.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            {evt.actor_name && (
                              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                                By {evt.actor_name}
                              </span>
                            )}
                            {evt.metadata?.consignment_id && (
                              <span className="text-[9.5px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                                #{evt.metadata.consignment_id}
                              </span>
                            )}
                            {evt.metadata?.tracking_code && (
                              <span className="text-[9.5px] font-mono text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">
                                Trk: {evt.metadata.tracking_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Internal Staff Notes & Team Collaboration */}
              <div className="p-3.5 rounded-md bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    💬 Internal Staff Communication & Audit Notes
                  </span>
                  <span className="text-[10px] text-slate-500">Staff only (invisible to customer)</span>
                </div>

                {selectedOrder.notes && (
                  <div className="p-2.5 rounded bg-[#090b12] border border-white/10 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {selectedOrder.notes}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newStaffNoteText}
                    onChange={(e) => setNewStaffNoteText(e.target.value)}
                    placeholder="Type internal staff note (e.g. Verified customer by phone, requested Banani delivery)..."
                    className="flex-1 bg-[#090b12] border border-white/10 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#A78BFA]/50"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleAddStaffNote();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddStaffNote}
                    disabled={savingStaffNote || !newStaffNoteText.trim()}
                    className="px-3 py-1.5 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] text-xs font-bold transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {savingStaffNote ? "Saving..." : "Add Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

      {/* EDIT ORDER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0e121e] border border-white/15 rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white">Edit Order #{editingOrder.order_number}</h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Customer Name</label>
                  <input
                    type="text"
                    value={editCustName}
                    onChange={(e) => setEditCustName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Phone</label>
                  <input
                    type="text"
                    value={editCustPhone}
                    onChange={(e) => setEditCustPhone(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Fulfillment Status</label>
                  <select
                    value={editOrderStatus}
                    onChange={(e) => setEditOrderStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value="pending" className="bg-[#0e121e]">Pending</option>
                    <option value="processing" className="bg-[#0e121e]">Processing</option>
                    <option value="shipped" className="bg-[#0e121e]">Shipped</option>
                    <option value="delivered" className="bg-[#0e121e]">Delivered</option>
                    <option value="cancelled" className="bg-[#0e121e]">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Payment Status</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) => setEditPaymentStatus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value="pending" className="bg-[#0e121e]">Pending</option>
                    <option value="paid" className="bg-[#0e121e]">Paid</option>
                    <option value="refunded" className="bg-[#0e121e]">Refunded</option>
                    <option value="failed" className="bg-[#0e121e]">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Carrier</label>
                  <input
                    type="text"
                    value={editCarrier}
                    onChange={(e) => setEditCarrier(e.target.value)}
                    placeholder="e.g. DHL Express / Pathao"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Tracking Code</label>
                  <input
                    type="text"
                    value={editTracking}
                    onChange={(e) => setEditTracking(e.target.value)}
                    placeholder="Tracking #"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-3 py-1.5 rounded-md bg-white/5 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 rounded-md bg-[#A78BFA] text-[#090B10] font-black"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IP RESTRICTION & BLOCK MODAL */}
      {ipBlockModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e121e] border border-white/15 rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#A78BFA]">
                <ShieldAlert className="w-4 h-4" />
                <h3 className="text-sm font-black text-white">IP Security: {ipBlockModalData.ip}</h3>
              </div>
              <button onClick={() => setIpBlockModalData(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {ipBlockModalData.isBlocked ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <span className="font-bold block">Currently Blocked</span>
                  <span className="text-[11px] text-slate-400 block mt-1">Reason: {ipBlockModalData.existingReason}</span>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIpBlockModalData(null)}
                    className="px-3 py-1.5 rounded-md bg-white/5 text-slate-300 font-bold"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteUnblockIp}
                    disabled={isSubmittingIpBlock}
                    className="px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                  >
                    {isSubmittingIpBlock ? "Unblocking..." : "Unblock IP"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteBlockIp} className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Block Duration</label>
                  <select
                    value={blockDuration}
                    onChange={(e) => setBlockDuration(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  >
                    <option value="permanent" className="bg-[#0e121e]">Permanent Block</option>
                    <option value="24_hours" className="bg-[#0e121e]">24 Hours</option>
                    <option value="7_days" className="bg-[#0e121e]">7 Days</option>
                    <option value="30_days" className="bg-[#0e121e]">30 Days</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Reason</label>
                  <input
                    type="text"
                    required
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIpBlockModalData(null)}
                    className="px-3 py-1.5 rounded-md bg-white/5 text-slate-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingIpBlock}
                    className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold"
                  >
                    {isSubmittingIpBlock ? "Blocking..." : "Block IP Address"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {isRefundModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e121e] border border-purple-500/30 rounded-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <h3 className="text-sm font-black text-white">Process Refund</h3>
              <button onClick={() => setIsRefundModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Refund Reason</label>
                <input
                  type="text"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white"
                />
              </div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <AdminCheckbox
                  checked={restock}
                  onChange={(e) => setRestock(e.target.checked)}
                />
                <span>Restock items back into inventory</span>
              </label>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsRefundModalOpen(false)}
                  className="px-3 py-1.5 rounded-md bg-white/5 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteRefund}
                  disabled={refunding}
                  className="px-4 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  {refunding ? "Processing..." : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e121e] border border-rose-500/30 rounded-md p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-black text-white">Delete Order?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete order <span className="font-bold text-white">#{deletingOrder.order_number}</span>?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
              <button
                onClick={() => setDeletingOrder(null)}
                className="px-3 py-1.5 rounded-md bg-white/5 text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={deleting}
                className="px-4 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMERCIAL SALES INVOICE MODAL */}
      <OrderInvoiceModal
        invoice={selectedInvoice}
        loading={loadingInvoice}
        onClose={() => setSelectedInvoice(null)}
      />

      {/* BOOK COURIER MODAL */}
      {bookingOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg max-h-[90vh] bg-[#0e121e] border border-[#A78BFA]/30 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3.5 border-b border-white/10 shrink-0 bg-[#0e121e]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#A78BFA]" />
                <div>
                  <h3 className="text-sm font-black text-white">Book Courier Consignment</h3>
                  <span className="text-[11px] text-slate-400">Order #{bookingOrder.order_number}</span>
                </div>
              </div>
              <button
                onClick={() => setBookingOrder(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingCourierOptions ? (
              <div className="p-10 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                <span>Checking courier integrations & balance...</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteBookCourier} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 custom-scrollbar">
                  {/* Recipient Quick Summary */}
                  <div className="p-3 rounded-md bg-white/[0.03] border border-white/10 space-y-1">
                    <div className="flex justify-between items-center text-slate-300">
                      <span className="font-bold text-white">{bookingOrder.customer_name}</span>
                      <span className="font-mono text-cyan-400">{bookingOrder.customer_phone}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                    {bookingOrder.shipping_address?.address_line1}, {bookingOrder.shipping_address?.city}
                  </p>
                </div>

                {/* Courier Provider Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-200 block">Select Courier Partner</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "steadfast", name: "Steadfast", desc: "Express / COD" },
                      { id: "pathao", name: "Pathao", desc: "On-Demand" },
                      { id: "redx", name: "RedX", desc: "Nationwide" },
                    ].map((provider) => {
                      const isSelected = selectedCourier === provider.id;
                      const providerMeta = courierOptions?.providers?.find((p: any) => p.provider === provider.id);
                      return (
                        <button
                          key={provider.id}
                          type="button"
                          onClick={() => setSelectedCourier(provider.id)}
                          className={`p-2.5 rounded-md border text-left transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#211B32] border-[#A78BFA] text-white shadow-sm"
                              : "bg-white/[0.02] border-white/10 text-slate-400 hover:bg-white/5 hover:text-slate-200"
                          }`}
                        >
                          <div className="font-bold capitalize text-white flex items-center justify-between">
                            <span>{provider.name}</span>
                            {providerMeta?.balance !== undefined && providerMeta.balance !== null && (
                              <span className="text-[9px] font-mono text-emerald-400">৳{providerMeta.balance}</span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 block">{provider.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Weight & COD */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Parcel Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="50"
                      value={bookingWeight}
                      onChange={(e) => setBookingWeight(parseFloat(e.target.value) || 0.5)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white font-mono text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">COD Collectable (৳)</label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={bookingCod}
                      onChange={(e) => setBookingCod(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white font-mono text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Pickup Store (Pathao / RedX) */}
                {selectedCourier === "pathao" && courierOptions?.providers?.find((p: any) => p.provider === "pathao")?.stores?.length > 0 && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Pickup Hub / Store</label>
                    <select
                      value={bookingPickupStore}
                      onChange={(e) => setBookingPickupStore(e.target.value)}
                      className="w-full bg-[#0e121e] border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                    >
                      {courierOptions.providers.find((p: any) => p.provider === "pathao").stores.map((s: any) => (
                        <option key={s.store_id} value={s.store_id}>
                          {s.store_name} ({s.store_address})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Pathao Dynamic City & Zone Selectors */}
                {selectedCourier === "pathao" ? (
                  <div className="space-y-3 p-3 rounded-md bg-[#211B32]/40 border border-[#A78BFA]/20">
                    <span className="text-[11px] font-bold text-amber-300 block">Pathao Geolocation Routing</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-300 block">Recipient City</label>
                        {loadingCities ? (
                          <div className="flex items-center gap-1 text-slate-400 py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" /> Loading cities...
                          </div>
                        ) : pathaoCities.length > 0 ? (
                          <select
                            value={selectedCityId || ""}
                            onChange={(e) => handleCityChange(Number(e.target.value))}
                            className="w-full bg-[#0e121e] border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                          >
                            <option value="">-- Select City --</option>
                            {pathaoCities.map((c) => (
                              <option key={c.city_id} value={c.city_id}>
                                {c.city_name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={bookingDeliveryArea}
                            onChange={(e) => setBookingDeliveryArea(e.target.value)}
                            placeholder="e.g. Dhaka"
                            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                          />
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-300 block">Recipient Zone</label>
                        {loadingZones ? (
                          <div className="flex items-center gap-1 text-slate-400 py-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A78BFA]" /> Loading zones...
                          </div>
                        ) : (
                          <select
                            value={selectedZoneId || ""}
                            onChange={(e) => handleZoneChange(Number(e.target.value))}
                            disabled={!selectedCityId || pathaoZones.length === 0}
                            className="w-full bg-[#0e121e] border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none disabled:opacity-50"
                          >
                            <option value="">{selectedCityId ? "-- Select Zone --" : "Select City First"}</option>
                            {pathaoZones.map((z) => (
                              <option key={z.zone_id} value={z.zone_id}>
                                {z.zone_name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>

                    {pathaoAreas.length > 0 && (
                      <div className="space-y-1">
                        <label className="font-bold text-slate-300 block">Recipient Area / Sub-Zone</label>
                        <select
                          value={selectedAreaId || ""}
                          onChange={(e) => setSelectedAreaId(Number(e.target.value))}
                          className="w-full bg-[#0e121e] border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                        >
                          <option value="">-- Optional: Select Area --</option>
                          {pathaoAreas.map((a) => (
                            <option key={a.area_id} value={a.area_id}>
                              {a.area_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Pathao Price Plan Calculator */}
                    <div className="pt-2 border-t border-[#A78BFA]/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-medium text-slate-300">Delivery Cost Estimation</span>
                        <button
                          type="button"
                          onClick={handleCalculatePrice}
                          disabled={calculatingPrice || !selectedCityId || !selectedZoneId}
                          className="px-2.5 py-1 rounded-md bg-[#211B32] hover:bg-[#A78BFA]/20 text-[#A78BFA] border border-[#A78BFA]/30 text-[11px] font-bold flex items-center gap-1 transition-all disabled:opacity-40 cursor-pointer"
                        >
                          {calculatingPrice ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-[#A78BFA]" />
                              <span>Calculating...</span>
                            </>
                          ) : (
                            <>
                              <Calculator className="w-3 h-3 text-[#A78BFA]" />
                              <span>Calculate Price</span>
                            </>
                          )}
                        </button>
                      </div>

                      {estimatedPrice && (
                        <div className="p-2.5 rounded-md bg-[#211B32] border border-[#A78BFA]/30 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Plan:</span>
                            <span className="font-bold text-[#A78BFA]">{estimatedPrice.plan}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Delivery Fee:</span>
                            <span className="font-mono text-white">৳{estimatedPrice.delivery_charge}</span>
                          </div>
                          {estimatedPrice.cod_charge > 0 && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">COD / Addl Fee:</span>
                              <span className="font-mono text-white">৳{estimatedPrice.cod_charge}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-xs font-bold pt-1 border-t border-amber-500/20">
                            <span className="text-amber-300">Estimated Total:</span>
                            <span className="font-mono text-amber-400 text-sm">৳{estimatedPrice.total_charge}</span>
                          </div>
                        </div>
                      )}

                      {priceError && (
                        <div className="p-2 rounded-md bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>{priceError}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-300 block">Delivery Area / City</label>
                    <input
                      type="text"
                      value={bookingDeliveryArea}
                      onChange={(e) => setBookingDeliveryArea(e.target.value)}
                      placeholder="e.g. Dhaka, Chittagong, Sylhet"
                      className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                    />
                  </div>
                )}

                {/* Delivery Instructions */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Delivery Notes / Special Instructions</label>
                  <input
                    type="text"
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="e.g. Call before delivery, handle with care"
                    className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-white text-xs focus:border-[#A78BFA]/50 focus:outline-none"
                  />
                </div>

                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 p-4 border-t border-white/10 bg-[#0e121e] shrink-0">
                  <button
                    type="button"
                    onClick={() => setBookingOrder(null)}
                    className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBookingCourier}
                    className="px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-black inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {isBookingCourier ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-3.5 h-3.5" />
                        <span>Confirm Dispatch</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* THERMAL 4X6 SHIPPING LABEL MODAL */}
      {isLabelModalOpen && shippingLabelData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md max-h-[90vh] bg-[#0e121e] border border-white/20 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3.5 border-b border-white/10 shrink-0 bg-[#0e121e] print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#A78BFA]" />
                <h3 className="text-sm font-black text-white">Thermal Shipping Label (4" × 6")</h3>
              </div>
              <button
                onClick={() => setIsLabelModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Label Printable Container (White background, black text high-contrast thermal aesthetic) */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar">
              <div id="thermal-label" className="bg-white text-black p-5 rounded-md border-2 border-black font-sans space-y-3 print:border-none print:m-0 print:p-2">
              {/* Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-2">
                <div>
                  <h2 className="text-lg font-black tracking-tight">{shippingLabelData.store_name}</h2>
                  <p className="text-[10px] text-gray-700">{shippingLabelData.sender_phone}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 bg-black text-white text-[11px] font-black uppercase rounded">
                    {shippingLabelData.courier_name}
                  </span>
                  <p className="text-[10px] font-mono mt-1 font-bold">{shippingLabelData.delivery_type}</p>
                </div>
              </div>

              {/* Barcode / Consignment Visual */}
              <div className="text-center py-2 border-b-2 border-black bg-gray-50 rounded">
                <div className="font-mono text-xl tracking-[0.3em] font-black uppercase">
                  {shippingLabelData.consignment_id || shippingLabelData.order_number}
                </div>
                <p className="text-[9px] text-gray-500 font-mono mt-0.5">CONSIGNMENT TRACKING ID</p>
              </div>

              {/* Recipient Box */}
              <div className="border-b-2 border-black pb-2 space-y-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">DELIVER TO:</span>
                <div className="text-sm font-black">{shippingLabelData.customer_name}</div>
                <div className="text-xs font-mono font-bold">{shippingLabelData.customer_phone}</div>
                <p className="text-xs leading-snug">{shippingLabelData.customer_address}</p>
                <p className="text-xs font-bold text-gray-800">{shippingLabelData.customer_city}</p>
              </div>

              {/* Package Specs & Financial COD */}
              <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2 text-xs">
                <div>
                  <span className="text-[9px] text-gray-500 block">ORDER REF</span>
                  <span className="font-mono font-black">{shippingLabelData.order_number}</span>
                  <span className="text-[9px] text-gray-500 block mt-1">WEIGHT</span>
                  <span className="font-mono font-bold">{shippingLabelData.weight}</span>
                </div>
                <div className="bg-black text-white p-2 rounded text-center flex flex-col justify-center">
                  <span className="text-[9px] uppercase tracking-wider block opacity-80">CASH ON DELIVERY</span>
                  <span className="text-base font-mono font-black">
                    {shippingLabelData.cod_amount > 0 ? `৳${shippingLabelData.cod_amount}` : "PAID (৳0)"}
                  </span>
                </div>
              </div>

              {/* Footer / Notes */}
              <div className="text-[10px] text-gray-600 flex justify-between items-center pt-1">
                <span>{shippingLabelData.notes || "Standard Parcel Delivery"}</span>
                <span className="font-mono text-[9px]">{shippingLabelData.date}</span>
              </div>
            </div>
          </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 p-4 border-t border-white/10 bg-[#0e121e] shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setIsLabelModalOpen(false)}
                className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-black text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Thermal Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BATCH BULK 4X6 THERMAL LABELS MODAL */}
      {isBulkLabelsModalOpen && bulkLabelsData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0e121e] border border-white/20 rounded-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0 bg-[#0e121e] print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#A78BFA]" />
                <div>
                  <h3 className="text-sm font-black text-white">Batch 4" × 6" Thermal Shipping Stickers</h3>
                  <p className="text-[10px] text-slate-400">
                    {bulkLabelsData.length} shipping labels ready for thermal continuous feed printing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkLabelsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-6 custom-scrollbar print:p-0 print:space-y-0">
              {bulkLabelsData.map((lbl, idx) => (
                <div
                  key={idx}
                  className="bg-white text-black p-5 rounded-md border-2 border-black font-sans space-y-3 print:border-none print:m-0 print:p-4 print:page-break-after-always shadow-md"
                  style={{ pageBreakAfter: "always" }}
                >
                  <div className="flex justify-between items-start border-b-2 border-black pb-2">
                    <div>
                      <h2 className="text-lg font-black tracking-tight">{lbl.store_name}</h2>
                      <p className="text-[10px] text-gray-700">{lbl.sender_phone}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 bg-black text-white text-[11px] font-black uppercase rounded">
                        {lbl.courier_name}
                      </span>
                      <p className="text-[10px] font-mono mt-1 font-bold">{lbl.delivery_type}</p>
                    </div>
                  </div>

                  <div className="text-center py-2 border-b-2 border-black bg-gray-50 rounded">
                    <div className="font-mono text-xl tracking-[0.25em] font-black uppercase">
                      {lbl.consignment_id || lbl.order_number}
                    </div>
                    <p className="text-[9px] text-gray-500 font-mono mt-0.5">CONSIGNMENT TRACKING ID</p>
                  </div>

                  <div className="border-b-2 border-black pb-2 space-y-1">
                    <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">DELIVER TO:</span>
                    <div className="text-sm font-black">{lbl.customer_name}</div>
                    <div className="text-xs font-mono font-bold">{lbl.customer_phone}</div>
                    <p className="text-xs leading-snug">{lbl.customer_address}</p>
                    <p className="text-xs font-bold text-gray-800">{lbl.customer_city}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-b-2 border-black pb-2 text-xs">
                    <div>
                      <span className="text-[9px] text-gray-500 block">ORDER REF</span>
                      <span className="font-mono font-black">{lbl.order_number}</span>
                      <span className="text-[9px] text-gray-500 block mt-1">WEIGHT</span>
                      <span className="font-mono font-bold">{lbl.weight}</span>
                    </div>
                    <div className="bg-black text-white p-2 rounded text-center flex flex-col justify-center">
                      <span className="text-[9px] uppercase tracking-wider block opacity-80">COD AMOUNT</span>
                      <span className="text-base font-mono font-black">
                        {lbl.cod_amount > 0 ? `৳${lbl.cod_amount}` : "PAID (৳0)"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-gray-600 flex justify-between items-center pt-1">
                    <span>{lbl.notes || "Standard Express Parcel"}</span>
                    <span className="font-mono text-[9px]">{lbl.date}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 p-4 border-t border-white/10 bg-[#0e121e] shrink-0 print:hidden">
              <button
                type="button"
                onClick={() => setIsBulkLabelsModalOpen(false)}
                className="px-3.5 py-2 rounded-md bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-black text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print All ({bulkLabelsData.length}) Labels</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER RISK & RTO AUDIT MODAL */}
      {selectedRiskOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[#0e121e] border border-white/15 rounded-lg shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                {selectedRiskOrder.risk_level === "high" ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                ) : selectedRiskOrder.risk_level === "moderate" ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                )}
                <div>
                  <h3 className="text-sm font-black text-white">Fraud & Return-Risk Shield</h3>
                  <p className="text-[10px] text-slate-400">Order #{selectedRiskOrder.order_number}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRiskOrder(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="font-bold text-white">{selectedRiskOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-cyan-400">{selectedRiskOrder.customer_phone || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment:</span>
                  <span className="uppercase font-semibold text-slate-200">
                    {selectedRiskOrder.payment_method?.replace(/_/g, " ")} ({selectedRiskOrder.payment_status})
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-md bg-[#131722] border border-white/5">
                  <span className="text-[10px] text-slate-400 block uppercase">Total Past Orders</span>
                  <span className="text-base font-black text-white">
                    {selectedRiskOrder.customer_order_count || 1}
                  </span>
                </div>
                <div className={`p-3 rounded-md border ${
                  (selectedRiskOrder.customer_return_count || 0) > 0
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                }`}>
                  <span className="text-[10px] block uppercase opacity-80">RTO / Returns</span>
                  <span className="text-base font-black">
                    {selectedRiskOrder.customer_return_count || 0}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-md bg-white/[0.02] border border-white/5 text-[11px] text-slate-300 leading-relaxed space-y-1">
                <span className="font-bold text-white block">Recommendation:</span>
                {selectedRiskOrder.risk_level === "high" ? (
                  <p className="text-rose-300">
                    ⚠️ Customer has a record of cancelled or returned parcels. It is strongly advised to call before dispatching or request partial advance bkash delivery fee.
                  </p>
                ) : selectedRiskOrder.risk_level === "moderate" ? (
                  <p className="text-amber-300">
                    🟡 First-time Cash on Delivery customer. Standard verification recommended before handing over to courier.
                  </p>
                ) : (
                  <p className="text-emerald-300">
                    🟢 High reliability customer with verified order delivery history. Safe for instant courier dispatch.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-white/10 text-xs">
              {selectedRiskOrder.customer_phone ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedRiskOrder.customer_phone}`}
                    className="px-2.5 py-1.5 rounded bg-white/5 hover:bg-white/10 text-slate-200 font-semibold"
                  >
                    Call
                  </a>
                  <a
                    href={`https://wa.me/${selectedRiskOrder.customer_phone.replace(/[^0-9]/g, "").startsWith("01") ? "88" + selectedRiskOrder.customer_phone.replace(/[^0-9]/g, "") : selectedRiskOrder.customer_phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] font-semibold"
                  >
                    WhatsApp
                  </a>
                </div>
              ) : <div />}

              <button
                type="button"
                onClick={() => setSelectedRiskOrder(null)}
                className="px-3.5 py-1.5 rounded bg-[#A78BFA] text-[#090B10] font-bold"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
