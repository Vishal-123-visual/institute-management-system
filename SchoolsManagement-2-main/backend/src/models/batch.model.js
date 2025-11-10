import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Students',
    required: true
  },
  currentSoftware: {
    type: String,
    required: true,
    trim: true
  }
});

const batchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BatchCategory',
    required: false
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: false
  },
  status: {
    type: String,
    enum: ['completed', 'pending'],
    default: 'pending'
  },
  students: [studentSchema],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Add index for efficient querying
batchSchema.index({ teacher: 1, startTime: 1, endTime: 1 });

// Add method to check if student exists in batch
batchSchema.methods.hasStudent = function(studentId) {
  return this.students.some(s => s.student.toString() === studentId);
};

// Add method to get student details
batchSchema.methods.getStudentDetails = function(studentId) {
  return this.students.find(s => s.student.toString() === studentId);
};

const Batch = mongoose.model('Batch', batchSchema);

export default Batch; 