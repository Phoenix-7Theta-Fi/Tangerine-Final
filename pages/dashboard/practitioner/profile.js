import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { withPageAuth } from '../../../lib/withAuth';
import Link from 'next/link';

// TimeSlotModal component
function TimeSlotModal({ day, onClose, onSave, initialSlots = [] }) {
  const [slots, setSlots] = useState(initialSlots);

  // Generate time slots from 9 AM to 5 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      const start = `${hour.toString().padStart(2, '0')}:00`;
      const end = `${(hour + 1).toString().padStart(2, '0')}:00`;
      const existingSlot = initialSlots.find(s => s.start === start && s.end === end);
      slots.push({
        start,
        end,
        isBooked: existingSlot ? existingSlot.isBooked : false
      });
    }
    return slots;
  };

  useEffect(() => {
    if (initialSlots.length === 0) {
      setSlots(generateTimeSlots());
    }
  }, [day]);

  const handleSlotToggle = (index) => {
    const newSlots = [...slots];
    newSlots[index].isBooked = !newSlots[index].isBooked;
    setSlots(newSlots);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-11/12 max-w-2xl">
        <h2 className="text-xl font-bold mb-4">Manage Time Slots for {day}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {slots.map((slot, index) => (
            <button
              key={index}
              onClick={() => handleSlotToggle(index)}
              className={`p-3 rounded transition-colors ${
                slot.isBooked 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {slot.start} - {slot.end}
            </button>
          ))}
        </div>
        <div className="flex justify-end mt-6 space-x-2">
          <button 
            onClick={() => onSave(slots)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Save
          </button>
          <button 
            onClick={onClose}
            className="bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 px-4 py-2 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PractitionerProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [profile, setProfile] = useState({
    professionalProfile: {
      specialization: '',
      professionalTitle: '',
      bio: '',
      yearsOfExperience: 0,
      areasOfExpertise: [],
      consultationDetails: {
        isAvailable: false,
        availableDays: [],
        consultationMethods: [],
        consultationFee: 0
      },
      qualifications: [],
      certifications: [],
      contactInformation: {}
    }
  });
  
  const [posts, setPosts] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Handle time slot management
  const handleManageTimeSlots = (day) => {
    const dayData = profile.professionalProfile.consultationDetails.availableDays
      .find(d => d.day === day);
    setSelectedDay(day);
    setShowTimeSlotModal(true);
  };

  const handleSaveTimeSlots = async (slots) => {
    try {
      const response = await fetch('/api/practitioner/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: selectedDay,
          timeSlots: slots
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save time slots');
      }

      const data = await response.json();
      
      // Update local state with new time slots
      setProfile(prev => ({
        ...prev,
        professionalProfile: {
          ...prev.professionalProfile,
          consultationDetails: {
            ...prev.professionalProfile.consultationDetails,
            availableDays: prev.professionalProfile.consultationDetails.availableDays.map(d => 
              d.day === selectedDay ? { ...d, timeSlots: slots } : d
            )
          }
        }
      }));

      setShowTimeSlotModal(false);
    } catch (error) {
      console.error('Failed to save time slots', error);
      setError(error.message);
    }
  };

  useEffect(() => {
    async function fetchProfileData() {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/practitioner/profile', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch profile');
        }

        const data = await response.json();
        
        setProfile(prevProfile => ({
          ...prevProfile,
          professionalProfile: data.profile || prevProfile.professionalProfile
        }));
        setPosts(data.posts || []);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [session]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/practitioner/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          professionalProfile: profile.professionalProfile 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile({
        professionalProfile: data.profile
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update failed', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`/api/blog/delete/${postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Post deletion failed', error);
      setError(error.message);
    }
  };

  function ProfileEditForm({ profile, onSave, onChange }) {
    const handleChange = (field, value) => {
      onChange(prev => ({
        ...prev,
        professionalProfile: {
          ...prev.professionalProfile,
          [field]: value
        }
      }));
    };

    const handleConsultationChange = (field, value) => {
      onChange(prev => ({
        ...prev,
        professionalProfile: {
          ...prev.professionalProfile,
          consultationDetails: {
            ...prev.professionalProfile.consultationDetails,
            [field]: value
          }
        }
      }));
    };

    return (
      <form onSubmit={onSave} className="space-y-6">
        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
          <input
            type="text"
            value={profile.professionalProfile.specialization}
            onChange={(e) => handleChange('specialization', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Professional Title</label>
          <input
            type="text"
            value={profile.professionalProfile.professionalTitle}
            onChange={(e) => handleChange('professionalTitle', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-2">Bio</label>
          <textarea
            value={profile.professionalProfile.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          />
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Consultation Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Consultation Availability
              </label>
              <select
                value={profile.professionalProfile.consultationDetails.isAvailable}
                onChange={(e) => handleConsultationChange('isAvailable', e.target.value === 'true')}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              >
                <option value="false">Not Available</option>
                <option value="true">Available</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Consultation Fee ($)
              </label>
              <input
                type="number"
                min="0"
                value={profile.professionalProfile.consultationDetails.consultationFee}
                onChange={(e) => handleConsultationChange('consultationFee', Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Consultation Methods
            </label>
            <div className="flex space-x-4">
              {['Online', 'In-Person', 'Phone'].map(method => (
                <label key={method} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={profile.professionalProfile.consultationDetails.consultationMethods.includes(method)}
                    onChange={(e) => {
                      const methods = profile.professionalProfile.consultationDetails.consultationMethods;
                      const updatedMethods = e.target.checked
                        ? [...methods, method]
                        : methods.filter(m => m !== method);
                      handleConsultationChange('consultationMethods', updatedMethods);
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{method}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">
              Available Days
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                <label key={day} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={profile.professionalProfile.consultationDetails.availableDays.some(d => d.day === day)}
                    onChange={(e) => {
                      const availableDays = profile.professionalProfile.consultationDetails.availableDays;
                      const updatedDays = e.target.checked
                        ? [...availableDays, { day, timeSlots: [] }]
                        : availableDays.filter(d => d.day !== day);
                      handleConsultationChange('availableDays', updatedDays);
                    }}
                    className="form-checkbox h-5 w-5 text-blue-600 dark:text-blue-400"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Save Profile
        </button>
      </form>
    );
  }

  function ProfileDisplayView({ profile }) {
    return (
      <div className="space-y-6">
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">Specialization:</p>
          <p className="text-lg text-gray-900 dark:text-white">{profile.professionalProfile.specialization || 'N/A'}</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">Professional Title:</p>
          <p className="text-lg text-gray-900 dark:text-white">{profile.professionalProfile.professionalTitle || 'N/A'}</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-600 dark:text-gray-400">Bio:</p>
          <p className="text-lg text-gray-900 dark:text-white">{profile.professionalProfile.bio || 'N/A'}</p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Consultation Details</h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Availability:</p>
              <p className={`font-bold ${
                profile.professionalProfile.consultationDetails.isAvailable 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {profile.professionalProfile.consultationDetails.isAvailable 
                  ? 'Available for Consultation' 
                  : 'Not Currently Available'}
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Consultation Fee:</p>
              <p className="font-bold text-gray-900 dark:text-white">
                ${profile.professionalProfile.consultationDetails.consultationFee || 0}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-medium text-gray-600 dark:text-gray-400">Consultation Methods:</p>
            <ul className="list-disc pl-5">
              {profile.professionalProfile.consultationDetails.consultationMethods.map(method => (
                <li key={method} className="font-bold text-gray-900 dark:text-white">{method}</li>
              ))}
            </ul>
          </div>

          <div className="mt-4">
            <p className="font-medium text-gray-600 dark:text-gray-400">Available Days:</p>
            <ul className="list-disc pl-5">
              {profile.professionalProfile.consultationDetails.availableDays.map(day => (
                <li key={day.day} className="font-bold text-gray-900 dark:text-white">
                  <div className="flex items-center justify-between">
                    <span>{day.day}</span>
                    <button
                      onClick={() => handleManageTimeSlots(day.day)}
                      className="ml-4 bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Manage Slots
                    </button>
                  </div>
                  {day.timeSlots && day.timeSlots.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {day.timeSlots.map((slot, index) => (
                        <div
                          key={index}
                          className={`p-2 rounded text-sm ${
                            slot.isBooked ? 'bg-red-100 dark:bg-red-900' : 'bg-green-100 dark:bg-green-900'
                          }`}
                        >
                          {slot.start} - {slot.end}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Practitioner Profile
        </h1>
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          {isEditing ? 'Cancel Editing' : 'Edit Profile'}
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-4 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
            Professional Details
          </h2>

          {isEditing ? (
            <ProfileEditForm 
              profile={profile}
              onSave={handleSaveProfile}
              onChange={setProfile}
            />
          ) : (
            <ProfileDisplayView profile={profile} />
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-6 border-b pb-4 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
            Consultation Details
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Availability:</p>
              <p className={`font-bold ${
                profile.professionalProfile.consultationDetails.isAvailable 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {profile.professionalProfile.consultationDetails.isAvailable 
                  ? 'Currently Available' 
                  : 'Not Available'}
              </p>
            </div>
            
            <div>
              <p className="font-medium text-gray-600 dark:text-gray-400">Consultation Fee:</p>
              <p className="font-bold text-gray-900 dark:text-white">
                {profile.professionalProfile.consultationDetails.consultationFee 
                  ? `$${profile.professionalProfile.consultationDetails.consultationFee}` 
                  : 'Not specified'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-6 border-b pb-4 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700">
          Your Blog Posts ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400">
              You haven't published any blog posts yet.
            </p>
            <Link 
              href="/dashboard/practitioner/create"
              className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Create First Post
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(post => (
              <div 
                key={post._id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-800"
              >
                <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">
                  {post.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(post.date).toLocaleDateString()}
                  </span>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/blog/edit/${post._id}`}
                      className="text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="text-red-500 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTimeSlotModal && (
        <TimeSlotModal
          day={selectedDay}
          onClose={() => setShowTimeSlotModal(false)}
          onSave={handleSaveTimeSlots}
          initialSlots={
            profile.professionalProfile.consultationDetails.availableDays
              .find(d => d.day === selectedDay)?.timeSlots || []
          }
        />
      )}
    </div>
  );
}

export const getServerSideProps = withPageAuth(null, ['practitioner']);