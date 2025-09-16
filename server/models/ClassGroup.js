// server/models/ClassGroup.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const ClassGroupSchema = new Schema({
  name: { type: String, required: true, index: true },              // 반 이름
  academy: { type: String, default: 'IG수학' },                      // 학원/캠퍼스 명
  days: { type: [String], default: [] },                             // 예: ['Mon','Wed','Fri']
  timeStart: { type: String, default: '' },                          // 'HH:mm'
  timeEnd: { type: String, default: '' },                            // 'HH:mm'
  teachers: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  students: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
  active: { type: Boolean, default: true }
}, { timestamps: true, collection: 'class_groups' });

module.exports = mongoose.model('ClassGroup', ClassGroupSchema);
