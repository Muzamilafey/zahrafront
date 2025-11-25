/**
 * Triage Module - Complete HMIS Triage Management System
 * 
 * This module provides comprehensive triage assessment functionality
 * for patient intake and clinical prioritization.
 * 
 * Components:
 * - TriageForm: Create/record patient triage assessments
 * - TriageHistory: View historical triage records for patients
 * 
 * Utilities:
 * - BMI calculation and categorization
 * - Vital signs validation
 * - Auto-suggestion of triage categories
 * - Triage category definitions and colors
 */

export { default as TriageForm } from './TriageForm';
export { default as TriageHistory } from './TriageHistory';
export {
  calculateBMI,
  getBMICategory,
  validateVitals,
  getRecommendedCategory,
  TRIAGE_CATEGORIES,
  formatBP,
  formatTriageData,
} from './utils';
