import mongoose from 'mongoose';

const wellnessSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  mood: {
    type: String,
    enum: ['😊', '😴', '🤯', '😔', '⚡', '🧘'],
    default: '🧘'
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 10,
    default: 5
  },
  sleepHours: {
    type: Number,
    default: 7
  },
  focusTimeMinutes: {
    type: Number,
    default: 0
  },
  burnoutRiskScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 20
  },
  notes: {
    type: String,
    default: ''
  }
});

const Wellness = mongoose.model('Wellness', wellnessSchema);
export default Wellness;
