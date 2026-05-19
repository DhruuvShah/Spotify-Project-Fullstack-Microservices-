import { body, validationResult } from "express-validator";

async function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

export const registerUserValidationRules = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Email is not valid"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[A-Za-z]/).withMessage("Password must contain at least one letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),
  body("fullname.firstName")
    .trim()
    .notEmpty().withMessage("First name is required")
    .isLength({ max: 50 }).withMessage("First name must be under 50 characters")
    .matches(/^[A-Za-z\s'-]+$/).withMessage("First name contains invalid characters"),
  body("fullname.lastName")
    .trim()
    .notEmpty().withMessage("Last name is required")
    .isLength({ max: 50 }).withMessage("Last name must be under 50 characters")
    .matches(/^[A-Za-z\s'-]+$/).withMessage("Last name contains invalid characters"),
  validate,
];

export const loginUserValidationRules = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail().withMessage("Email is not valid"),
  body("password").notEmpty().withMessage("Password is required"),
  validate,
];
