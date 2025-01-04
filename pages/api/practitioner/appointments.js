import { withAuth } from '../../../lib/withAuth';
import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';

async function handler(req, res) {
  await authConnect();

  try {
    const practitionerId = req.user.id;

    switch(req.method) {
      case 'GET':
        // Find all users with appointments for this practitioner
        const usersWithAppointments = await User.find({
          'appointments.practitionerId': practitionerId
        });

        // Create array to hold combined appointment data
        const allAppointments = [];

        // Process each user's appointments
        for (const user of usersWithAppointments) {
          // Find appointments for this practitioner
          const practitionerAppointments = user.appointments.filter(
            apt => apt.practitionerId.toString() === practitionerId
          );

          // Get user details for these appointments
          const userDetails = await User.findById(user._id)
            .select('name email')
            .lean();

          // Combine appointment data with user details
          const combinedAppointments = practitionerAppointments.map(apt => ({
            ...apt.toObject(),
            userName: userDetails.name,
            userEmail: userDetails.email
          }));

          allAppointments.push(...combinedAppointments);
        }

        // Sort appointments by date
        allAppointments.sort((a, b) => new Date(a.date) - new Date(b.date));

        return res.status(200).json({ appointments: allAppointments });

      case 'PUT':
        const { appointmentId, status } = req.body;
        
        // Find and update the specific appointment
        const updatedUser = await User.findOneAndUpdate(
          { 'appointments._id': appointmentId },
          { 
            $set: { 
              'appointments.$.status': status,
              'appointments.$.updatedAt': new Date()
            } 
          },
          { new: true }
        );

        if (!updatedUser) {
          return res.status(404).json({ message: 'Appointment not found' });
        }

        // Get the updated appointment
        const updatedAppointment = updatedUser.appointments.id(appointmentId);
        
        return res.status(200).json({ 
          message: 'Appointment status updated',
          appointment: updatedAppointment
        });

      default:
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Appointments Management Error:', error);
    return res.status(500).json({ 
      message: 'Internal server error', 
      error: error.message 
    });
  }
}

export default withAuth(handler, ['practitioner']);