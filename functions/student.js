// student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  payment: {
    amountToBePaid: { type: Number, required: true },
    paidAmount: { type: Number, required: true },
  },
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;