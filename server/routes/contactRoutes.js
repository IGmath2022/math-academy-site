const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASS = process.env.ADMIN_PASS;

const transporter = nodemailer.createTransport({
    service: "naver",
    auth: {
      user: ADMIN_EMAIL,
      pass: ADMIN_PASS,
    },
});

router.post("/", async (req, res) => {
  const { name, contact, date, message } = req.body;
  try {
    await transporter.sendMail({
      from: `"IG수학 홈페이지" <${ADMIN_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[IG수학] 상담문의: ${name}`,
      text: `상담 신청자: ${name}\n연락처: ${contact}\n희망 날짜: ${date}\n문의 내용:\n${message}`,
    });
    res.json({ success: true });
  } catch (err) {
    console.log("메일 전송 오류:", err);
    res.status(500).json({ success: false, error: "메일 전송 오류" });
  }
});

module.exports = router;