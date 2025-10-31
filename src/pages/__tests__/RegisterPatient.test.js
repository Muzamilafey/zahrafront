import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterPatient from '../RegisterPatient';

// mock AuthContext to provide axiosInstance
jest.mock('../../contexts/AuthContext', () => ({
  AuthContext: React.createContext({}),
  // default export not used
}));

// provide a simple wrapper that injects axiosInstance via context value
import { AuthContext } from '../../contexts/AuthContext';

describe('RegisterPatient', () => {
  test('submits payload to /patients/create', async () => {
    const mockPost = jest.fn().mockResolvedValue({ data: { patient: { _id: 'p1', hospitalId: 'H-001' } } });
    const axiosInstance = { get: jest.fn().mockResolvedValue({ data: { doctors: [] } }), post: mockPost };

    render(
      <AuthContext.Provider value={{ axiosInstance, user: { _id: 'u1' } }}>
        <RegisterPatient />
      </AuthContext.Provider>
    );

    // fill minimal required fields
    const firstName = screen.getByPlaceholderText(/First Name/i);
    const lastName = screen.getByPlaceholderText(/Last Name/i);
    const phone = screen.getByPlaceholderText(/Phone Number \(Primary\)/i);
    const dob = screen.getByLabelText(/Date of Birth/i);
    const gender = screen.getByRole('combobox', { name: '' }) || screen.getByDisplayValue('');

    fireEvent.change(firstName, { target: { value: 'Test' } });
    fireEvent.change(lastName, { target: { value: 'Patient' } });
    fireEvent.change(phone, { target: { value: '+254700000000' } });
    fireEvent.change(dob, { target: { value: '2000-01-01' } });
    // pick gender select by finding option
    const genderSelect = screen.getByRole('combobox', { name: '' });
    fireEvent.change(genderSelect, { target: { value: 'male' } });

    const submit = screen.getByText(/Register Patient/i);
    fireEvent.click(submit);

    await waitFor(() => expect(mockPost).toHaveBeenCalled());
    const calledWith = mockPost.mock.calls[0];
    expect(calledWith[0]).toBe('/patients/create');
    // payload contains name and phonePrimary
    expect(calledWith[1].firstName).toBe('Test');
    expect(calledWith[1].lastName).toBe('Patient');
    expect(calledWith[1].phonePrimary).toBe('+254700000000');
  });
});
