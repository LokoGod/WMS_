const express = require('express');
const router = express.Router();
const controller = require('../controllers/userLogController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createUserLog);
router.get('/', auth, controller.getAllUserLogs);
router.get('/user/:userId', auth, controller.getUserLogsByUserId);
router.get('/:id', auth, controller.getUserLogById);
router.put('/:id', auth, controller.updateUserLog);
router.delete('/:id', auth, controller.deleteUserLog);

module.exports = router;
