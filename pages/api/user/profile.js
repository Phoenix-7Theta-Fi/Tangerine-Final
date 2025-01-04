import { withAuth } from '../../../lib/withAuth';
import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';
import { getToken } from 'next-auth/jwt';
import rateLimit from '../../../lib/rate-limit';

const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

async function handler(req, res) {
  try {
    await authConnect();
    await limiter(req, res, () => {});

    const token = await getToken({ req });
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: No authentication token found' 
      });
    }

    const userId = token.sub;

    switch(req.method) {
      case 'GET':
        const user = await User.findById(userId)
          .select('userProfile email name')
          .lean();
        
        if (!user) {
          return res.status(404).json({ 
            success: false,
            message: 'User not found' 
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            profile: user.userProfile || {
              age: null,
              gender: null,
              aboutMyself: '',
              healthGoals: [],
              interests: []
            },
            basicInfo: {
              name: user.name,
              email: user.email
            }
          }
        });

      case 'PUT':
        const { userProfile } = req.body;
        
        if (!userProfile) {
          return res.status(400).json({ 
            success: false,
            message: 'Bad Request: User profile data is required' 
          });
        }

        // Validate profile data
        if (userProfile.age && (userProfile.age < 0 || userProfile.age > 120)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid age value'
          });
        }

        const updatedProfile = await User.findByIdAndUpdate(
          userId,
          { 
            $set: { 
              'userProfile': {
                age: userProfile.age,
                gender: userProfile.gender,
                aboutMyself: userProfile.aboutMyself,
                healthGoals: userProfile.healthGoals || [],
                interests: userProfile.interests || []
              }
            }
          },
          { 
            new: true, 
            runValidators: true 
          }
        ).select('userProfile');

        if (!updatedProfile) {
          return res.status(404).json({ 
            success: false,
            message: 'User not found' 
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          data: updatedProfile.userProfile
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ 
          success: false,
          message: `Method ${req.method} Not Allowed` 
        });
    }
  } catch (error) {
    if (error.statusCode === 429) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests',
        retryAfter: error.msBeforeNext / 1000,
      });
    }

    console.error('User Profile API Error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default withAuth(handler, ['user']);