import { useState, useEffect } from 'react';

export default function UserAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function AppointmentCard({ appointment }) {
    return (
      <div className="bg-white shadow rounded p-4 mb-4">
        <h3 className="text-lg font-semibold">Appointment with {appointment.practitionerId}</h3>
        <p>Date: {new Date(appointment.date).toLocaleDateString()}</p>
        <p>Time: {appointment.timeSlot.start} - {appointment.timeSlot.end}</p>
        <p>Status: {appointment.status}</p>
        <p>Type: {appointment.consultationType}</p>
        {appointment.notes && <p>Notes: {appointment.notes}</p>}
      </div>
    );
  }

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const response = await fetch('/api/user/appointments');
        if (!response.ok) {
          throw new Error(`Failed to fetch appointments: ${response.status}`);
        }
        const data = await response.json();
        setAppointments(data.appointments);
      } catch (err) {
        console.error("Error fetching appointments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) {
    return <p>Loading appointments...</p>;
  }

  if (error) {
    return <p>Error loading appointments: {error}</p>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">My Appointments</h2>
      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        appointments.map(appointment => (
          <AppointmentCard key={appointment._id} appointment={appointment} />
        ))
      )}
    </div>
  );
}