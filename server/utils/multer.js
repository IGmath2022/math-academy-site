const multer = require('multer');
const path = require('path');
const uploadPath = path.join(__dirname, '..', 'uploads', 'news');
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 한글, 특수문자 → 영문, 숫자, _, - 로만
    const safeName = file.originalname.replace(/[^\w.-]/g, "_");
    const ext = path.extname(safeName);
    const basename = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, basename + ext);
  }
});
const upload = multer({ storage });