
const { body } = require('express-validator');

exports.registerAdminValidators = [

  body('email').isEmail().withMessage('Enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];
