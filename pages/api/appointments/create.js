import { withAuth } from '../../../lib/withAuth';
import authConnect from '../../../lib/auth-mongodb';
import User from '../../../models/User';

async function handler(req, res) {
  console.log('Received Booking Request:', req.body);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await authConnect();

    const { practitionerId, date, timeSlot, consultationType, notes } = req.body;

    // Validate required fields
    if (!practitionerId || !date || !timeSlot || !consultationType) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        details: { practitionerId, date, timeSlot, consultationType }
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const practitioner = await User.findById(practitionerId);
    if (!practitioner) {
      return res.status(404).json({ message: 'Practitioner not found' });
    }

    // Validate time slot availability
    const dayOfWeek = new Date(date).toLocaleString('en-US', { weekday: 'long' });
    const availableDay = practitioner.professionalProfile.consultationDetails.availableDays
      .find(day => day.day === dayOfWeek);

    if (!availableDay) {
      return res.status(400).json({ message: 'Practitioner not available on selected day' });
    }

    const targetSlot = availableDay.timeSlots.find(
      slot => slot.start === timeSlot.start && slot.end === timeSlot.end
    );

    if (!targetSlot || targetSlot.isBooked) {
      return res.status(400).json({ message: 'Time slot not available' });
    }

    // Create appointment object
    const appointment = {
      practitionerId,
      userId: user._id,
      date,
      timeSlot,
      consultationType,
      notes,
      status: 'pending',
      createdAt: new Date()
    };

    // Update the time slot status
    targetSlot.isBooked = true;

    // Save changes
    if (!user.appointments) {
      user.appointments = [];
    }
    
    user.appointments.push(appointment);
    await user.save();
    await practitioner.save();

    res.status(201).json({ 
      success: true,
      message: 'Appointment booked successfully', 
      appointment 
    });
  } catch (error) {
    console.error('Appointment creation error:', error);
    res.status(500).json({ 
      message: 'Appointment booking failed', 
      error: error.message 
    });
  }
}

export default withAuth(handler, ['user']);