import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  messages: [messageSchema],
  notes: {
    type: String,
    default: '# Shared Team Notes\n\nUse this collaborative pad to jot down project goals and brainstorm ideas with the team!'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Team = mongoose.model('Team', teamSchema);
export default Team;
