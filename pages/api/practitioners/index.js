import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';
import { withAuth } from '../../../lib/withAuth';

async function handler(req, res) {
  try {
    await authConnect();

    // Fetch practitioners with specific fields
    const practitioners = await User.find({ 
      role: 'practitioner' 
    }).select(`
      name 
      professionalProfile.specialization 
      professionalProfile.professionalTitle 
      professionalProfile.bio 
      professionalProfile.consultationDetails
      professionalProfile.areasOfExpertise
    `).lean();

    // Transform data to remove nested structure
    const formattedPractitioners = practitioners.map(practitioner => ({
      id: practitioner._id.toString(),
      name: practitioner.name,
      specialization: practitioner.professionalProfile?.specialization || 'General Wellness',
      professionalTitle: practitioner.professionalProfile?.professionalTitle || 'Wellness Practitioner',
      bio: practitioner.professionalProfile?.bio || '',
      isAvailable: practitioner.professionalProfile?.consultationDetails?.isAvailable || false,
      consultationFee: practitioner.professionalProfile?.consultationDetails?.consultationFee || 0,
      consultationMethods: practitioner.professionalProfile?.consultationDetails?.consultationMethods || [],
      areasOfExpertise: practitioner.professionalProfile?.areasOfExpertise || []
    }));

    res.status(200).json(formattedPractitioners);
  } catch (error) {
    console.error('Practitioners Fetch Error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch practitioners',
      error: error.message 
    });
  }
}

export default withAuth(handler, ['user']);