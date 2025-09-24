// server/models/SiteContent.js
const mongoose = require('mongoose');

const SiteContentSchema = new mongoose.Schema({
  // 메인 배너 슬라이드
  bannerSlides: [{
    imageUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    buttonText: { type: String, default: '' },
    buttonUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true }
  }],

  // 학원 소개 섹션
  aboutSection: {
    title: { type: String, default: '학원 소개' },
    content: { type: String, default: '' },
    features: [{
      icon: { type: String, default: '📚' },
      title: { type: String, required: true },
      description: { type: String, default: '' }
    }]
  },

  // 강사진 정보
  teachers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // User 계정과 연동
    name: { type: String, required: true },
    email: { type: String, default: '' },
    photo: { type: String, default: '' },
    position: { type: String, default: '' },
    education: { type: String, default: '' },
    experience: { type: String, default: '' },
    subjects: [{ type: String }],
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true }
  }],

  // 갤러리
  gallery: [{
    imageUrl: { type: String, required: true },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    category: {
      type: String,
      enum: ['facility', 'class', 'event', 'general'],
      default: 'general'
    },
    order: { type: Number, default: 0 },
    visible: { type: Boolean, default: true }
  }],

  // 연락처 정보
  contactSection: {
    title: { type: String, default: '찾아오시는 길' },
    mapUrl: { type: String, default: '' },
    directions: { type: String, default: '' },
    parkingInfo: { type: String, default: '' },
    businessHours: { type: String, default: '' }
  }
}, {
  timestamps: true,
  collection: 'siteContent'
});

module.exports = mongoose.model('SiteContent', SiteContentSchema);