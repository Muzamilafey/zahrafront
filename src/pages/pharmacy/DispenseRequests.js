import React from 'react';
import DispenseDrugs from './DispenseDrugs';

// Re-export the fully implemented DispenseDrugs component so the
// Pharmacy layout's `/pharmacy/dispense` route shows real requests
// and allows confirmation (dispense action) instead of a stub dump page.
export default function DispenseRequests() {
  return <DispenseDrugs />;
}
