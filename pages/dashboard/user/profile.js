import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { withPageAuth } from '../../../lib/withAuth';
import { toast } from 'react-toastify';

export default function UserProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    userProfile: {
      age: '',
      gender: '',
      aboutMyself: '',
      healthGoals: [],
      interests: []
    },
    basicInfo: {
      name: '',
      email: ''
    }
  });

  const [isLoading, setIsLoading] = useState(true);
  const [newHealthGoal, setNewHealthGoal] = useState('');
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchProfileData() {
      if (status !== 'authenticated') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch('/api/user/profile', {
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

        setProfile({
          userProfile: {
            age: data.data?.profile?.age || '',
            gender: data.data?.profile?.gender || '',
            aboutMyself: data.data?.profile?.aboutMyself || '',
            healthGoals: data.data?.profile?.healthGoals || [],
            interests: data.data?.profile?.interests || []
          },
          basicInfo: {
            name: data.data?.basicInfo?.name || session?.user?.name || '',
            email: data.data?.basicInfo?.email || session?.user?.email || ''
          }
        });
      } catch (error) {
        console.error('Failed to fetch profile', error);
        toast.error(error.message || 'Failed to fetch profile');
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfileData();
  }, [status, session]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userProfile: profile.userProfile
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(prev => ({
        ...prev,
        userProfile: data.data
      }));

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update failed', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddHealthGoal = () => {
    if (newHealthGoal.trim()) {
      if (profile.userProfile.healthGoals.length >= 5) {
        toast.warn('Maximum 5 health goals allowed');
        return;
      }

      if (profile.userProfile.healthGoals.includes(newHealthGoal.trim())) {
        toast.warn('This health goal already exists');
        return;
      }

      setProfile(prev => ({
        ...prev,
        userProfile: {
          ...prev.userProfile,
          healthGoals: [...prev.userProfile.healthGoals, newHealthGoal.trim()]
        }
      }));
      setNewHealthGoal('');
      toast.success('Health goal added');
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim()) {
      if (profile.userProfile.interests.length >= 5) {
        toast.warn('Maximum 5 interests allowed');
        return;
      }

      if (profile.userProfile.interests.includes(newInterest.trim())) {
        toast.warn('This interest already exists');
        return;
      }

      setProfile(prev => ({
        ...prev,
        userProfile: {
          ...prev.userProfile,
          interests: [...prev.userProfile.interests, newInterest.trim()]
        }
      }));
      setNewInterest('');
      toast.success('Interest added');
    }
  };

  const handleRemoveHealthGoal = (goalToRemove) => {
    setProfile(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        healthGoals: prev.userProfile.healthGoals.filter(goal => goal !== goalToRemove)
      }
    }));
    toast.info('Health goal removed');
  };

  const handleRemoveInterest = (interestToRemove) => {
    setProfile(prev => ({
      ...prev,
      userProfile: {
        ...prev.userProfile,
        interests: prev.userProfile.interests.filter(interest => interest !== interestToRemove)
      }
    }));
    toast.info('Interest removed');
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!isEditing) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
          {/* Profile Header */}
          <div className="flex items-center mb-6">
            <div className="mr-6">
              <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
                {profile.basicInfo.name.charAt(0).toUpperCase()}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile.basicInfo.name}</h1>
              <p className="text-gray-600">{profile.basicInfo.email}</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="ml-auto bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Edit Profile
            </button>
          </div>

          {/* Profile Details */}
          <div className="space-y-4">
            {profile.userProfile.aboutMyself && (
              <div>
                <h2 className="font-semibold text-lg">About Me</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {profile.userProfile.aboutMyself}
                </p>
              </div>
            )}

            {profile.userProfile.age && profile.userProfile.gender && (
              <div>
                <h2 className="font-semibold text-lg">Personal Info</h2>
                <p className="text-gray-700 dark:text-gray-300">
                  {profile.userProfile.age} years old, {profile.userProfile.gender}
                </p>
              </div>
            )}

            {profile.userProfile.healthGoals.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg">Health Goals</h2>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                  {profile.userProfile.healthGoals.map((goal, index) => (
                    <li key={index}>{goal}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.userProfile.interests.length > 0 && (
              <div>
                <h2 className="font-semibold text-lg">Interests</h2>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
                  {profile.userProfile.interests.map((interest, index) => (
                    <li key={index}>{interest}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Edit Profile</h1>

      <form
        onSubmit={handleSaveProfile}
        className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input
              type="text"
              value={profile.basicInfo.name}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                bg-gray-100 dark:bg-gray-700
                text-gray-900 dark:text-white
                cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={profile.basicInfo.email}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                bg-gray-100 dark:bg-gray-700
                text-gray-900 dark:text-white
                cursor-not-allowed"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
            <input
              type="number"
              value={profile.userProfile.age}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                userProfile: { ...prev.userProfile, age: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500"
              min="0"
              max="120"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
            <select
              value={profile.userProfile.gender}
              onChange={(e) => setProfile(prev => ({
                ...prev,
                userProfile: { ...prev.userProfile, gender: e.target.value }
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500"
            >
              <option value="" className="text-gray-500 dark:text-gray-400">Select Gender</option>
              <option value="Male" className="text-gray-900 dark:text-white">Male</option>
              <option value="Female" className="text-gray-900 dark:text-white">Female</option>
              <option value="Other" className="text-gray-900 dark:text-white">Other</option>
              <option value="Prefer not to say" className="text-gray-900 dark:text-white">Prefer not to say</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">About Myself</label>
          <textarea
            value={profile.userProfile.aboutMyself}
            onChange={(e) => setProfile(prev => ({
              ...prev,
              userProfile: { ...prev.userProfile, aboutMyself: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              focus:ring-2 focus:ring-blue-500"
            rows="4"
            maxLength="500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Health Goals</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newHealthGoal}
              onChange={(e) => setNewHealthGoal(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500
                dark:placeholder-gray-400"
              placeholder="Add a health goal"
            />
            <button
              type="button"
              onClick={handleAddHealthGoal}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {profile.userProfile.healthGoals.map((goal, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-gray-900 dark:text-white"
              >
                <span>{goal}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveHealthGoal(goal)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interests</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:ring-2 focus:ring-blue-500
                dark:placeholder-gray-400"
              placeholder="Add an interest"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
          <ul className="space-y-2">
            {profile.userProfile.interests.map((interest, index) => (
              <li
                key={index}
                className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md text-gray-900 dark:text-white"
              >
                <span>{interest}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(interest)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2
              bg-green-500 text-white
              rounded-md
              hover:bg-green-600
              focus:outline-none focus:ring-2 focus:ring-green-500
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}

export const getServerSideProps = withPageAuth(null, ['user']);