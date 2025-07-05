require("dotenv").config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();

app.use(cors({
  origin: 'https://ig-math-2022.onrender.com',
  credentials: true
}));
app.use(express.json());

mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log(err));

app.use('/uploads', express.static('uploads'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/chapters', require('./routes/chapterRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));
app.use('/api/materials', require('./routes/materialRoutes'));
app.use('/api/contact', require("./routes/contactRoutes"));
app.use('/api/blog', require("./routes/blogRoutes"));
app.use('/api/settings', require('./routes/settingsRoutes'));
app.use('/api/progress', require('./routes/studentProgressRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/schools', require('./routes/schoolRoutes'));
app.use('/api/schoolschedules', require('./routes/schoolScheduleRoutes'));
app.use('/api/school-periods', require("./routes/schoolPeriodRoutes"));

app.get('/', (req, res) => {
  res.send('서버가 정상적으로 동작합니다!');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행중`);
});