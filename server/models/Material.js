const mongoose = require('mongoose');
const MaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  file: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});
module.exports = mongoose.model('Material', MaterialSchema);