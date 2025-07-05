const express = require('express');
const router = express.Router();
const assignmentCtrl = require('../controllers/assignmentController');
const { isAdmin } = require('../middleware/auth');

// 단원(강의) 학생에게 할당
router.post('/', assignmentCtrl.assignChapterToStudent);
// 학생이 할당받은 단원 전체 조회
router.get('/', assignmentCtrl.getMyAssignments);
// 할당 해제(삭제)
router.delete('/:id', assignmentCtrl.removeAssignment);

module.exports = router;