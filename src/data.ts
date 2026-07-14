import { Material, SurfaceTreatment, DrawingAnalysis, QuotationConfig, CostBreakdown } from "./types";

export const MATERIALS: Material[] = [
  {
    key: "al6061",
    name: "鋁合金 6061-T6 (Aluminum)",
    density: 2.70, // g/cm³
    pricePerKg: 220, // NTD/kg
    machiningFactor: 1.0, // standard speed
    color: "#e2e8f0"
  },
  {
    key: "sus304",
    name: "不鏽鋼 SUS304 (Stainless Steel)",
    density: 8.00,
    pricePerKg: 380,
    machiningFactor: 0.45, // takes 2.2x longer to cut
    color: "#cbd5e1"
  },
  {
    key: "s45c",
    name: "中碳鋼 S45C (Carbon Steel)",
    density: 7.85,
    pricePerKg: 130,
    machiningFactor: 0.70, // standard steel
    color: "#94a3b8"
  },
  {
    key: "brass",
    name: "黃銅 C3604 (Brass)",
    density: 8.50,
    pricePerKg: 480,
    machiningFactor: 1.25, // cuts very fast
    color: "#fef08a"
  },
  {
    key: "pom",
    name: "塑鋼 POM (Derlin / Acetal)",
    density: 1.41,
    pricePerKg: 180,
    machiningFactor: 1.50, // extremely easy to machine
    color: "#f8fafc"
  }
];

export const SURFACE_TREATMENTS: SurfaceTreatment[] = [
  { key: "none", name: "素材表面 (No Treatment)", basePrice: 0, areaFactor: 0 },
  { key: "sandblast", name: "噴砂處理 (Sandblasting)", basePrice: 30, areaFactor: 0.15 },
  { key: "anodize_clear", name: "陽極處理 - 自然色 (Anodize Clear)", basePrice: 80, areaFactor: 0.35 },
  { key: "anodize_black", name: "陽極處理 - 黑色 (Anodize Black)", basePrice: 80, areaFactor: 0.35 },
  { key: "passivate", name: "鈍化處理 (Passivation for SUS)", basePrice: 50, areaFactor: 0.20 },
  { key: "black_oxide", name: "發黑處理 (Black Oxide)", basePrice: 40, areaFactor: 0.15 }
];

export const DEFAULT_ANALYSIS_SAMPLE: DrawingAnalysis = {
  partName: "Machined Base Frame Plate",
  length: 7.520,
  width: 4.650,
  thickness: 0.500,
  unit: "inch",
  holes: {
    count: 8,
    sizes: ["Ø.201 ±.003 (X8)"],
    isComplex: false,
    description: "8 mounting through-holes of Ø.201\" diameter."
  },
  pockets: [
    {
      shape: "rectangular",
      dimensions: "6.120 x 3.120",
      depth: 0.50,
      isThrough: true,
      count: 1
    }
  ],
  slots: {
    count: 10,
    dimensions: ".310 ±.005 SQ SQ",
    description: "10 square cavities of .310\" square (X10)."
  },
  complexity: "medium",
  explanation: "零件為一片外框尺寸 7.520\" x 4.650\" 的矩形板件，中間有一個 6.120\" x 3.120\" 的大鏤空視窗。四周分佈了 8 個 直徑 Ø.201\" 的通孔，以及 10 個尺寸為 0.310\" 的正方形定位槽。外圍與鏤空內角包含 R.25 倒角。"
};

export const DEFAULT_CONFIG: QuotationConfig = {
  materialKey: "al6061",
  thickness: 0.500,
  length: 7.520,
  width: 4.650,
  quantity: 10,
  machineHourlyRate: 1200, // TWD/hour
  setupTimeHours: 1.5,
  surfaceTreatmentKey: "anodize_black",
  marginPercent: 30, // 30% markup
  laborHourlyRate: 600, // TWD/hour for QA, prep
  customNote: "交期預計 5-7 個工作天。附品檢報告，毛邊需倒角去處乾淨。",
  clientName: "張經理 / Alex Chang",
  companyName: "科技創新研發股份有限公司"
};

/**
 * Calculations cost estimation logic based on machining parameters and dimension.
 */
