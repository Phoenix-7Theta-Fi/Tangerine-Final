import { useState, useEffect } from 'react';
import { withPageAuth } from '../../../lib/withAuth';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export default function PractitionerConsultations() {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch('/api/practitioner/appointments');
        if (!response.ok) {
          throw new Error('Failed to fetch appointments');
        }
        const data = await response.json();
        setAppointments(data.appointments);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAppointments();
  }, [refreshKey]);

  const handleAppointmentAction = async (appointmentId, status) => {
    try {
      const response = await fetch('/api/practitioner/appointments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, status })
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }

      // Refresh appointments
      setRefreshKey(prev => prev + 1);
      toast.success(`Appointment ${status} successfully`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Consultation Requests</h1>
      
      {appointments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 text-lg">No consultation requests at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map(appointment => {
            const appointmentDate = new Date(appointment.date);
            const formattedDate = format(appointmentDate, 'PPP');
            
            return (
              <div 
                key={appointment._id} 
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              >
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold">
                      {appointment.userName || 'Unknown User'}
                    </h3>
                    <p className="text-gray-600">{appointment.userEmail || 'No email provided'}</p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Date:</span> {formattedDate}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Time:</span> {appointment.timeSlot.start} - {appointment.timeSlot.end}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Type:</span> {appointment.consultationType}
                    </p>
                    {appointment.notes && (
                      <p className="text-gray-600 italic">
                        <span className="font-medium">Notes:</span> {appointment.notes}
                      </p>
                    )}
                  </div>

                  {appointment.status === 'pending' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleAppointmentAction(appointment._id, 'confirmed')}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleAppointmentAction(appointment._id, 'cancelled')}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {appointment.status !== 'pending' && (
                    <div className={`text-center py-2 rounded-md ${
                      appointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps = withPageAuth(null, ['practitioner']);