const mongoose = require('mongoose');
const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: String, required: true },
  files: [{
    name: String,
    originalName: String
  }],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('News', NewsSchema);