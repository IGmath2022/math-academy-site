const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studentProgressController');
const { isAuthenticated } = require('../middleware/auth');

router.post('/', isAuthenticated, ctrl.checkProgress);
router.get('/', isAuthenticated, ctrl.listProgress);

module.exports = router;