const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/schoolController');
const { isAdmin } = require('../middleware/auth');

router.get('/', ctrl.list);
router.post('/', isAdmin, ctrl.create);
router.delete('/:id', isAdmin, ctrl.remove);

module.exports = router;