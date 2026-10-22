"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  X, 
  RefreshCw, 
  ArrowRight, 
  FileCheck,
  ShieldAlert,
  Download
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { ImportValidationReport, ImportCommitResult, ImportRowPreview, ImportRowDiff } from "@/types";
import { toast } from "sonner";

interface ProductImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ModalStage = "select" | "validating" | "preview" | "committing" | "complete";

export function ProductImportModal({ isOpen, onClose, onSuccess }: ProductImportModalProps) {
  const [stage, setStage] = useState<ModalStage>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationReport, setValidationReport] = useState<ImportValidationReport | null>(null);
  const [commitResult, setCommitResult] = useState<ImportCommitResult | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "creates" | "updates" | "unchanged" | "errors">("all");
  const [rowSearch, setRowSearch] = useState("");
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetState = () => {
    setStage("select");
    setSelectedFile(null);
    setValidationReport(null);
    setCommitResult(null);
    setActiveTab("all");
    setRowSearch("");
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const { blob, filename } = await adminApi.downloadProductImportTemplate();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Product bulk import template downloaded.");
    } catch (err: unknown) {
      toast.error("Failed to download CSV template.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv") && !file.name.toLowerCase().endsWith(".txt")) {
        toast.error("Please select a valid CSV file (.csv).");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleStartValidation = async () => {
    if (!selectedFile) {
      toast.error("Please select a CSV file first.");
      return;
    }

    setStage("validating");
    try {
      const report = await adminApi.validateProductImport(selectedFile);
      setValidationReport(report);
      setStage("preview");
      if (report.summary.errors_count > 0) {
        toast.error(`Dry-run validation found ${report.summary.errors_count} error(s). Please review.`);
      } else {
        toast.success("Dry-run validation completed successfully. Ready to review.");
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || errorObj.message || "Failed to validate CSV file.";
      toast.error(msg);
      setStage("select");
    }
  };

  const handleCommit = async () => {
    if (!validationReport?.import_token || !validationReport.can_commit) {
      return;
    }

    setStage("committing");
    try {
      const result = await adminApi.commitProductImport(validationReport.import_token);
      setCommitResult(result);
      setStage("complete");
      toast.success(result.message || "Catalog imported successfully.");
    } catch (err: unknown) {
      const errorObj = err as { message?: string; response?: { data?: { message?: string } } };
      const msg = errorObj.response?.data?.message || errorObj.message || "Failed to commit catalog import.";
      toast.error(msg);
      setStage("preview");
    }
  };

  // Filter rows for preview table
  const filteredRows = (validationReport?.rows || []).filter((r: ImportRowPreview) => {
    if (activeTab === "creates" && r.action !== "create") return false;
    if (activeTab === "updates" && r.action !== "update") return false;
    if (activeTab === "unchanged" && r.action !== "unchanged") return false;
    if (activeTab === "errors" && r.action !== "error") return false;

    if (rowSearch.trim()) {
      const q = rowSearch.toLowerCase();
      return (
        r.sku.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.errors && r.errors.some((e) => e.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-[#0c0e14] border border-white/[0.08] rounded-lg shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0f121b]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA]">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 id="import-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                Catalog CSV Import
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Dry-Run Verified
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Upload catalog CSV, preview changes in safe dry-run mode, and explicitly commit.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-slate-400 hover:text-white rounded-md hover:bg-white/5 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STAGE 1: SELECT FILE */}
          {stage === "select" && (
            <div className="space-y-6">
              {/* Template Download Card */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#A78BFA]" />
                    <span className="text-xs font-bold text-white">Need a pre-formatted template?</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Download our ready-to-fill CSV template with sample products, categories, prices, and valid column headers.
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Required headers:</span>
                    {["sku", "name", "price", "category"].map((col) => (
                      <span key={col} className="px-1.5 py-0.5 rounded bg-[#211B32] border border-[#A78BFA]/30 text-[10px] font-mono text-[#A78BFA] font-bold">
                        {col}*
                      </span>
                    ))}
                    <span className="text-[10px] text-slate-500 ml-1">Optional: description, brand, compare_at_price, images</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="shrink-0 flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/30 text-[#A78BFA] text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingTemplate ? "animate-pulse" : ""}`} />
                  <span>{downloadingTemplate ? "Downloading..." : "Download Sample CSV"}</span>
                </button>
              </div>

              {/* Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/20 hover:border-[#A78BFA]/50 rounded-md p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white/[0.02] hover:bg-white/[0.04] group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-md bg-[#211B32] border border-[#A78BFA]/30 flex items-center justify-center text-[#A78BFA] group-hover:scale-105 transition-transform mb-3">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {selectedFile ? selectedFile.name : "Click to select or drag and drop catalog CSV"}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mb-2">
                  {selectedFile 
                    ? `File size: ${(selectedFile.size / 1024).toFixed(1)} KB`
                    : "Supports standard UTF-8 CSV exported from Phase 3I-B or compatible spreadsheets."}
                </p>
                <span className="text-[11px] font-semibold text-[#A78BFA] underline underline-offset-2">
                  {selectedFile ? "Click to choose a different file" : "Browse file"}
                </span>
              </div>

              {/* Import Guardrails Notice */}
              <div className="p-4 rounded-md bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4" /> Import Guardrails & Safety
                </div>
                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                  <li><strong>Product Matching:</strong> Matched exclusively by <code>SKU</code> (new SKUs are created; existing SKUs are updated).</li>
                  <li><strong>Stock Quantity:</strong> Read-only during catalog import to prevent inventory ledger drift and preserve FIFO cost layers.</li>
                  <li><strong>Variant Reconciliation:</strong> Existing variant IDs are preserved in-place; child variants match by SKU or combination.</li>
                  <li><strong>All-or-Nothing Commit:</strong> If any validation errors exist in the CSV, committing is blocked until resolved.</li>
                  <li><strong>Dry-Run Guarantee:</strong> Uploading and previewing does not mutate database records.</li>
                </ul>
              </div>
            </div>
          )}

          {/* STAGE 2: VALIDATING SPINNER */}
          {stage === "validating" && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#A78BFA] animate-spin" />
              <div>
                <h4 className="text-base font-bold text-white mb-1">Analyzing Catalog CSV...</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Performing server-side header validation, SKU conflict detection, category/brand verification, and variant matrix checks.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 3: VALIDATION PREVIEW */}
          {stage === "preview" && validationReport && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-md bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Rows</span>
                  <p className="text-lg font-black text-white">{validationReport.summary.total_rows}</p>
                </div>
                <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Creates</span>
                  <p className="text-lg font-black text-emerald-400">{validationReport.summary.creates}</p>
                </div>
                <div className="p-3 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Updates</span>
                  <p className="text-lg font-black text-cyan-400">{validationReport.summary.updates}</p>
                </div>
                <div className="p-3 rounded-md bg-slate-500/10 border border-slate-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unchanged</span>
                  <p className="text-lg font-black text-slate-300">{validationReport.summary.unchanged}</p>
                </div>
                <div className={`p-3 rounded-md ${validationReport.summary.errors_count > 0 ? "bg-rose-500/20 border-rose-500/40" : "bg-white/[0.04] border-white/[0.08]"}`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${validationReport.summary.errors_count > 0 ? "text-rose-400" : "text-slate-400"}`}>Errors</span>
                  <p className={`text-lg font-black ${validationReport.summary.errors_count > 0 ? "text-rose-400" : "text-slate-400"}`}>{validationReport.summary.errors_count}</p>
                </div>
              </div>

              {/* Status Banner */}
              {validationReport.summary.errors_count > 0 ? (
                <div className="p-3.5 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-rose-300">
                      Validation failed with {validationReport.summary.errors_count} error(s).
                    </p>
                    <p className="text-rose-200/80">
                      You must fix all errors in the CSV and re-upload before you can commit. No changes have been made to your store.
                    </p>
                  </div>
                </div>
              ) : validationReport.can_commit ? (
                <div className="p-3.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-300">
                      Dry-Run Successful. Ready to commit {validationReport.summary.creates + validationReport.summary.updates} change(s).
                    </p>
                    <p className="text-emerald-200/80">
                      Review the changes below and click &quot;Commit Import&quot; to apply them transactionally.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-md bg-slate-500/10 border border-slate-500/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300">
                    All catalog rows are already up-to-date. No changes are required.
                  </div>
                </div>
              )}

              {/* Filter Tabs & Row Search */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-md bg-white/[0.04] border border-white/[0.08] w-full sm:w-auto overflow-x-auto">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${activeTab === "all" ? "bg-[#A78BFA] text-[#090B10]" : "text-slate-400 hover:text-white"}`}
                  >
                    All ({validationReport.summary.total_rows})
                  </button>
                  <button
                    onClick={() => setActiveTab("creates")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${activeTab === "creates" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
                  >
                    Creates ({validationReport.summary.creates})
                  </button>
                  <button
                    onClick={() => setActiveTab("updates")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${activeTab === "updates" ? "bg-cyan-500 text-slate-950" : "text-slate-400 hover:text-white"}`}
                  >
                    Updates ({validationReport.summary.updates})
                  </button>
                  <button
                    onClick={() => setActiveTab("unchanged")}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${activeTab === "unchanged" ? "bg-slate-300 text-slate-950" : "text-slate-400 hover:text-white"}`}
                  >
                    Unchanged ({validationReport.summary.unchanged})
                  </button>
                  {validationReport.summary.errors_count > 0 && (
                    <button
                      onClick={() => setActiveTab("errors")}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition ${activeTab === "errors" ? "bg-rose-500 text-white" : "text-rose-400 hover:text-rose-300"}`}
                    >
                      Errors ({validationReport.summary.errors_count})
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Filter rows by SKU, name, or error..."
                  value={rowSearch}
                  onChange={(e) => setRowSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white/5 border border-white/[0.08] rounded-md text-white placeholder-slate-500 focus:outline-none focus:border-[#A78BFA]/50 w-full sm:w-64"
                />
              </div>

              {/* Rows Table */}
              <div className="border border-white/[0.08] rounded-md overflow-hidden max-h-80 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0f121b] text-slate-400 uppercase tracking-wider text-[10px] sticky top-0 border-b border-white/[0.08] z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-14">Row</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3">Name</th>
                      <th className="py-2.5 px-3 w-24">Action</th>
                      <th className="py-2.5 px-3">Details / Changes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] bg-[#0c0e14]">
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-500 text-xs">
                          No rows match the selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r: ImportRowPreview) => {
                        const act = (r.action || "").toUpperCase();
                        return (
                          <tr key={r.row_number} className="hover:bg-white/[0.02]">
                            <td className="py-2.5 px-3 font-mono text-slate-400">{r.row_number}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-white">{r.sku}</td>
                            <td className="py-2.5 px-3 text-slate-300 max-w-[200px] truncate" title={r.name}>
                              {r.name}
                            </td>
                            <td className="py-2.5 px-3">
                              {act === "CREATE" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  Create
                                </span>
                              )}
                              {act === "UPDATE" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                                  Update
                                </span>
                              )}
                              {act === "UNCHANGED" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-white/5 text-slate-400 border border-white/10">
                                  Unchanged
                                </span>
                              )}
                              {act === "ERROR" && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  Error
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-xs">
                              {act === "ERROR" && r.errors && (
                                <div className="space-y-0.5">
                                  {r.errors.map((e, idx) => (
                                    <span key={idx} className="block text-rose-400 font-medium">
                                      {e}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {act === "UPDATE" && (r.diff || r.changes) && (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries((r.diff || r.changes || {}) as Record<string, ImportRowDiff>).map(([key, diffVal]) => (
                                    <span key={key} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 text-[11px] text-slate-300 border border-white/[0.08]">
                                      <strong className="text-slate-400 capitalize">{key}:</strong>
                                      <span className="line-through text-rose-400">{diffVal.old}</span>
                                      <ArrowRight className="w-3 h-3 text-slate-500 inline" />
                                      <span className="text-emerald-400 font-semibold">{diffVal.new}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

                              {act === "CREATE" && r.data && (
                                <span className="text-[11px] text-slate-400">
                                  Price: ${String(r.data.price ?? "")} • Cat: {String(r.data.category ?? "")} • Brand: {String(r.data.brand ?? "")} • {String(r.data.variants_count ?? "0")} variant(s)
                                </span>
                              )}

                              {act === "UNCHANGED" && (
                                <span className="text-[11px] text-slate-500 italic">Identical to current store catalog</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STAGE 4: COMMITTING SPINNER */}
          {stage === "committing" && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <RefreshCw className="w-10 h-10 text-[#A78BFA] animate-spin" />
              <div>
                <h4 className="text-base font-bold text-white mb-1">Applying Catalog Import...</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Committing changes within an atomic database transaction. Existing variant IDs and stock relationships are safely preserved.
                </p>
              </div>
            </div>
          )}

          {/* STAGE 5: COMPLETE */}
          {stage === "complete" && commitResult && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-md bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-1">Import Completed Successfully</h4>
                <p className="text-xs text-slate-400 max-w-md">
                  All catalog updates and additions have been saved to the database and logged to the administrator audit trail.
                </p>
              </div>

              {/* Commit Summary Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg mt-4 text-left">
                <div className="p-3 rounded-md bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Products Created</span>
                  <p className="text-lg font-black text-emerald-400">{commitResult.summary.products_created}</p>
                </div>
                <div className="p-3 rounded-md bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Products Updated</span>
                  <p className="text-lg font-black text-cyan-400">{commitResult.summary.products_updated}</p>
                </div>
                <div className="p-3 rounded-md bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variants Created</span>
                  <p className="text-lg font-black text-[#A78BFA]">{commitResult.summary.variants_created}</p>
                </div>
                <div className="p-3 rounded-md bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Variants Updated</span>
                  <p className="text-lg font-black text-white">{commitResult.summary.variants_updated}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#0f121b] flex items-center justify-between">
          <div>
            {stage === "preview" && (
              <button
                type="button"
                onClick={() => setStage("select")}
                className="px-4 py-2 rounded-md text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
              >
                Upload Different File
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {stage === "select" && (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartValidation}
                  disabled={!selectedFile}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#A78BFA] hover:bg-[#B9A3FF] text-[#090B10] font-bold text-xs shadow-lg shadow-purple-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Dry-Run Validation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {stage === "preview" && (
              <>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-md text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={!validationReport?.can_commit || validationReport?.summary.errors_count > 0}
                  className="flex items-center gap-2 px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title={validationReport?.summary.errors_count ? "Fix validation errors before committing" : "Apply all validated changes to store catalog"}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Commit Import ({((validationReport?.summary.creates ?? 0) + (validationReport?.summary.updates ?? 0))} changes)</span>
                </button>
              </>
            )}

            {stage === "complete" && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  onSuccess();
                }}
                className="px-5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                Close & Refresh Catalog
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
