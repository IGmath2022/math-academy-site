// server/services/cron/servicesAdapter.js
console.log('★★★ servicesAdapter.js 모듈이 로드되었습니다 ★★★');
// ─────────────────────────────────────────────────────────────
// 목적: runAutoLeave / runDailyReport 가 호출하는 도메인 로직의 어댑터.
// 실제 리포트 발송 및 자동 퇴실 처리 로직을 구현.
// ─────────────────────────────────────────────────────────────

const LessonLog = require('../../models/LessonLog');
const Attendance = require('../../models/Attendance');
const User = require('../../models/User');
const Setting = require('../../models/Setting');
const NotificationLog = require('../../models/NotificationLog');
const { sendReportAlimtalk } = require('../../utils/alimtalkReport');
const moment = require('moment-timezone');

const KST = 'Asia/Seoul';
const REPORT_BASE = process.env.REPORT_BASE_URL || 'https://ig-math-2022.onrender.com';

async function getSetting(key, defVal = '') {
  const s = await Setting.findOne({ key });
  return s?.value ?? defVal;
}

function getDailyTplCodeFallback() {
  if (process.env.DAILY_REPORT_TPL_CODE) return process.env.DAILY_REPORT_TPL_CODE;
  return null;
}

async function isDailyAutoOn() {
  // 크론 시스템의 autoReportEnabled 설정 사용
  const { getSettings } = require('./settingsService');
  const settings = await getSettings(Setting);
  console.log('[isDailyAutoOn] autoReportEnabled 설정:', settings.autoReportEnabled);
  return settings.autoReportEnabled;
}

async function computeStudyTimeMinFromAttendance(studentId, date) {
  const rows = await Attendance.find({ userId: studentId, date }).lean();
  const ins  = rows.filter(r => r.type === 'IN').map(r => r.time).sort();
  const outs = rows.filter(r => r.type === 'OUT').map(r => r.time).sort();
  if (!ins.length || !outs.length) return null;
  const firstIn  = ins[0];
  const lastOut  = outs[outs.length - 1];
  const start = moment.tz(`${date} ${firstIn}`, 'YYYY-MM-DD HH:mm:ss', KST);
  const end   = moment.tz(`${date} ${lastOut}`, 'YYYY-MM-DD HH:mm:ss', KST);
  let diffMin = end.diff(start, 'minutes');
  if (!Number.isFinite(diffMin) || diffMin < 0) diffMin = 0;
  return diffMin;
}

// 프리뷰는 "무엇이 처리될지" 미리보기 목록/카운트만 반환
async function previewAutoLeave({ limit = 500 }) {
  // Auto leave 기능은 현재 구현되지 않은 상태이므로 빈 결과 반환
  return { list: [], count: 0 };
}

// 실제 처리. 멱등 설계 권장(같은 대상 중복 처리 방지)
async function performAutoLeave({ limit = 500 }) {
  // Auto leave 기능은 현재 구현되지 않은 상태이므로 빈 결과 반환
  return { processed: 0, preview: [] };
}

async function previewDailyReport({ limit = 500 }) {
  try {
    // 자동 발송이 꺼져있으면 빈 결과 반환
    const autoOn = await isDailyAutoOn();
    if (!autoOn) {
      return { list: [], count: 0 };
    }

    // 전날 작성된 리포트를 다음날 아침에 발송 - 기존 로직과 동일하게
    const yesterday = moment().tz('Asia/Seoul').subtract(1, 'day').format('YYYY-MM-DD');
    console.log(`[previewDailyReport] 어제 날짜: ${yesterday}에서 대기 상태 리포트 조회`);

    const items = await LessonLog.find({
      date: yesterday,
      notifyStatus: '대기'
    }).limit(limit).lean();

    console.log(`[previewDailyReport] 발견된 대기 리포트: ${items.length}건`);
    return { list: items, count: items.length };
  } catch (error) {
    console.error('previewDailyReport 오류:', error);
    return { list: [], count: 0 };
  }
}

