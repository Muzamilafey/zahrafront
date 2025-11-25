# Triage Module - Complete HMIS Implementation Guide

## Overview

This is a production-ready Triage Module for Hospital Management Information System (HMIS) built with React (frontend) and Node.js + Express + MongoDB (backend). It provides comprehensive patient triage assessment, vital signs recording, and historical tracking with automatic BMI calculation and triage category suggestion.

## Features

### ✅ Frontend Features

- **Triage Form Component**:

  - All vital signs input fields (temperature, BP, respiratory rate, pulse, SPO2)
  - Anthropometric measurements (weight, height)
  - Auto-calculated BMI with category classification
  - Pain score assessment (0-10 scale with slider)
  - Triage category selection (Red/Orange/Yellow/Green)
  - Reason for visit and additional notes
  - Real-time validation with error display
  - Auto-suggestion of triage category based on vitals
  - Loading states and success/error feedback

- **Triage History Page**:

  - List all triage assessments for a patient
  - Expandable detail view for each record
  - Pagination support (default 10 per page)
  - Summary statistics
  - Filter by triage category
  - Staff information and timestamps
  - Status tracking (pending/reviewed/completed)

- **Utility Functions**:
  - BMI calculation and categorization
  - Vital signs validation with range checking
  - Auto-suggestion of triage category
  - Data formatting helpers

### ✅ Backend Features

- **Triage Model (MongoDB)**:

  - Complete vital signs schema
  - Anthropometric measurements
  - Patient and staff references
  - Automatic BMI calculation on save
  - Timestamps and status tracking
  - Indexed queries for performance

- **API Endpoints**:

  - `POST /api/triage` - Create new triage record
  - `GET /api/triage/:patientId` - Get patient's triage history (paginated)
  - `GET /api/triage/record/:triageId` - Get specific record
  - `GET /api/triage/patient/:patientId/latest` - Get latest triage
  - `PUT /api/triage/:triageId` - Update triage record
  - `DELETE /api/triage/:triageId` - Delete triage record

- **Access Control**:
  - Authentication required for all endpoints
  - Role-based access (nurse, doctor, admin, receptionist)
  - Patients can view their own records
  - Doctors/admins can update/delete

## Folder Structure

```
Backend (Node.js + Express):
├── famzahramaternity/
│   ├── models/
│   │   └── Triage.js                 # MongoDB schema
│   ├── controllers/
│   │   └── triageController.js       # Business logic
│   ├── routes/
│   │   └── triageRoutes.js           # API endpoints
│   └── app.js                        # Main app (routes mounted)

Frontend (React):
├── zahrafront/src/
│   └── modules/
│       └── triage/
│           ├── TriageForm.jsx        # Triage assessment form
│           ├── TriageHistory.jsx     # Historical records view
│           ├── utils.js              # Helper functions
│           ├── index.js              # Module exports
│           └── README.md             # This file
```

## Installation & Setup

### Backend Setup

1. **Ensure MongoDB is running**

```bash
# Models and controller are already created
# Routes are registered in app.js
```

2. **Verify Triage model in `models/Triage.js`**

   - All vital signs fields with validation ranges
   - Auto BMI calculation on save
   - Indexes for efficient queries

3. **Verify controller in `controllers/triageController.js`**

   - Complete CRUD operations
   - Input validation
   - Error handling

4. **Verify routes in `routes/triageRoutes.js`**

   - Authentication middleware
   - Role-based access control
   - All endpoints configured

5. **Verify app.js registration**
   ```javascript
   import triageRoutes from "./routes/triageRoutes.js";
   app.use("/api/triage", triageRoutes);
   ```

### Frontend Setup

1. **Import components in your page**

```javascript
import { TriageForm, TriageHistory } from "../modules/triage";
```

2. **Use TriageForm for recording assessments**

```jsx
<TriageForm
  patientId={patientId}
  onSuccess={(data) => console.log("Triage saved:", data)}
  onCancel={() => console.log("Cancelled")}
/>
```

3. **Use TriageHistory to view past records**

```jsx
<TriageHistory patientId={patientId} />
```

## API Documentation

### Create Triage Record

```
POST /api/triage
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "patient": "patient_id",
  "temperature": 36.5,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "respiratoryRate": 16,
  "pulseRate": 72,
  "spo2": 98,
  "weight": 70,
  "height": 170,
  "painScore": 5,
  "triageCategory": "Yellow",
  "reasonForVisit": "Fever and cough",
  "notes": "Patient appears distressed"
}

Response (201 Created):
{
  "status": "success",
  "message": "Triage record created successfully",
  "data": { ...triage document }
}
```

### Get Triage History

```
GET /api/triage/:patientId?limit=20&skip=0&sort=-createdAt
Authorization: Bearer <token>

Response (200 OK):
{
  "status": "success",
  "data": [ ...triage records ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "skip": 0,
    "pages": 2
  }
}
```

### Get Latest Triage

```
GET /api/triage/patient/:patientId/latest
Authorization: Bearer <token>

Response (200 OK):
{
  "status": "success",
  "data": { ...latest triage record }
}
```

### Update Triage Record

```
PUT /api/triage/:triageId
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "triageCategory": "Red",
  "status": "reviewed",
  "notes": "Escalated to doctor"
}

Response (200 OK):
{
  "status": "success",
  "message": "Triage record updated successfully",
  "data": { ...updated triage }
}
```

### Delete Triage Record

```
DELETE /api/triage/:triageId
Authorization: Bearer <token>

Response (200 OK):
{
  "status": "success",
  "message": "Triage record deleted successfully"
}
```

