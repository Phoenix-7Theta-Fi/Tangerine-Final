import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';
import { withAuth } from '../../../lib/withAuth';

async function handler(req, res) {
  try {
    await authConnect();

    const { id } = req.query;

    // Fetch practitioner with detailed profile
    const practitioner = await User.findById(id)
      .select(`
        name 
        professionalProfile 
        email
      `)
      .lean();

    if (!practitioner) {
      return res.status(404).json({ 
        message: 'Practitioner not found' 
      });
    }

    // Transform data to remove nested structure
    const formattedProfile = {
      id: practitioner._id.toString(),
      name: practitioner.name,
      email: practitioner.email,
      professionalProfile: {
        specialization: practitioner.professionalProfile?.specialization || 'General Wellness',
        professionalTitle: practitioner.professionalProfile?.professionalTitle || 'Wellness Practitioner',
        bio: practitioner.professionalProfile?.bio || '',
        yearsOfExperience: practitioner.professionalProfile?.yearsOfExperience || 0,
        areasOfExpertise: practitioner.professionalProfile?.areasOfExpertise || [],
        consultationDetails: {
          isAvailable: practitioner.professionalProfile?.consultationDetails?.isAvailable || false,
          consultationMethods: practitioner.professionalProfile?.consultationDetails?.consultationMethods || [],
          consultationFee: practitioner.professionalProfile?.consultationDetails?.consultationFee || 0,
          availableDays: practitioner.professionalProfile?.consultationDetails?.availableDays || []
        },
        qualifications: practitioner.professionalProfile?.qualifications || [],
        certifications: practitioner.professionalProfile?.certifications || []
      }
    };

    res.status(200).json(formattedProfile);
  } catch (error) {
    console.error('Practitioner Profile Fetch Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch practitioner profile',
      error: error.message 
    });
  }
}

export default withAuth(handler, ['user']);