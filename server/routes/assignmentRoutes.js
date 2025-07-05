const express = require('express');
const router = express.Router();
const assignmentCtrl = require('../controllers/assignmentController');
const { isAdmin } = require('../middleware/auth');

router.post('/', assignmentCtrl.assignChapterToStudent);
router.get('/', assignmentCtrl.getMyAssignments);
router.delete('/:id', assignmentCtrl.removeAssignment);

module.exports = router;