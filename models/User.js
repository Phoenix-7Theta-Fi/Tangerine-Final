import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['user', 'practitioner'],
    default: 'user',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  professionalProfile: {
    specialization: {
      type: String,
      trim: true
    },
    professionalTitle: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      maxlength: 500
    },
    yearsOfExperience: {
      type: Number,
      min: 0,
      max: 50
    },
    areasOfExpertise: [{
      type: String,
      trim: true
    }],
    consultationDetails: {
      isAvailable: {
        type: Boolean,
        default: false
      },
      availableDays: [{
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        },
        timeSlots: [{
          start: {
            type: String,
            validate: {
              validator: function(v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
              },
              message: 'Invalid time format. Use HH:MM 24-hour format'
            }
          },
          end: {
            type: String,
            validate: {
              validator: function(v) {
                return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
              },
              message: 'Invalid time format. Use HH:MM 24-hour format'
            }
          },
          isBooked: {
            type: Boolean,
            default: false
          }
        }]
      }],
      consultationMethods: [{
        type: String,
        enum: ['Online', 'In-Person', 'Phone']
      }],
      consultationFee: {
        type: Number,
        min: 0
      }
    },
    qualifications: [{
      degree: String,
      institution: String,
      year: Number
    }],
    certifications: [{
      name: String,
      issuedBy: String,
      year: Number
    }],
    contactInformation: {
      phone: String,
      alternateEmail: String,
      professionalWebsite: String
    }
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);