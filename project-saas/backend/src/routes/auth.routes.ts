import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { LoginSchema, registerSchema, StaffLoginSchema } from "../validators/Auth.validator";
import { AuthController } from "../controller/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

// initialiser le router
const route = Router()
// initialiser la classe Controller Auth
const authConroller = new AuthController()
// route auth
route.post("/register", validate(registerSchema), authConroller.RegisterController)
route.post("/login", validate(LoginSchema), authConroller.LoginController)
route.post("/system-login", validate(LoginSchema), authConroller.superAdminLogin)
route.post("/staff-login", validate(StaffLoginSchema), authConroller.StaffLoginController)


// route Protégée (token Obligatoir)
route.get("/me", requireAuth, authConroller.me)

export default route;

