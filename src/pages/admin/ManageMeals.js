import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import Toast from '../../components/ui/Toast';

export default function ManageMeals() {
  const { axiosInstance } = useContext(AuthContext);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMeal, setCurrentMeal] = useState({
    _id: null,
    name: '',
    description: '',
    price: 0,
    category: 'Other',
    isActive: true,
  });

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/meals');
      setMeals(response.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to fetch meals');
      setToast({ type: 'error', message: error });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeal = () => {
    setIsEditing(false);
    setCurrentMeal({
      _id: null,
      name: '',
      description: '',
      price: 0,
      category: 'Other',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEditMeal = (meal) => {
    setIsEditing(true);
    setCurrentMeal(meal);
    setShowModal(true);
  };

  const handleDeleteMeal = async (mealId) => {
    if (!window.confirm('Are you sure you want to delete this meal?')) return;
    try {
      await axiosInstance.delete(`/meals/${mealId}`);
      setToast({ type: 'success', message: 'Meal deleted successfully!' });
      fetchMeals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to delete meal.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    try {
      if (isEditing) {
        await axiosInstance.put(`/meals/${currentMeal._id}`, currentMeal);
        setToast({ type: 'success', message: 'Meal updated successfully!' });
      } else {
        await axiosInstance.post('/meals', currentMeal);
        setToast({ type: 'success', message: 'Meal added successfully!' });
      }
      setShowModal(false);
      fetchMeals();
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to save meal.' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && meals.length === 0) return <div className="p-6">Loading meals...</div>;
  if (error && !toast) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Manage Meals</h2>
        <button onClick={handleAddMeal} className="btn-brand">Add New Meal</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {meals.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                  No meals found.
                </td>
              </tr>
            ) : (
              meals.map((meal) => (
                <tr key={meal._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meal.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meal.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${meal.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meal.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {meal.isActive ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Yes
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        No
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEditMeal(meal)} className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteMeal(meal._id)} className="text-red-600 hover:text-red-900">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-1/3 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{isEditing ? 'Edit Meal' : 'Add New Meal'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Meal Name</label>
                <input
                  type="text"
                  id="name"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={currentMeal.name}
                  onChange={(e) => setCurrentMeal({ ...currentMeal, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="description"
                  rows="3"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={currentMeal.description}
                  onChange={(e) => setCurrentMeal({ ...currentMeal, description: e.target.value })}
                ></textarea>
              </div>
              <div className="mb-4">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price</label>
                <input
                  type="number"
                  id="price"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={currentMeal.price}
                  onChange={(e) => setCurrentMeal({ ...currentMeal, price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Category</label>
                <select
                  id="category"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  value={currentMeal.category}
                  onChange={(e) => setCurrentMeal({ ...currentMeal, category: e.target.value })}
                >
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                  <option value="Beverage">Beverage</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="mb-4 flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={currentMeal.isActive}
                  onChange={(e) => setCurrentMeal({ ...currentMeal, isActive: e.target.checked })}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Is Active</label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Meal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}