const {body,validationResult}=require("express-validator");
let validationRegistrationprofile=[
  body("bio").notEmpty().withMessage("bio is required").trim().escape(),];
 module.exports=validationRegistrationprofile;