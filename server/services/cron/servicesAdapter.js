// server/services/cron/servicesAdapter.js
// ─────────────────────────────────────────────────────────────
// 목적: runAutoLeave / runDailyReport 가 호출하는 도메인 로직의 어댑터.
// 현재는 안전 스텁(미리보기는 빈목록, 수행은 0건)으로 제공.
// 3차에서 네 레포의 실제 서비스 함수(쿼리/처리/발송)에 바인딩 예정.
// ─────────────────────────────────────────────────────────────

// TODO(3차에서 교체):
// const LessonService = require('../../services/lessonService');
// const ReportService = require('../../services/reportService');

// 프리뷰는 "무엇이 처리될지" 미리보기 목록/카운트만 반환
async function previewAutoLeave({ limit = 500 }) {
    // 예: return await LessonService.previewAutoLeave({ limit })
    return { list: [], count: 0 };
  }
  
  // 실제 처리. 멱등 설계 권장(같은 대상 중복 처리 방지)
  async function performAutoLeave({ limit = 500 }) {
    // 예: return await LessonService.performAutoLeave({ limit })
    return { processed: 0, preview: [] };
  }
  
  async function previewDailyReport({ limit = 500 }) {
    // 예: return await ReportService.previewDailyReport({ limit })
    return { list: [], count: 0 };
  }
  
  async function performDailyReport({ limit = 500 }) {
    // 예: return await ReportService.performDailyReport({ limit })
    return { processed: 0, preview: [] };
  }
  
  module.exports = {
    previewAutoLeave,
    performAutoLeave,
    previewDailyReport,
    performDailyReport,
  };
  