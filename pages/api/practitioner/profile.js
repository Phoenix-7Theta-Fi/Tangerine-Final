import { withAuth } from '../../../lib/withAuth';
import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';
import { connectDB } from '../../../lib/mongodb';
import { getToken } from 'next-auth/jwt';

async function handler(req, res) {
  await authConnect();

  try {
    const token = await getToken({ req });
    
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = token.sub;

    switch(req.method) {
      case 'GET':
        if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await User.findById(userId)
          .select('professionalProfile email name');
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        const connection = await connectDB();
        const db = await connection.getDatabase();
        const blogCollection = db.collection('blogposts');
        
        const posts = await blogCollection
          .find({ author: user.name })
          .toArray();

        return res.status(200).json({
          profile: user.professionalProfile || {
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
          },
          basicInfo: {
            name: user.name,
            email: user.email
          },
          posts: posts || []
        });

      case 'PUT':
        // Handle time slot updates
        if (req.body.timeSlots && req.body.day) {
          const { timeSlots, day } = req.body;
          
          if (!day || !timeSlots) {
            return res.status(400).json({ message: 'Day and time slots are required' });
          }

          const updatedProfile = await User.findByIdAndUpdate(
            userId,
            { 
              $set: { 
                'professionalProfile.consultationDetails.availableDays.$[elem].timeSlots': timeSlots 
              }
            },
            { 
              arrayFilters: [{ 'elem.day': day }],
              new: true,
              runValidators: true
            }
          );

          if (!updatedProfile) {
            return res.status(404).json({ message: 'User not found' });
          }

          return res.status(200).json({
            message: 'Time slots updated successfully',
            timeSlots: updatedProfile.professionalProfile.consultationDetails
              .availableDays.find(d => d.day === day).timeSlots
          });
        }
        // Handle general profile updates
        else {
          const { professionalProfile } = req.body;
          
          if (!professionalProfile) {
            return res.status(400).json({ message: 'Professional profile data is required' });
          }

          const updatedProfile = await User.findByIdAndUpdate(
            userId,
            { 
              $set: { 
                'professionalProfile': {
                  ...professionalProfile,
                  specialization: professionalProfile.specialization || '',
                  bio: professionalProfile.bio || '',
                  yearsOfExperience: professionalProfile.yearsOfExperience || 0,
                  consultationDetails: {
                    isAvailable: professionalProfile.consultationDetails?.isAvailable || false,
                    availableDays: professionalProfile.consultationDetails?.availableDays || [],
                    consultationMethods: professionalProfile.consultationDetails?.consultationMethods || [],
                    consultationFee: Number(professionalProfile.consultationDetails?.consultationFee) || 0
                  }
                }
              }
            },
            { 
              new: true, 
              runValidators: true 
            }
          );

          if (!updatedProfile) {
            return res.status(404).json({ message: 'User not found' });
          }

          return res.status(200).json({
            message: 'Profile updated successfully',
            profile: updatedProfile.professionalProfile
          });
        }

      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Profile API Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

export default withAuth(handler, ['practitioner']);