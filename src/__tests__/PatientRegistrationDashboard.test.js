import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PatientRegistrationDashboard from '../components/Dashboard/PatientRegistrationDashboard';
import { AuthContext } from '../contexts/AuthContext';

describe('PatientRegistrationDashboard', () => {
  test('renders and registers a patient showing temp password', async () => {
    const axiosInstance = {
      get: jest.fn((url) => {
        if (url.includes('/patient-registration/dashboard')) {
          return Promise.resolve({ data: { totalPatients: 10, todayRegistrations: 2, recentRegistrations: [] } });
        }
        if (url.includes('/doctors')) {
          return Promise.resolve({ data: [] });
        }
        if (url.includes('/consultations')) {
          return Promise.resolve({ data: [] });
        }
        return Promise.resolve({ data: {} });
      }),
      post: jest.fn((url, payload) => {
        if (url.includes('/patient-registration/register')) {
          return Promise.resolve({ data: { message: 'Patient registered', tempPassword: 'tmp1234' } });
        }
        return Promise.resolve({ data: {} });
      })
    };

    render(
      <AuthContext.Provider value={{ axiosInstance }}>
        <PatientRegistrationDashboard />
      </AuthContext.Provider>
    );

    // Wait for dashboard stats to load
    await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledWith('/patient-registration/dashboard'));

    // Fill the required fields
    fireEvent.change(screen.getByPlaceholderText(/First name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Last name/i), { target: { value: 'Patient' } });
    const dobInput = screen.queryByPlaceholderText(/DOB/i) || screen.queryByLabelText(/DOB/i);
    if (dobInput) fireEvent.change(dobInput, { target: { value: '1990-01-01' } });
    // select gender (find the select element)
    const selects = screen.getAllByRole('combobox');
    if (selects && selects.length) {
      // the gender select is likely first or second; set value to male
      fireEvent.change(selects[0], { target: { value: 'male' } });
    }
    fireEvent.change(screen.getByPlaceholderText(/Phone/i), { target: { value: '+254700000000' } });

    // submit
    fireEvent.click(screen.getByText(/Register Patient/i));

    await waitFor(() => expect(axiosInstance.post).toHaveBeenCalled());

    // modal shows temp password
    await waitFor(() => expect(screen.getByText(/Temp password: tmp1234/i)).toBeInTheDocument());
  });
});