export function calculateCost(config: QuotationConfig, analysis: DrawingAnalysis): CostBreakdown {
  const material = MATERIALS.find(m => m.key === config.materialKey) || MATERIALS[0];
  const surface = SURFACE_TREATMENTS.find(s => s.key === config.surfaceTreatmentKey) || SURFACE_TREATMENTS[0];

  // 1. Raw Stock Sizing (CNC machining requires slightly larger block than final piece)
  // Standard cutting allowance: add 0.25 inches (6.35mm) to length and width, 0.125 inches to thickness
  const stockLength = config.length + 0.25;
  const stockWidth = config.width + 0.25;
  const stockThickness = config.thickness + 0.125;

  // Cubic inches to cm³: 1 in³ = 16.3871 cm³
  const rawVolumeInches3 = stockLength * stockWidth * stockThickness;
  const rawVolumeCm3 = rawVolumeInches3 * 16.3871;
  
  // Weight in kg: Volume in cm³ * density in g/cm³ / 1000
  const rawWeightKg = (rawVolumeCm3 * material.density) / 1000;

  // Raw Material Cost (Cost of raw stock)
  const materialCostRaw = rawWeightKg * material.pricePerKg;

  // 2. Setup Cost (setup fee for machining, shared across total batch quantity)
  const setupCostTotal = config.setupTimeHours * config.machineHourlyRate;
  const setupCostPerPiece = setupCostTotal / Math.max(1, config.quantity);

  // 3. Machining Run Time Estimation (In Minutes)
  // Machining speed index scales cutting time
  const cuttingSpeedFactor = 1 / material.machiningFactor;

  // A. Facing & Outer Contour milling time
  // Flat plates need face-milling of both sides and contour cutting of outer dimensions.
  const faceArea = config.length * config.width;
  const perimeter = 2 * (config.length + config.width);
  const contourMillingMinutes = (faceArea * 0.05 + perimeter * config.thickness * 0.2) * cuttingSpeedFactor;

  // B. Pocket Milling time
  let pocketMillingMinutes = 0;
  if (analysis.pockets && analysis.pockets.length > 0) {
    analysis.pockets.forEach(pocket => {
      // parse dimension "6.120 x 3.120"
      let area = 0;
      try {
        const parts = pocket.dimensions.toLowerCase().split('x');
        const l = parseFloat(parts[0]) || 2;
        const w = parseFloat(parts[1]) || 2;
        area = l * w;
      } catch (e) {
        area = 4; // fallback
      }
      // Material removal time factor: e.g., 1.2 minutes per cubic inch of pocket
      const volumeRemoved = area * pocket.depth;
      pocketMillingMinutes += volumeRemoved * 1.5 * cuttingSpeedFactor * pocket.count;
    });
  } else {
    // Fallback pocket estimation if analysis is empty or manually overridden
    pocketMillingMinutes = 0;
  }

  // C. Drilling time
  // Each standard hole takes about 0.3 minutes to spot and drill in Aluminum, scaled by cutting speed factor
  const drillingMinutes = analysis.holes.count * (0.3 + config.thickness * 0.2) * cuttingSpeedFactor;

  // D. Slotting / Square Hole milling time
  // Square corners require slotting/corner relief or small cutters which are slower.
  const slottingMinutes = (analysis.slots.count * 0.8) * cuttingSpeedFactor;

  const totalMachiningTimeMinutes = contourMillingMinutes + pocketMillingMinutes + drillingMinutes + slottingMinutes;
  
  // Machining Cost per Piece
  const machiningCostPerPiece = (totalMachiningTimeMinutes / 60) * config.machineHourlyRate;

  // 4. Surface Treatment Cost
  // Surface area of 3D plate = 2 * (L * W) + 2 * (L * T) + 2 * (W * T)
  const surfaceAreaSqInches = 2 * (config.length * config.width + config.length * config.thickness + config.width * config.thickness);
  const surfaceTreatmentCostPerPiece = surface.basePrice + (surfaceAreaSqInches * surface.areaFactor);

  // 5. Quality Inspection & Packaging (Labor Cost)
  // Standard inspection takes 10 minutes, packaging takes 5 minutes
  const qaTimeHours = 10 / 60;
  const packTimeHours = 5 / 60;
  
  const qaCostPerPiece = qaTimeHours * config.laborHourlyRate;
  const packagingCostPerPiece = packTimeHours * config.laborHourlyRate;

  // 6. Assembly of Cost Breakdown
  const materialCostPerPiece = materialCostRaw;
  
  const subtotalCostPerPiece = 
    materialCostPerPiece + 
    setupCostPerPiece + 
    machiningCostPerPiece + 
    surfaceTreatmentCostPerPiece + 
    qaCostPerPiece + 
    packagingCostPerPiece;

  const markupPerPiece = subtotalCostPerPiece * (config.marginPercent / 100);
  const finalPricePerPiece = subtotalCostPerPiece + markupPerPiece;
  const grandTotal = finalPricePerPiece * config.quantity;

  return {
    rawVolume: rawVolumeInches3,
    rawWeightKg,
    materialCostRaw,
    materialCostPerPiece,
    
    setupCostTotal,
    setupCostPerPiece,
    
    millingTimeMinutes: contourMillingMinutes + pocketMillingMinutes,
    drillingTimeMinutes: drillingMinutes,
    slottingTimeMinutes: slottingMinutes,
    totalMachiningTimeMinutes,
    machiningCostPerPiece,
    
    surfaceTreatmentCostPerPiece,
    qaCostPerPiece,
    packagingCostPerPiece,
    
    subtotalCostPerPiece,
    markupPerPiece,
    finalPricePerPiece,
    grandTotal
  };
}
