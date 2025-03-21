import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: function() {
      return this.role === 'department_officer';
    },
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'department_officer', 'admin'],
    default: 'user'
  },
  department: {
    type: String,
    enum: [
      'Environment', 'Justice', 'Health', 'Education', 'Housing',
      'Transportation', 'Labor', 'Energy', 'Agriculture', 'Finance',
      'Public Safety', 'Social Welfare', 'Water Resources', 'Communications', 
      'Consumer Affairs'
    ],
    required: function () {
      return this.role === 'department_officer';
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
