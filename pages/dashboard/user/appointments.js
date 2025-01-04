import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { withPageAuth } from '../../../lib/withAuth';
import { format } from 'date-fns';

export default function UserAppointmentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/user/appointments');
        
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }

        const data = await response.json();
        setAppointments(data.appointments);
      } catch (error) {
        console.error('Appointments fetch error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAppointments();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Appointments
        </h1>
        <div className="flex space-x-4">
          <span className="flex items-center text-gray-600 dark:text-gray-300">
            <span className="mr-2 text-yellow-600">⏳</span> Pending
          </span>
          <span className="flex items-center text-gray-600 dark:text-gray-300">
            <span className="mr-2 text-green-600">✅</span> Confirmed
          </span>
          <span className="flex items-center text-gray-600 dark:text-gray-300">
            <span className="mr-2 text-red-600">❌</span> Cancelled
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <p className="text-gray-600 dark:text-gray-400">
            No appointments scheduled
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((appointment) => (
            <div 
              key={appointment._id} 
              className="bg-white dark:bg-gray-800 
                         border border-gray-200 dark:border-gray-700 
                         rounded-xl 
                         shadow-md 
                         hover:shadow-xl 
                         transition-all 
                         duration-300 
                         overflow-hidden"
            >
              <div className={`h-1 w-full ${
                appointment.status === 'pending' ? 'bg-yellow-500' :
                appointment.status === 'confirmed' ? 'bg-green-500' :
                'bg-red-500'
              }`}></div>
              
              <div className="p-6">
                {/* Practitioner Information */}
                <div className="flex items-center mb-4 pb-4 border-b dark:border-gray-700">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 
                                  rounded-full flex items-center justify-center 
                                  mr-4 text-2xl font-bold text-blue-600 dark:text-blue-300">
                    {appointment.practitionerId?.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {appointment.practitionerId?.name || 'Unknown Practitioner'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {appointment.practitionerId?.professionalProfile?.professionalTitle || ''}
                    </p>
                  </div>
                </div>

                {/* Appointment Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {format(new Date(appointment.date), 'MMMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {appointment.timeSlot.start} - {appointment.timeSlot.end}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 mr-3 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="capitalize">
                      {appointment.consultationType}
                    </span>
                  </div>
                </div>

                {/* Status and Additional Info */}
                <div className="flex items-center justify-between pt-4 border-t dark:border-gray-700">
                  <span className={`font-bold ${
                    appointment.status === 'pending' ? 'text-yellow-600' :
                    appointment.status === 'confirmed' ? 'text-green-600' :
                    'text-red-600'
                  }`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                  {appointment.notes && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                      Notes: {appointment.notes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps = withPageAuth(null, ['user']);