const mongoose = require('mongoose');
const SettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: String
});
module.exports = mongoose.model('Setting', SettingSchema);