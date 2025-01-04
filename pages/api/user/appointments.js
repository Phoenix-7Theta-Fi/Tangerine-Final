import { withAuth } from '../../../lib/withAuth';
import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';

async function handler(req, res) {
  await authConnect();

  try {
    // Find the logged-in user and populate appointments
    const user = await User.findById(req.user.id)
      .populate({
        path: 'appointments.practitionerId',
        select: 'name professionalProfile.professionalTitle'
      });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Sort appointments with most recent first
    const sortedAppointments = user.appointments.sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );

    res.status(200).json({
      success: true,
      appointments: sortedAppointments
    });
  } catch (error) {
    console.error('Appointments Fetch Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch appointments',
      error: error.message 
    });
  }
}

export default withAuth(handler, ['user']);