## Validation Rules

### Vital Signs Ranges

- **Temperature**: 25-45°C
- **Systolic BP**: 50-250 mmHg
- **Diastolic BP**: 30-150 mmHg
- **Respiratory Rate**: 8-60 breaths/min
- **Pulse Rate**: 30-200 beats/min
- **SPO2**: 70-100%

### Measurements

- **Weight**: 2-300 kg
- **Height**: 50-250 cm
- **Pain Score**: 0-10

### Triage Categories

- **Red**: Emergency (immediate threat to life)
- **Orange**: Urgent (potentially serious)
- **Yellow**: Semi-urgent (needs attention)
- **Green**: Non-urgent (minor condition)

## Triage Category Auto-Suggestion Algorithm

The system auto-suggests triage category based on:

```
RED (Emergency):
- SPO2 < 90%
- Temperature > 40°C or < 35°C
- Pulse > 120 bpm or < 40 bpm
- Respiratory rate > 30

ORANGE (Urgent):
- SPO2 < 94%
- Temperature > 39°C
- Pulse > 110 bpm

YELLOW (Semi-urgent):
- SPO2 < 96%
- Pain score > 7

GREEN (Non-urgent):
- All vitals normal or mild abnormality
```

## BMI Classification

- **< 18.5**: Underweight
- **18.5 - 24.9**: Normal weight
- **25 - 29.9**: Overweight
- **≥ 30**: Obese

## Integration Example

### In a Patient Dashboard

```jsx
import React, { useState } from "react";
import { TriageForm, TriageHistory } from "../modules/triage";

export default function PatientPage({ patientId }) {
  const [activeTab, setActiveTab] = useState("form");

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab("form")}>New Assessment</button>
        <button onClick={() => setActiveTab("history")}>History</button>
      </div>

      {activeTab === "form" && (
        <TriageForm
          patientId={patientId}
          onSuccess={() => setActiveTab("history")}
        />
      )}

      {activeTab === "history" && <TriageHistory patientId={patientId} />}
    </div>
  );
}
```

## Error Handling

### Common Error Responses

**400 Bad Request**

```json
{
  "status": "error",
  "message": "All vital signs and required fields must be provided"
}
```

**404 Not Found**

```json
{
  "status": "error",
  "message": "Patient not found"
}
```

**500 Internal Server Error**

```json
{
  "status": "error",
  "error": "Internal server error while saving triage record"
}
```

## Performance Optimizations

1. **Database Indexing**

   - Patient + createdAt index for fast history queries
   - Created timestamps indexed for sorting

2. **Pagination**

   - Default 20 records per page
   - Configurable via query parameters

3. **Lean Queries**

   - History endpoint uses `.lean()` for read-only optimization

4. **Population Limits**
   - Only necessary fields populated (name, email, MRN)

## Security Features

1. **Authentication**

   - All endpoints require valid JWT token
   - Token attached to requests via AuthContext

2. **Authorization**

   - Role-based access control
   - Patients can only view/create their own records
   - Doctors/admins manage all records

3. **Input Validation**

   - Range validation for all numeric fields
   - Enum validation for category selection
   - Required field checks

4. **Data Protection**
   - Timestamps tracked for audit
   - Status field prevents unauthorized updates
   - No sensitive data exposed in responses

## Testing

### Frontend Testing

```javascript
// Test BMI calculation
import { calculateBMI } from "./modules/triage/utils";
console.log(calculateBMI(70, 170)); // Should return ~24.22

// Test validation
import { validateVitals } from "./modules/triage/utils";
const result = validateVitals({ temperature: 50 }); // Should fail
console.log(result.errors); // ["Temperature must be between 25-45°C"]
```

### Backend Testing

```bash
# Create triage record
curl -X POST http://localhost:5000/api/triage \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient": "patient_id",
    "temperature": 36.5,
    "bloodPressureSystolic": 120,
    "bloodPressureDiastolic": 80,
    "respiratoryRate": 16,
    "pulseRate": 72,
    "spo2": 98,
    "weight": 70,
    "height": 170,
    "painScore": 5,
    "triageCategory": "Yellow",
    "reasonForVisit": "Fever"
  }'

# Get triage history
curl -X GET "http://localhost:5000/api/triage/:patientId?limit=10&skip=0" \
  -H "Authorization: Bearer <token>"
```

## Future Enhancements

1. **Advanced Features**

   - Vitals trending graphs
   - Risk scoring algorithm
   - Alerts for abnormal vitals
   - Mobile app integration

2. **Reporting**

   - Triage analytics dashboard
   - Trend analysis
   - Queue management
   - Resource allocation insights

3. **Integration**
   - HL7 export
   - EMR integration
   - Emergency alert system
   - Appointment auto-scheduling

## Troubleshooting

### Form Not Submitting

- Check browser console for errors
- Verify patient ID is correct
- Ensure authentication token is valid
- Check network tab for API responses

### History Not Loading

- Verify patient ID is valid
- Check API endpoint is registered
- Ensure authentication is working
- Review server logs for errors

### Validation Errors

- Follow the error messages displayed
- Check vital ranges in utils.js
- Ensure all required fields are filled
- Verify numeric format (no text in number fields)

## Support & Documentation

For issues or questions:

1. Check error messages in browser console
2. Review server logs for backend errors
3. Verify all files are in correct locations
4. Check API responses in Network tab
5. Refer to API documentation above

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Status**: Production Ready ✅
