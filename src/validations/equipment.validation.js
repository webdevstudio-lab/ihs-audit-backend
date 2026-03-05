import { z } from "zod";
import {
  CONDITION,
  BATTERY_TYPE,
  BATTERY_VOLTAGE,
  COMPTEUR_AMPERAGE,
  COMPTEUR_PHASE,
} from "../config/constants.js";

const conditionEnum = z.enum(Object.values(CONDITION)).optional();

// ── GENERATEUR ───────────────────────────────────────────────
export const generatorSchema = z.object({
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),
  yearOfManufacture: z.number().int().min(1990).max(2100).optional(),
  powerKva: z.number().positive().optional(),
  powerKw: z.number().positive().optional(),
  fuelType: z.enum(["diesel", "gasoline", "gas", "other"]).optional(),
  condition: conditionEnum,
  isOperational: z.boolean().optional(),
  isAutoStart: z.boolean().optional(),
  runningHours: z.number().min(0).optional(),
  lastMaintenanceHours: z.number().min(0).optional(),
  lastMaintenanceDate: z.string().optional(),
  hasOilLeak: z.boolean().optional(),
  hasCoolantLeak: z.boolean().optional(),
  hasFuelLeak: z.boolean().optional(),
  hasExhaustIssue: z.boolean().optional(),
  batteryStarterCondition: conditionEnum,
  oilLevel: z.enum(["ok", "low", "critical", "unknown"]).optional(),
  coolantLevel: z.enum(["ok", "low", "critical", "unknown"]).optional(),
  notes: z.string().trim().optional(),
});

// ── RECTIFIER ───────────────────────────────────────────────
export const rectifierSchema = z
  .object({
    brand: z.string().trim().optional(),
    model: z.string().trim().optional(),
    serialNumber: z.string().trim().optional(),
    outputVoltage: z.number().positive().optional(),
    totalCapacityAmps: z.number().positive().optional(),
    modulesTotal: z.number().int().positive().optional(),
    modulesOk: z.number().int().min(0).optional(),
    measuredVoltage: z.number().positive().optional(),
    measuredCurrent: z.number().min(0).optional(),
    condition: conditionEnum,
    isOperational: z.boolean().optional(),
    hasAlarmActive: z.boolean().optional(),
    hasDisplayFault: z.boolean().optional(),
    notes: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.modulesTotal && data.modulesOk) {
        return data.modulesOk <= data.modulesTotal;
      }
      return true;
    },
    {
      message: "modulesOk ne peut pas depasser modulesTotal",
      path: ["modulesOk"],
    },
  );

// ── BATTERIES ───────────────────────────────────────────────
export const batterySchema = z.object({
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  type: z.enum(Object.values(BATTERY_TYPE)).optional(),
  nominalVoltage: z
    .number()
    .refine(
      (v) => Object.values(BATTERY_VOLTAGE).includes(v),
      "Tension invalide — valeurs acceptees : 2, 6, 12",
    )
    .optional(),
  capacityAh: z.number().positive().optional(),
  numberOfStrings: z.number().int().positive().optional(),
  numberOfElementsPerString: z.number().int().positive().optional(),
  yearOfInstallation: z.number().int().min(1990).max(2100).optional(),
  condition: conditionEnum,
  isSwollen: z.boolean().optional(),
  swollenCount: z.number().int().min(0).optional(),
  hasLeak: z.boolean().optional(),
  hasSulfation: z.boolean().optional(),
  hasCorrosion: z.boolean().optional(),
  waterLevel: z
    .enum(["ok", "low", "critical", "unknown", "not_applicable"])
    .optional(),
  lastWaterRefillDate: z.string().optional(),
  measuredVoltageTotal: z.number().positive().optional(),
  measuredVoltagePerElement: z.number().positive().optional(),
  notes: z.string().trim().optional(),
});

// ── SOLAIRE ─────────────────────────────────────────────────
export const solarSchema = z.object({
  panelBrand: z.string().trim().optional(),
  panelModel: z.string().trim().optional(),
  panelCount: z.number().int().positive().optional(),
  panelPowerWp: z.number().positive().optional(),
  panelCondition: conditionEnum,
  hasBrokenPanel: z.boolean().optional(),
  brokenPanelCount: z.number().int().min(0).optional(),
  hasDirtyPanel: z.boolean().optional(),
  controllerBrand: z.string().trim().optional(),
  controllerModel: z.string().trim().optional(),
  controllerType: z.enum(["MPPT", "PWM", "unknown"]).optional(),
  controllerCondition: conditionEnum,
  controllerHasAlarm: z.boolean().optional(),
  measuredVoltage: z.number().positive().optional(),
  measuredCurrent: z.number().min(0).optional(),
  condition: conditionEnum,
  isOperational: z.boolean().optional(),
  notes: z.string().trim().optional(),
});

// ── PRISE DE TERRE ──────────────────────────────────────────
export const earthingSchema = z.object({
  resistance: z.number().min(0).optional(),
  measureDevice: z.string().trim().optional(),
  condition: conditionEnum,
  hasCorrosion: z.boolean().optional(),
  hasBrokenConductor: z.boolean().optional(),
  hasLooseConnection: z.boolean().optional(),
  electrodeCount: z.number().int().positive().optional(),
  notes: z.string().trim().optional(),
});

// ── TANK CARBURANT ──────────────────────────────────────────
export const fuelTankSchema = z.object({
  capacityLiters: z.number().positive().optional(),
  fuelLevel: z.number().min(0).max(100).optional(),
  fuelType: z.enum(["diesel", "gasoline", "other"]).optional(),
  condition: conditionEnum,
  hasLeak: z.boolean().optional(),
  hasCorrosion: z.boolean().optional(),
  hasWaterInFuel: z.boolean().optional(),
  isFuelFiltered: z.boolean().optional(),
  lastRefillDate: z.string().optional(),
  lastRefillLiters: z.number().positive().optional(),
  notes: z.string().trim().optional(),
});

// ── COMPTEUR CIE ─────────────────────────────────────────────
export const compteurCIESchema = z.object({
  brand: z.string().trim().optional(),
  serialNumber: z.string().trim().optional(),

  phaseType: z
    .enum(Object.values(COMPTEUR_PHASE), {
      errorMap: () => ({
        message: "Type de phase invalide — monophase ou triphase",
      }),
    })
    .optional(),

  amperage: z
    .enum(Object.values(COMPTEUR_AMPERAGE), {
      errorMap: () => ({
        message: "Ampérage invalide — valeurs: 5A 10A 15A 20A 30A 60A",
      }),
    })
    .optional(),

  indexValue: z.number().min(0, "Index invalide").optional(),
  measuredVoltage: z.number().optional(),
  measuredCurrent: z.number().optional(),

  condition: conditionEnum,
  isOperational: z.boolean().optional(),
  isSealIntact: z.boolean().optional(),
  hasAnomaly: z.boolean().optional(),

  notes: z.string().trim().optional(),
});
