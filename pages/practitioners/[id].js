import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { withPageAuth } from '../../lib/withAuth';
import { toast } from 'react-toastify';

function TimeSlotBooking({ practitioner }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [consultationType, setConsultationType] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const { id } = router.query;

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedSlot || !consultationType) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const bookingData = {
        practitionerId: id,
        date: selectedDate,
        timeSlot: selectedSlot,
        consultationType,
        notes
      };

      console.log('Booking Data:', bookingData);

      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to book appointment');
      }

      toast.success('Appointment booked successfully');
      // Reset form
      setSelectedDate(null);
      setSelectedSlot(null);
      setConsultationType('');
      setNotes('');
    } catch (error) {
      console.error('Booking error:', error);
      toast.error(error.message);
    }
  };

  const availableDays = practitioner?.professionalProfile?.consultationDetails?.availableDays || [];

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null); // Reset selected slot when date changes
  };

  const handleSlotChange = (e) => {
    const [start, end] = e.target.value.split('-');
    setSelectedSlot({ start, end });
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-900 dark:text-white">Book Appointment</h2>
      
      <div className="mb-4">
        <label htmlFor="appointmentDate" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          Select Date:
        </label>
        <input
          type="date"
          id="appointmentDate"
          onChange={handleDateChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      {selectedDate && (
        <div className="mb-4">
          <label htmlFor="timeSlot" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
            Select Time Slot:
          </label>
          <select
            id="timeSlot"
            onChange={handleSlotChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Select a time slot</option>
            {availableDays
              .find(day => day.day === new Date(selectedDate).toLocaleString('en-US', { weekday: 'long' }))
              ?.timeSlots
              .filter(slot => !slot.isBooked)
              .map(slot => (
                <option key={`${slot.start}-${slot.end}`} value={`${slot.start}-${slot.end}`}>
                  {slot.start} - {slot.end}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="consultationType" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          Consultation Type:
        </label>
        <select
          id="consultationType"
          value={consultationType}
          onChange={(e) => setConsultationType(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">Select Type</option>
          <option value="online">Online</option>
          <option value="in-person">In-Person</option>
          <option value="phone">Phone</option>
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="notes" className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
          Notes (Optional):
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <button onClick={handleBookAppointment} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        Book Now
      </button>
    </div>
  );
}

export default function PractitionerPublicProfile() {
  const router = useRouter();
  const { id } = router.query;
  
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPractitionerProfile() {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/practitioners/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch practitioner profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Fetch Practitioner Profile Error:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPractitionerProfile();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Error</h1>
        <p>{error}</p>
        <button 
          onClick={() => router.push('/practitioners')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Back to Practitioners
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        {/* Profile Header */}
        <div className="flex items-center mb-8">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mr-6 text-4xl font-bold text-blue-600">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {profile.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {profile.professionalProfile.professionalTitle}
            </p>
          </div>
        </div>

        {/* Professional Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-900 dark:text-white">
              Professional Overview
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {profile.professionalProfile.bio || 'No bio available'}
            </p>
            
            <div className="space-y-2">
              <p>
                <strong>Specialization:</strong> {profile.professionalProfile.specialization}
              </p>
              <p>
                <strong>Years of Experience:</strong> {profile.professionalProfile.yearsOfExperience}
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-900 dark:text-white">
              Consultation Details
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Availability:</strong>{' '}
                <span className={`font-bold ${
                  profile.professionalProfile.consultationDetails.isAvailable 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {profile.professionalProfile.consultationDetails.isAvailable 
                    ? 'Currently Available' 
                    : 'Not Available'}
                </span>
              </p>
              <p>
                <strong>Consultation Fee:</strong> ${profile.professionalProfile.consultationDetails.consultationFee}
              </p>
              <p>
                <strong>Consultation Methods:</strong>{' '}
                {profile.professionalProfile.consultationDetails.consultationMethods.join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* Areas of Expertise */}
        {profile.professionalProfile.areasOfExpertise.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2  text-gray-900 dark:text-white">
              Areas of Expertise
            </h2>
            <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
              {profile.professionalProfile.areasOfExpertise.map((area, index) => (
                <li key={index}>{area}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Qualifications and Certifications */}
        {(profile.professionalProfile.qualifications.length > 0 || profile.professionalProfile.certifications.length > 0) && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-900 dark:text-white">
              Qualifications & Certifications
            </h2>
            <div className="space-y-2">
              {profile.professionalProfile.qualifications.length > 0 && (
                <div>
                  <strong>Qualifications:</strong>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                    {profile.professionalProfile.qualifications.map((qual, index) => (
                      <li key={index}>{qual}</li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.professionalProfile.certifications.length > 0 && (
                <div>
                  <strong>Certifications:</strong>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                    {profile.professionalProfile.certifications.map((cert, index) => (
                      <li key={index}>{cert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {profile && <TimeSlotBooking practitioner={profile} />}
      </div>
    </div>
  );
}

export const getServerSideProps = withPageAuth(async (ctx) => {
  return {
    props: {}, // No props needed for this page
  };
});