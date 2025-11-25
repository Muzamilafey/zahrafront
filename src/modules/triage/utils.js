/**
 * Triage utility functions and constants
 */

// Triage categories with colors and severity
export const TRIAGE_CATEGORIES = {
  Red: {
    label: 'Emergency',
    color: '#dc2626',
    bgColor: '#fee2e2',
    priority: 1,
    description: 'Immediate life-threatening condition',
  },
  Orange: {
    label: 'Urgent',
    color: '#ea580c',
    bgColor: '#ffedd5',
    priority: 2,
    description: 'Potentially serious condition',
  },
  Yellow: {
    label: 'Semi-urgent',
    color: '#ca8a04',
    bgColor: '#fef3c7',
    priority: 3,
    description: 'Non-life threatening but needs attention',
  },
  Green: {
    label: 'Non-urgent',
    color: '#16a34a',
    bgColor: '#dcfce7',
    priority: 4,
    description: 'Minor condition, can wait',
  },
};

/**
 * Calculate BMI from weight (kg) and height (cm)
 * @param {number} weight - Weight in kilograms
 * @param {number} height - Height in centimeters
 * @returns {number|null} - BMI value or null if invalid
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) return null;
  const heightInMeters = height / 100;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(2));
};

/**
 * Get BMI category
 * @param {number} bmi - BMI value
 * @returns {string} - BMI category
 */
export const getBMICategory = (bmi) => {
  if (!bmi) return 'N/A';
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

/**
 * Validate vital signs ranges
 * @param {object} vitals - Vital signs object
 * @returns {object} - { isValid: boolean, errors: array }
 */
export const validateVitals = (vitals) => {
  const errors = [];

  if (vitals.temperature && (vitals.temperature < 25 || vitals.temperature > 45)) {
    errors.push('Temperature must be between 25-45°C');
  }
  if (vitals.bloodPressureSystolic && (vitals.bloodPressureSystolic < 50 || vitals.bloodPressureSystolic > 250)) {
    errors.push('Systolic BP must be between 50-250 mmHg');
  }
  if (vitals.bloodPressureDiastolic && (vitals.bloodPressureDiastolic < 30 || vitals.bloodPressureDiastolic > 150)) {
    errors.push('Diastolic BP must be between 30-150 mmHg');
  }
  if (vitals.respiratoryRate && (vitals.respiratoryRate < 8 || vitals.respiratoryRate > 60)) {
    errors.push('Respiratory rate must be between 8-60 breaths/min');
  }
  if (vitals.pulseRate && (vitals.pulseRate < 30 || vitals.pulseRate > 200)) {
    errors.push('Pulse rate must be between 30-200 beats/min');
  }
  if (vitals.spo2 && (vitals.spo2 < 70 || vitals.spo2 > 100)) {
    errors.push('SPO2 must be between 70-100%');
  }
  if (vitals.weight && (vitals.weight < 2 || vitals.weight > 300)) {
    errors.push('Weight must be between 2-300 kg');
  }
  if (vitals.height && (vitals.height < 50 || vitals.height > 250)) {
    errors.push('Height must be between 50-250 cm');
  }
  if (vitals.painScore && (vitals.painScore < 0 || vitals.painScore > 10)) {
    errors.push('Pain score must be between 0-10');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get triage category recommendation based on vitals
 * (Optional - for auto-suggestion)
 */
export const getRecommendedCategory = (vitals) => {
  // Red flags - Emergency
  if (
    (vitals.spo2 && vitals.spo2 < 90) ||
    (vitals.temperature && vitals.temperature > 40) ||
    (vitals.temperature && vitals.temperature < 35) ||
    (vitals.pulseRate && vitals.pulseRate > 120) ||
    (vitals.pulseRate && vitals.pulseRate < 40) ||
    (vitals.respiratoryRate && vitals.respiratoryRate > 30)
  ) {
    return 'Red';
  }

  // Orange flags - Urgent
  if (
    (vitals.spo2 && vitals.spo2 < 94) ||
    (vitals.temperature && vitals.temperature > 39) ||
    (vitals.pulseRate && vitals.pulseRate > 110)
  ) {
    return 'Orange';
  }

  // Yellow flags - Semi-urgent
  if (
    (vitals.spo2 && vitals.spo2 < 96) ||
    (vitals.painScore && vitals.painScore > 7)
  ) {
    return 'Yellow';
  }

  return 'Green';
};

/**
 * Format blood pressure display
 */
export const formatBP = (systolic, diastolic) => {
  return `${systolic}/${diastolic} mmHg`;
};

/**
 * Format triage record for display
 */
export const formatTriageData = (triage) => {
  if (!triage) return null;
  return {
    ...triage,
    bpDisplay: formatBP(triage.bloodPressureSystolic, triage.bloodPressureDiastolic),
    bmiCategory: getBMICategory(triage.bmi),
    triageCategoryInfo: TRIAGE_CATEGORIES[triage.triageCategory],
  };
};
