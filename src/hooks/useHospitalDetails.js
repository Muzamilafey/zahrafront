import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

const useHospitalDetails = () => {
  const { axiosInstance } = useContext(AuthContext);
  const [hospitalDetails, setHospitalDetails] = useState({ name: 'Genz Community Hospital', location: 'Medtown, Kajiado', contacts: 'Ph: +254 722 651 888' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!axiosInstance) return;
      try {
        const response = await axiosInstance.get('/setting/hospital-details');
        if (response.data) {
          setHospitalDetails(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch hospital details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [axiosInstance]);

  return { hospitalDetails, loading };
};

export default useHospitalDetails;
