import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { withPageAuth } from '../../lib/withAuth';

export default function PractitionersPage() {
  const { data: session } = useSession();
  const [practitioners, setPractitioners] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    specialization: '',
    consultationMethod: '',
    availability: false
  });

  useEffect(() => {
    async function fetchPractitioners() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/practitioners', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch practitioners');
        }

        const data = await response.json();
        setPractitioners(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPractitioners();
  }, []);

  // Filter practitioners based on selected criteria
  const filteredPractitioners = practitioners.filter(practitioner => {
    const specializationMatch = !filters.specialization || 
      practitioner.specialization.toLowerCase().includes(filters.specialization.toLowerCase());
    
    const methodMatch = !filters.consultationMethod || 
      practitioner.consultationMethods.includes(filters.consultationMethod);
    
    const availabilityMatch = !filters.availability || 
      practitioner.isAvailable;

    return specializationMatch && methodMatch && availabilityMatch;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 inline-block"></div>
        <p>Loading practitioners...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Wellness Practitioners
      </h1>

      {/* Filters */}
      <div className="mb-8 flex justify-center space-x-4 flex-wrap">
        <select 
          value={filters.specialization}
          onChange={(e) => setFilters(prev => ({
            ...prev, 
            specialization: e.target.value
          }))}
          className="p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Specializations</option>
          {[...new Set(practitioners.map(p => p.specialization))]
            .map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))
          }
        </select>

        <select
          value={filters.consultationMethod}
          onChange={(e) => setFilters(prev => ({
            ...prev, 
            consultationMethod: e.target.value
          }))}
          className="p-2 border rounded mb-2 dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Consultation Methods</option>
          <option value="Online">Online</option>
          <option value="In-Person">In-Person</option>
          <option value="Phone">Phone</option>
        </select>

        <label className="flex items-center mb-2">
          <input
            type="checkbox"
            checked={filters.availability}
            onChange={(e) => setFilters(prev => ({
              ...prev, 
              availability: e.target.checked
            }))}
            className="mr-2"
          />
          Available Now
        </label>
      </div>

      {filteredPractitioners.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">
          No practitioners found matching your criteria.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPractitioners.map(practitioner => (
            <div 
              key={practitioner.id} 
              className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 
                         hover:shadow-xl transition-all duration-300 
                         transform hover:-translate-y-2 
                         border border-gray-100 dark:border-gray-700"
            >
              {/* Practitioner Card Header */}
              <div className="flex items-center mb-4 pb-4 border-b dark:border-gray-700">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 
                                rounded-full flex items-center justify-center 
                                mr-4 text-2xl font-bold text-blue-600 dark:text-blue-300">
                  {practitioner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {practitioner.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {practitioner.professionalTitle}
                  </p>
                </div>
              </div>

              {/* Practitioner Card Body */}
              <div className="mb-4">
                <p className="text-gray-700 dark:text-gray-300 line-clamp-3 italic">
                  "{practitioner.bio}"
                </p>
              </div>

              {/* Practitioner Card Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Specialization
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {practitioner.specialization}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Consultation Fee
                  </span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    ${practitioner.consultationFee}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-600 dark:text-gray-400">
                    Availability
                  </span>
                  <span className={`font-bold ${
                    practitioner.isAvailable 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {practitioner.isAvailable ? 'Available' : 'Not Available'}
                  </span>
                </div>
              </div>

              {/* Consultation Methods */}
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Consultation Methods
                </h3>
                <div className="flex space-x-2">
                  {practitioner.consultationMethods.map(method => (
                    <span 
                      key={method}
                      className="px-2 py-1 bg-gray-100 dark:bg-gray- 800 rounded-full text-xs text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                    >
                      {method}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps = withPageAuth(async (ctx) => {
  return {
    props: {}, // Will be passed to the page component as props
  };
});