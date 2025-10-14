const {body,validationResult}=require("express-validator");
let validationRegistrationlogin=[
  body("name").notEmpty().withMessage("Name is required").trim().escape(),
  body("email").isEmail().withMessage("Invalid email address").trim().escape(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long").trim().escape(),
];
module.exports=validationRegistrationlogin;