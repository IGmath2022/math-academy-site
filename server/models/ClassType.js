// server/models/ClassType.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassTypeSchema = new Schema({
  name: { type: String, unique: true, required: true }, // 예: 개별맞춤수업, 판서강의, 방학특강
  active: { type: Boolean, default: true }
}, { collection: 'class_types', timestamps: true });

module.exports = mongoose.model('ClassType', ClassTypeSchema);
