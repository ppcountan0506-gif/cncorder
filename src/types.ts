export interface HoleConfig {
  count: number;
  sizes: string[];
  isComplex: boolean;
  description: string;
}

export interface PocketConfig {
  shape: string;
  dimensions: string;
  depth: number;
  isThrough: boolean;
  count: number;
}

export interface SlotConfig {
  count: number;
  dimensions: string;
  description: string;
}

export interface DrawingAnalysis {
  partName: string;
  length: number; // in inches
  width: number;  // in inches
  thickness: number; // in inches
  unit: string;   // 'inch' or 'mm'
  holes: HoleConfig;
  pockets: PocketConfig[];
  slots: SlotConfig;
  complexity: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface Material {
  key: string;
  name: string;
  density: number; // in g/cm³
  pricePerKg: number; // in TWD or USD
  machiningFactor: number; // 1.0 = standard aluminum, lower is slower/harder, higher is faster
  color: string;
}

export interface SurfaceTreatment {
  key: string;
  name: string;
  basePrice: number; // flat cost per piece
  areaFactor: number; // additional cost per square inch
}

export interface QuotationConfig {
  materialKey: string;
  thickness: number; // in inches
  length: number; // in inches
  width: number; // in inches
  quantity: number;
  machineHourlyRate: number; // TWD per hour
  setupTimeHours: number; // setup time in hours
  surfaceTreatmentKey: string;
  marginPercent: number; // e.g., 25% profit margin
  laborHourlyRate: number; // QA & prep labor rate
  customNote: string;
  clientName: string;
  companyName: string;
}

export interface CostBreakdown {
  rawVolume: number; // cubic inches
  rawWeightKg: number; // kg
  materialCostRaw: number; // total material cost
  materialCostPerPiece: number;
  
  setupCostTotal: number;
  setupCostPerPiece: number;
  
  millingTimeMinutes: number;
  drillingTimeMinutes: number;
  slottingTimeMinutes: number;
  totalMachiningTimeMinutes: number;
  machiningCostPerPiece: number;
  
  surfaceTreatmentCostPerPiece: number;
  qaCostPerPiece: number;
  packagingCostPerPiece: number;
  
  subtotalCostPerPiece: number;
  markupPerPiece: number;
  finalPricePerPiece: number;
  grandTotal: number;
}
