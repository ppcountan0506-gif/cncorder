import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { QuotationConfig, DrawingAnalysis, CostBreakdown } from "../types";
import { MATERIALS, SURFACE_TREATMENTS } from "../data";

export function exportToPDF(
  config: QuotationConfig,
  analysis: DrawingAnalysis,
  cost: CostBreakdown,
  isUsd: boolean,
  rate: number
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const formatValue = (v: number) => {
    if (isUsd) return `$${(v / rate).toFixed(2)} USD`;
    return `NT$ ${Math.round(v).toLocaleString()}`;
  };

  const getMaterialName = (key: string) => {
    return MATERIALS.find((m) => m.key === key)?.name || "Al6061-T6";
  };

  const getSurfaceName = (key: string) => {
    return SURFACE_TREATMENTS.find((s) => s.key === key)?.name || "None";
  };

  // 1. Corporate Header
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("CNC PRECISION MACHINING QUOTATION", 15, 18);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("INTELLIGENT MANUFACTURING ESTIMATION SYSTEM", 15, 25);
  
  doc.setFontSize(9);
  doc.setTextColor(14, 165, 233); // sky-500
  doc.text("AI-POWERED BLUEPRINT READOUT & MANUFACTURING AUDIT", 15, 31);

  // Quote Metadata Block (Top Right)
  const quoteNo = `QT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(100 + Math.random() * 900)}`;
  const dateStr = new Date().toISOString().slice(0, 10);

  // 2. Client & Quote Info Section (Two Columns)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("CLIENT / COMPANY DETAILS", 15, 52);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Company: ${sanitizeForPdf(config.companyName) || "Technology R&D Corp"}`, 15, 58);
  doc.text(`Contact Person: ${sanitizeForPdf(config.clientName) || "Valued Customer"}`, 15, 63);
  doc.text("Terms of Payment: Net 30 Days", 15, 68);

  // Right Column: Quote Meta
  doc.setFont("Helvetica", "bold");
  doc.text("QUOTATION INVOICE META", 120, 52);
  doc.setFont("Helvetica", "normal");
  doc.text(`Quotation No: ${quoteNo}`, 120, 58);
  doc.text(`Issue Date: ${dateStr}`, 120, 63);
  doc.text(`Validity Period: 30 Days`, 120, 68);

  // Horizontal divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(15, 73, 195, 73);

  // 3. Technical Part Blueprint Specifications
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("PART TECHNICAL SPECIFICATIONS", 15, 81);

  const specRows = [
    ["Part Description", sanitizeForPdf(analysis.partName) || "Custom Machined Plate"],
    ["Outer Dimensions (L x W x T)", `${config.length.toFixed(3)}" x ${config.width.toFixed(3)}" x ${config.thickness.toFixed(3)}" (Imperial Inches)`],
    ["Raw Material Selection", getMaterialName(config.materialKey)],
    ["Surface Post-Finishing", getSurfaceName(config.surfaceTreatmentKey)],
    ["Holes Count & Sizes", `${analysis.holes.count} holes (${analysis.holes.sizes.join(", ") || "No holes"})`],
    ["Central Cutout Pockets", `${analysis.pockets.reduce((sum, p) => sum + p.count, 0)} pocket (${analysis.pockets[0]?.dimensions || "N/A"})`],
    ["Arrayed Square Slots", `${analysis.slots.count} square slots (${analysis.slots.dimensions || "N/A"})`],
    ["Machining Difficulty Rating", `${analysis.complexity.toUpperCase()} Complexity Level`]
  ];

  autoTable(doc, {
    startY: 85,
    head: [["Technical Parameter", "Blueprint Specification Details"]],
    body: specRows,
    theme: "striped",
    headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 65 },
      1: { cellWidth: 115 },
    },
    margin: { left: 15, right: 15 }
  });

  // 4. Itemized Manufacturing Cost Breakdown Table
  const costY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("ITEMIZED MANUFACTURING COST BREAKDOWN (PER PIECE)", 15, costY);

  const costRows = [
    [
      "Raw Material Stock Cost",
      "Calculated raw blank volume + 0.25\" saw cutting margin & recycling allowance",
      formatValue(cost.materialCostPerPiece)
    ],
    [
      "CNC Engineering Setup Time",
      `CAD/CAM programming, tool loading & fixture alignment (amortized over ${config.quantity} pcs)`,
      formatValue(cost.setupCostPerPiece)
    ],
    [
      "CNC High-Speed Milling",
      `Roughing, facing, exterior contouring, and central pocket cycle (${cost.millingTimeMinutes.toFixed(1)} mins)`,
      formatValue(cost.millingTimeMinutes / 60 * config.machineHourlyRate)
    ],
    [
      "CNC Drilling & Reaming",
      `Spot drilling, high-precision chip-flute drilling & boring (${cost.drillingTimeMinutes.toFixed(1)} mins)`,
      formatValue(cost.drillingTimeMinutes / 60 * config.machineHourlyRate)
    ],
    [
      "CNC Slotting / Corner Milling",
      `Precision milling of 10 square slots and profile details (${cost.slottingTimeMinutes.toFixed(1)} mins)`,
      formatValue(cost.slottingTimeMinutes / 60 * config.machineHourlyRate)
    ],
    [
      "Surface Finishing Treatment",
      `Chemical/abrasive post-treatment: ${getSurfaceName(config.surfaceTreatmentKey)}`,
      formatValue(cost.surfaceTreatmentCostPerPiece)
    ],
    [
      "Quality Assurance & Safe Pack",
      "Vernier/CMM tolerance checks, edge deburring, and protective packaging",
      formatValue(cost.qaCostPerPiece + cost.packagingCostPerPiece)
    ],
    [
      "Manufacturing Profit Margin",
      `Engineering markup of ${config.marginPercent}% for machining overhead & warranty`,
      formatValue(cost.markupPerPiece)
    ]
  ];

  autoTable(doc, {
    startY: costY + 4,
    head: [["Cost Item", "Machining Process Specifications", "Unit Cost (Piece)"]],
    body: costRows,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 95 },
      2: { halign: "right", fontStyle: "bold", cellWidth: 35 }
    },
    margin: { left: 15, right: 15 }
  });

  // 5. Financial Summary Box
  const summaryY = (doc as any).lastAutoTable.finalY + 8;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, summaryY, 180, 30, "F");
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.5);
  doc.rect(15, summaryY, 180, 30, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text("QUOTATION INVOICE SUMMARY", 20, summaryY + 8);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Order Quantity: ${config.quantity} Pieces (pcs)`, 20, summaryY + 16);
  doc.text(`Final Unit Price (Excl. VAT): ${formatValue(cost.finalPricePerPiece)}`, 20, summaryY + 23);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(14, 165, 233); // sky-500
  doc.text(`GRAND TOTAL: ${formatValue(cost.grandTotal)}`, 112, summaryY + 18);

  // 6. QA Guidelines & Delivery Notes
  const notesY = summaryY + 36;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text("ENGINEERING STANDARDS & QUALITY WARRANTY NOTES:", 15, notesY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  
  const customNotes = sanitizeForPdf(config.customNote) || "Standard Lead time applies.";
  const noteLines = doc.splitTextToSize(customNotes, 180);
  doc.text(noteLines, 15, notesY + 5);

  // Standard engineering footnotes
  const standardFootnote = 
    "1. Dimensions are inspected to ANSI/ASME standard tolerances unless specified.\n" +
    "2. Quotation is valid for 30 days. Raw material price fluctuations may apply.\n" +
    "3. Defective parts must be reported within 10 days of delivery for reworking/compensation.";
  doc.text(standardFootnote, 15, notesY + 5 + noteLines.length * 4);

  // 7. Signature Confirmation Blocks
  const sigY = notesY + 38 + noteLines.length * 4;
  
  // Safety check to prevent running off page boundary (A4 height is 297mm)
  const finalSigY = sigY > 275 ? 275 : sigY;

  doc.setDrawColor(203, 213, 225);
  doc.line(15, finalSigY, 80, finalSigY);
  doc.line(130, finalSigY, 195, finalSigY);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Authorized Estimation Engineer Sign", 15, finalSigY + 4);
  doc.text("Client Order Approval Confirmation Sign", 130, finalSigY + 4);

  doc.save(`CNC_Quotation_${config.companyName.replace(/\s+/g, "_") || "Client"}.pdf`);
}

/**
 * Translates common Traditional Chinese strings into clean English equivalents
 * so jspdf displays standard text correctly without falling back to blank boxes.
 */
function sanitizeForPdf(text: string): string {
  if (!text) return "";
  let result = text;
  result = result.replace(/張經理/g, "Manager Chang");
  result = result.replace(/科技創新研發股份有限公司/g, "Tech Innovation R&D Co., Ltd.");
  result = result.replace(/陽極處理/g, "Anodizing");
  result = result.replace(/自然色/g, "Clear");
  result = result.replace(/黑色/g, "Black");
  result = result.replace(/噴砂/g, "Sandblasting");
  result = result.replace(/不鏽鋼/g, "Stainless Steel");
  result = result.replace(/鋁合金/g, "Aluminum Alloy");
  result = result.replace(/中碳鋼/g, "Carbon Steel");
  result = result.replace(/黃銅/g, "Brass");
  result = result.replace(/塑鋼/g, "POM Plastic");
  result = result.replace(/交期預計 5-7 個工作天。附品檢報告，毛邊需倒角去處乾淨。/g, "Est Lead time: 5-7 working days. QC Report attached. Edge deburring requested.");
  return result;
}
