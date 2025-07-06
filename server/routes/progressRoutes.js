const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/progressController');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

router.get('/', isAuthenticated, ctrl.getProgress);
router.post('/', isAuthenticated, ctrl.saveProgress);

module.exports = router;