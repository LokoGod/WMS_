const express = require('express');
const router = express.Router();
const controller = require('../controllers/userDailyDetailsController');
const auth = require('../middleware/auth');

router.post('/', auth, controller.createUserDailyDetails);
router.get('/', auth, controller.getAllUserDailyDetails);
router.get('/:id', auth, controller.getUserDailyDetailsById);
router.get('/user/:userId', auth, controller.getUserDailyDetailsByUserId);
router.put('/:id', auth, controller.updateUserDailyDetails);
router.delete('/:id', auth, controller.deleteUserDailyDetails);

module.exports = router;
