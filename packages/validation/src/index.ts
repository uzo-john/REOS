import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  role: z.enum(['CUSTOMER', 'INSTALLER', 'ENGINEER', 'ADMIN']).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const ProjectCreateSchema = z.object({
  name: z.string().min(3, { message: 'Project name must be at least 3 characters' }),
  description: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export const ApplianceCreateSchema = z.object({
  name: z.string().min(2, { message: 'Appliance name must be at least 2 characters' }),
  defaultPower: z.number().positive({ message: 'Default power must be positive (Watts)' }),
  category: z.string().min(1, { message: 'Category is required' }),
  isCustom: z.boolean().default(true),
});

export const LoadCalculationSchema = z.object({
  connectedLoad: z.number().positive({ message: 'Connected load must be positive' }),
  maximumDemand: z.number().positive({ message: 'Maximum demand must be positive' }),
  dailyKwh: z.number().positive({ message: 'Daily energy consumption must be positive' }),
});

export const SolarSizingSchema = z.object({
  dailyKwh: z.number().positive({ message: 'Daily energy (kWh) is required' }),
  peakSunHours: z.number().positive({ message: 'Peak Sun Hours is required' }),
  systemLosses: z.number().min(0).max(1).default(0.15),
  tempDerating: z.number().min(0.5).max(1).default(0.9),
});

export const BatterySizingSchema = z.object({
  dailyKwh: z.number().positive({ message: 'Daily energy (kWh) is required' }),
  batteryVoltage: z.number().positive({ message: 'Battery voltage must be positive' }),
  dod: z.number().min(0.1).max(1.0).default(0.8), // Depth of discharge
  autonomyDays: z.number().positive().default(1.0),
  batteryEfficiency: z.number().min(0.5).max(1.0).default(0.95),
});

export const InverterSizingSchema = z.object({
  loadMaxPower: z.number().positive({ message: 'Maximum demand (W) is required' }),
  loadSurgePower: z.number().positive({ message: 'Surge/startup load (W) is required' }),
  safetyMargin: z.number().min(1.0).max(2.0).default(1.25),
});

export const CableSizingSchema = z.object({
  current: z.number().positive({ message: 'Current (A) is required' }),
  length: z.number().positive({ message: 'Cable length (meters) is required' }),
  voltage: z.number().positive({ message: 'System voltage (V) is required' }),
  resistivity: z.number().positive().default(1.72e-8), // copper default
  allowableDrop: z.number().min(0.005).max(0.1).default(0.03), // 3% default
  area: z.number().positive({ message: 'Conductor cross-sectional area (mm²) is required' }),
});
