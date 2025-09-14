const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', upload.single('faceImg'), userController.register);
router.post('/login', userController.login);
router.get('/profile', auth, userController.getProfile);
router.get('/', auth, userController.getAllUsers);
router.get('/:id', auth, userController.getUsersById);
router.put('/:id', auth, userController.updateUser);


module.exports = router;
