import Batch from "../models/batch.model.js";
import Teacher from "../models/teacher.model.js";
import BatchCategory from "../models/batchCategory.model.js";
import { userModel as User } from "../models/user.models.js";
import Subject from "../models/subject/subject.models.js";
import admissionFormModel from "../models/addmission_form.models.js";

// Register the AdmissionForm model
const AdmissionForm = admissionFormModel;

// Create a new batch
export const createBatch = async (req, res) => {
  try {
    const {
      name,
      category,
      teacher,
      startTime,
      endTime,
      startDate,
      status,
      students
    } = req.body;

    // Validate required fields
    if (!name || !teacher || !startTime || !endTime || !startDate || !students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate status if provided
    if (status && !['completed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'completed' or 'pending'"
      });
    }

    // Validate category exists if provided
    if (category) {
      const categoryExists = await BatchCategory.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }
    }

    // Validate teacher exists
    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM format"
      });
    }

    // Validate student data
    for (const student of students) {
      if (!student.student || !student.currentSoftware) {
        return res.status(400).json({
          success: false,
          message: "Invalid student data. Student ID and current software are required"
        });
      }

      // Validate student exists
      const studentExists = await AdmissionForm.findById(student.student);
      if (!studentExists) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${student.student} not found`
        });
      }
    }

    // Check for timing conflicts
    const existingBatch = await Batch.findOne({
      teacher,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ],
      isActive: true
    });

    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: "Teacher has a scheduling conflict with another batch"
      });
    }

    const batch = new Batch({
      name,
      category,
      teacher,
      startTime,
      endTime,
      startDate,
      status,
      students
    });

    await batch.save();

    res.status(201).json({
      success: true,
      message: "Batch created successfully",
      data: batch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Get all batches with filters
export const getAllBatches = async (req, res) => {
  try {
    const { 
      teacher, 
      isActive, 
      startDate, 
      endDate
    } = req.query;

    const query = {};

    if (teacher) query.teacher = teacher;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (startDate) query.startDate = { $gte: new Date(startDate) };
    if (endDate) query.endDate = { $lte: new Date(endDate) };

    const batches = await Batch.find(query)
      .populate('teacher', 'name email phone')
      .populate('category', 'categoryName')
      .populate({
        path: 'students.student',
        model: 'Students',
        select: 'name courseName',
        populate: {
          path: 'courseName',
          model: 'Course',
          select: 'courseName'
        }
      })
      .lean()
      .sort({ startDate: -1 });

    // Get subjects for each student's course
    for (const batch of batches) {
      for (const batchStudent of batch.students) {
        const subjects = await Subject.find({
          course: batchStudent.student.courseName._id
        }).select('subjectName').lean();
        
        batchStudent.student.subjects = subjects;
      }
    }

    res.status(200).json({
      success: true,
      data: batches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get batch by ID
export const getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id)
      .populate('teacher', 'name email phone')
      .populate('category', 'categoryName');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    res.status(200).json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Add student to batch
export const addStudentToBatch = async (req, res) => {
  try {
    const { batchId } = req.params;
    const { studentId, subjects } = req.body;

    if (!studentId || !subjects || !Array.isArray(subjects)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data"
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    if (batch.isFull()) {
      return res.status(400).json({
        success: false,
        message: "Batch is full"
      });
    }

    // Validate student exists
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Check if student is already in batch
    if (batch.hasStudent(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student is already in this batch"
      });
    }

    // Validate subjects exist
    for (const subject of subjects) {
      const subjectExists = await Subject.findById(subject.subject);
      if (!subjectExists) {
        return res.status(404).json({
          success: false,
          message: `Subject with ID ${subject.subject} not found`
        });
      }
    }

    batch.students.push({
      student: studentId,
      subjects: subjects.map(subject => ({
        ...subject,
        startDate: new Date()
      }))
    });

    batch.currentStrength += 1;
    await batch.save();

    const updatedBatch = await Batch.findById(batchId)
      .populate('teacher', 'name email phone')
      .populate('students.student', 'name email')
      .populate('students.subjects.subject', 'name');

    res.status(200).json({
      success: true,
      message: "Student added to batch successfully",
      data: updatedBatch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update student's subject status in batch
export const updateStudentSubjectStatus = async (req, res) => {
  try {
    const { batchId, studentId, subjectId } = req.params;
    const { status, progress, notes } = req.body;

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value"
      });
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    const studentInBatch = batch.students.find(
      s => s.student.toString() === studentId
    );
    if (!studentInBatch) {
      return res.status(404).json({
        success: false,
        message: "Student not found in batch"
      });
    }

    const subject = studentInBatch.subjects.find(
      s => s.subject.toString() === subjectId
    );
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: "Subject not found for student"
      });
    }

    subject.status = status;
    if (progress !== undefined) {
      if (progress < 0 || progress > 100) {
        return res.status(400).json({
          success: false,
          message: "Progress must be between 0 and 100"
        });
      }
      subject.progress = progress;
    }
    if (notes) subject.notes = notes;
    if (status === 'completed') {
      subject.completionDate = new Date();
      subject.progress = 100;
    }

    await batch.save();

    const updatedBatch = await Batch.findById(batchId)
      .populate('teacher', 'name email phone')
      .populate('students.student', 'name email')
      .populate('students.subjects.subject', 'name');

    res.status(200).json({
      success: true,
      message: "Subject status updated successfully",
      data: updatedBatch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Remove student from batch
export const removeStudentFromBatch = async (req, res) => {
  try {
    const { batchId, studentId } = req.params;

    const batch = await Batch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    const studentIndex = batch.students.findIndex(
      s => s.student.toString() === studentId
    );
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Student not found in batch"
      });
    }

    batch.students.splice(studentIndex, 1);
    batch.currentStrength -= 1;
    await batch.save();

    const updatedBatch = await Batch.findById(batchId)
      .populate('teacher', 'name email phone')
      .populate('students.student', 'name email')
      .populate('students.subjects.subject', 'name');

    res.status(200).json({
      success: true,
      message: "Student removed from batch successfully",
      data: updatedBatch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Update batch
export const updateBatch = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      teacher,
      startTime,
      endTime,
      startDate,
      status,
      students
    } = req.body;

    // Validate required fields
    if (!name || !teacher || !startTime || !endTime || !startDate || !students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    // Validate category exists if provided
    if (category) {
      const categoryExists = await BatchCategory.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: "Category not found"
        });
      }
    }

    // Validate teacher exists
    const teacherExists = await Teacher.findById(teacher);
    if (!teacherExists) {
      return res.status(404).json({
        success: false,
        message: "Teacher not found"
      });
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM format"
      });
    }

    // Validate student data
    for (const student of students) {
      if (!student.student || !student.currentSoftware) {
        return res.status(400).json({
          success: false,
          message: "Invalid student data. Student ID and current software are required"
        });
      }

      // Validate student exists
      const studentExists = await AdmissionForm.findById(student.student);
      if (!studentExists) {
        return res.status(404).json({
          success: false,
          message: `Student with ID ${student.student} not found`
        });
      }
    }

    // Validate status if provided
    if (status && !['completed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'completed' or 'pending'"
      });
    }

    // Check for timing conflicts (excluding current batch)
    const existingBatch = await Batch.findOne({
      _id: { $ne: id },
      teacher,
      $or: [
        {
          startTime: { $lt: endTime },
          endTime: { $gt: startTime }
        }
      ],
      isActive: true
    });

    if (existingBatch) {
      return res.status(400).json({
        success: false,
        message: "Teacher has a scheduling conflict with another batch"
      });
    }

    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      {
        name,
        category,
        teacher,
        startTime,
        endTime,
        startDate,
        status,
        students
      },
      { new: true }
    )
    .populate('teacher', 'name email phone')
    .populate('category', 'categoryName')
    .populate({
      path: 'students.student',
      model: 'Students',
      select: 'name courseName'
    });

    if (!updatedBatch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Batch updated successfully",
      data: updatedBatch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Delete batch
export const deleteBatch = async (req, res) => {
  try {
    const batch = await Batch.findById(req.params.id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    await batch.deleteOne();

    res.status(200).json({
      success: true,
      message: "Batch deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get student's progress in batch
export const getStudentProgress = async (req, res) => {
  try {
    const { batchId, studentId } = req.params;

    const batch = await Batch.findById(batchId)
      .populate('students.student', 'name email')
      .populate('students.subjects.subject', 'name');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    const student = batch.students.find(
      s => s.student._id.toString() === studentId
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found in batch"
      });
    }

    const progress = {
      student: student.student,
      subjects: student.subjects.map(subject => ({
        subject: subject.subject,
        status: subject.status,
        progress: subject.progress,
        startDate: subject.startDate,
        completionDate: subject.completionDate,
        notes: subject.notes
      }))
    };

    res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update batch status (Super Admin only)
export const updateBatchStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!status || !['completed', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'completed' or 'pending'"
      });
    }

    // Check if batch exists
    const batch = await Batch.findById(id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Batch not found"
      });
    }

    // Prepare update data
    const updateData = { status };
    
    // If status is being set to completed, set the endDate to current date
    if (status === 'completed' && batch.status !== 'completed') {
      updateData.endDate = new Date();
    }
    
    // If status is being changed back to pending, remove the endDate
    if (status === 'pending' && batch.status === 'completed') {
      updateData.endDate = null;
    }

    // Update batch status and endDate
    const updatedBatch = await Batch.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('teacher', 'name email phone')
    .populate('category', 'categoryName')
    .populate({
      path: 'students.student',
      model: 'Students',
      select: 'name courseName'
    });

    res.status(200).json({
      success: true,
      message: `Batch status updated to ${status}`,
      data: updatedBatch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating batch status",
      error: error.message
    });
  }
};

// Get pending batches (for Super Admin)
export const getPendingBatches = async (req, res) => {
  try {
    const pendingBatches = await Batch.find({ $or: [{ status: 'pending' },
      { status: { $exists: false } }
    ] })
      .populate('teacher', 'name email phone')
      .populate('category', 'categoryName')
      .populate({
        path: 'students.student',
        model: 'Students',
        select: 'name courseName',
        populate: {
          path: 'courseName',
          model: 'Course',
          select: 'courseName'
        }
      })
      .lean()
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: pendingBatches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching pending batches",
      error: error.message
    });
  }
}; 