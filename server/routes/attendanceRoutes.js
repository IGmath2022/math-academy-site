const express = require('express');
const router = express.Router();
const axios = require('axios');
const User = require('../models/User');
const moment = require('moment');

// 출결 등록/알림톡 발송
router.post('/attendance', async (req, res) => {
  try {
    const { phoneLast4, name, type } = req.body; // type: "등원" or "하원"

    // 1. 학생 검색
    const user = await User.findOne({
      name,
      $or: [
        { phone: { $regex: phoneLast4 + '$' } },
        { parentPhone: { $regex: phoneLast4 + '$' } }
      ]
    });
    if (!user) return res.status(404).json({ message: '학생 정보를 찾을 수 없습니다.' });

    // 2. 발송할 변수 조립
    const sendName = user.name;
    const sendType = type === '등원' ? '등원' : '하원';
    const sendTime = moment().format('YYYY-MM-DD HH:mm');

    // 3. 알리고(카카오 알림톡) 호출 (더미 API KEY)
    const response = await axios.post('https://kakaoapi.aligo.in/akv10/alimtalk/send/', null, {
      params: {
        key: 'YOUR_API_KEY',              // 알리고 API KEY
        user_id: 'YOUR_ALIGO_ID',         // 알리고 ID
        sender_key: 'YOUR_SENDER_KEY',    // 알림톡 발신프로필키
        tpl_code: 'UB_0082',              // 템플릿 코드
        sender: '01012345678',            // 발신번호(인증 필요)
        receiver_1: user.parentPhone,     // 학부모 번호
        subject_1: 'IG수학 출결알림',
        message_1: `[IG수학] ${sendName} 학생이 ${sendType}하였습니다.\n출결시간: ${sendTime}`
        // 실제 템플릿 변수에 맞춰 바꿔야 함
      }
    });

    // 4. 로그 기록 등
    // await Attendance.create({ userId: user._id, type, time: sendTime, ... })

    return res.json({ result: 'success', aligo: response.data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: '오류가 발생했습니다.' });
  }
});

module.exports = router;