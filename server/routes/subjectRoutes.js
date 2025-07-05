const express = require('express');
const router = express.Router();
const subjectCtrl = require('../controllers/subjectController');
const { isAdmin } = require('../middleware/auth');

router.get('/', subjectCtrl.getSubjects);
router.post('/', subjectCtrl.createSubject);
router.put('/:id', subjectCtrl.updateSubject);
router.delete('/:id', subjectCtrl.deleteSubject);

module.exports = router;