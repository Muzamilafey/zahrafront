
export interface Patient {
    id: string;
    name: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other';
    address: string;
    contact: string;
    admissionDate: string;
    dischargeDate: string;
    admittingPhysician: string;
  }
  
  export interface Charge {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }

  export interface DischargeSummaryDetails {
    admissionDiagnosis: string;
    finalDiagnosis: string;
    hospitalCourse: string;
    proceduresPerformed: string[];
    medicationsOnDischarge: { name: string; dosage: string; frequency: string }[];
    followUpInstructions: string;
    conditionOnDischarge: 'Stable' | 'Improved' | 'Guarded' | 'Critical';
  }