async function performDailyReport({ limit = 500 }) {
  console.log('[performDailyReport] ★★★ 함수 호출됨 ★★★');
  try {
    console.log('[performDailyReport] 자동 리포트 발송 시작');

    // 자동 발송이 꺼져있으면 처리하지 않음
    const autoOn = await isDailyAutoOn();
    console.log('[performDailyReport] 자동 발송 설정 상태:', autoOn);
    if (!autoOn) {
      console.log('[performDailyReport] 자동 발송이 비활성화되어 있습니다.');
      return { processed: 0, preview: [] };
    }

    // 템플릿 코드 확인
    let tpl = getDailyTplCodeFallback();
    if (!tpl) tpl = await getSetting('daily_tpl_code', '');
    if (!tpl) {
      console.error('[performDailyReport] 리포트 템플릿 코드가 설정되지 않았습니다.');
      return { processed: 0, preview: [] };
    }

    // 전날 작성된 리포트를 다음날 아침에 발송 - 기존 로직과 동일하게
    const yesterday = moment().tz('Asia/Seoul').subtract(1, 'day').format('YYYY-MM-DD');
    console.log(`[performDailyReport] 어제 날짜: ${yesterday}에서 대기 상태 리포트 조회`);

    const list = await LessonLog.find({
      date: yesterday,
      notifyStatus: '대기'
    }).limit(limit).lean();

    console.log(`[performDailyReport] 발송 대상: ${list.length}건`);

    let sent = 0, failed = 0;
    const preview = [];

    for (const item of list) {
      try {
        const log = await LessonLog.findById(item._id);
        if (!log) {
          failed++;
          continue;
        }

        if (log.notifyStatus === '발송') {
          // 이미 발송된 경우 스킵
          continue;
        }

        const student = await User.findById(log.studentId);
        if (!student || !student.parentPhone) {
          console.log(`[performDailyReport] 학생 ${log.studentId} 학부모 연락처 없음`);
          failed++;
          continue;
        }

        // 학습 시간 자동 계산
        if (log.durationMin === undefined || log.durationMin === null) {
          const autoMin = await computeStudyTimeMinFromAttendance(log.studentId, log.date);
          if (autoMin !== null) {
            log.durationMin = autoMin;
            await log.save();
          }
        }

        const m = moment.tz(log.date, 'YYYY-MM-DD', KST);
        const dateLabel = m.format('YYYY.MM.DD(ddd)');
        const code = String(log._id);

        const ok = await sendReportAlimtalk(student.parentPhone, tpl, {
          학생명: student.name,
          과정: log.course || '-',
          수업일자: dateLabel,
          교재: log.book || '-',
          수업요약: log.content || '',
          과제요약: log.homework || '',
          피드백요약: log.feedback || '',
          code
        });

        const bodyForSize = [
          `1. 과정 : ${log.course || '-'}`,
          `2. 교재 : ${log.book || '-'}`,
          `3. 수업내용 : ${log.content || ''}`,
          `4. 과제 : ${log.homework || ''}`,
          `5. 개별 피드백 : ${log.feedback || ''}`
        ].join('\n');

        await NotificationLog.create({
          studentId: log.studentId,
          type: '일일리포트',
          status: ok ? '성공' : '실패',
          code: ok ? '0' : 'ERR',
          message: ok ? 'OK' : '알림톡 발송 실패',
          payloadSize: Buffer.byteLength(bodyForSize, 'utf8')
        });

        log.notifyStatus = ok ? '발송' : '실패';
        log.notifyLog = ok ? 'OK' : '알림톡 발송 실패';
        await log.save();

        if (ok) {
          sent++;
          console.log(`[performDailyReport] 발송 성공: ${student.name} (${log.date})`);
        } else {
          failed++;
          console.log(`[performDailyReport] 발송 실패: ${student.name} (${log.date})`);
        }

        preview.push({
          studentName: student.name,
          date: log.date,
          status: ok ? '성공' : '실패'
        });

      } catch (error) {
        console.error(`[performDailyReport] 개별 발송 오류:`, error);
        failed++;
      }
    }

    console.log(`[performDailyReport] 완료 - 성공: ${sent}, 실패: ${failed}`);
    return { processed: sent, failed, preview };

  } catch (error) {
    console.error('[performDailyReport] 전체 오류:', error);
    return { processed: 0, preview: [] };
  }
}
  
module.exports = {
  previewAutoLeave,
  performAutoLeave,
  previewDailyReport,
  performDailyReport,
};
  