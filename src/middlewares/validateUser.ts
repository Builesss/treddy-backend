import { body } from "express-validator";

export const registerValidation = [
  body("nombre")
    .isLength({ min: 2 }).withMessage("El nombre debe tener al menos 2 caracteres")
    .isAlpha("es-ES", { ignore: " " }).withMessage("El nombre solo puede contener letras"),
  
  body("apellido")
    .isLength({ min: 2 }).withMessage("El apellido debe tener al menos 2 caracteres")
    .isAlpha("es-ES", { ignore: " " }).withMessage("El apellido solo puede contener letras"),

  body("email")
    .isEmail().withMessage("Debe ser un correo válido"),

  body("contrasena")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("La contraseña debe incluir mayúscula, minúscula, número y un carácter especial"),

  body("telefono")
    .optional()
    .isNumeric().withMessage("El teléfono solo puede contener números")
    .isLength({ min: 7 }).withMessage("El teléfono debe tener al menos 7 dígitos"),
];
