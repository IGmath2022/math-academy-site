// server/models/SiteSettings.js
const mongoose = require('mongoose');

const SiteSettingsSchema = new mongoose.Schema({
  // 브랜딩 설정
  branding: {
    academyName: { type: String, default: '수학의 정석 학원' },
    principalName: { type: String, default: '' },
    address: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    foundedYear: { type: Number, default: 2020 },
    description: { type: String, default: '' },

    // 로고 이미지들
    headerLogo: { type: String, default: '' },
    favicon: { type: String, default: '' },
    loadingLogo: { type: String, default: '' },

    // 컬러 테마
    primaryColor: { type: String, default: '#2d4373' },
    secondaryColor: { type: String, default: '#f8faff' },
    accentColor: { type: String, default: '#226ad6' },

    // 폰트 설정
    titleFont: { type: String, default: 'Noto Sans KR' },
    bodyFont: { type: String, default: 'Noto Sans KR' }
  },

  // 레이아웃 설정
  layout: {
    // 메인 페이지 섹션 순서
    mainSections: [{
      type: String,
      enum: ['banner', 'about', 'teachers', 'notice', 'gallery', 'contact'],
      default: ['banner', 'about', 'teachers', 'notice', 'gallery', 'contact']
    }],

    // 네비게이션 메뉴
    navigation: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      order: { type: Number, default: 0 },
      visible: { type: Boolean, default: true }
    }],

    // 사이드바 위젯 설정
    sidebar: {
      showRecentNotice: { type: Boolean, default: true },
      showContact: { type: Boolean, default: true },
      showEnrollButton: { type: Boolean, default: false },
      showConsultButton: { type: Boolean, default: false }
    },

    // 푸터 설정
    footer: {
      content: { type: String, default: '' },
      showSocialLinks: { type: Boolean, default: false },
      socialLinks: [{
        platform: { type: String, enum: ['facebook', 'instagram', 'youtube', 'blog'] },
        url: { type: String },
        visible: { type: Boolean, default: true }
      }]
    }
  },

  // 기존 팝업 배너 (호환성 유지)
  popupBanners: [{
    imageUrl: { type: String, default: '' },
    title: { type: String, default: '' },
    body: { type: String, default: '' },
    linkUrl: { type: String, default: '' },
    linkText: { type: String, default: '' },
    visible: { type: Boolean, default: true }
  }]
}, {
  timestamps: true,
  collection: 'siteSettings'
});

// 기본 네비게이션 메뉴 설정
SiteSettingsSchema.pre('save', function(next) {
  if (this.isNew && this.layout.navigation.length === 0) {
    this.layout.navigation = [
      { title: '학원소개', url: '/about', order: 1, visible: true },
      { title: '강의안내', url: '/courses', order: 2, visible: true },
      { title: '공지사항', url: '/notice', order: 3, visible: true },
      { title: '상담신청', url: '/contact', order: 4, visible: true }
    ];
  }
  next();
});

module.exports = mongoose.model('SiteSettings', SiteSettingsSchema);