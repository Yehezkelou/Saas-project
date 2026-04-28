import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { requireActiveTenant } from "../middleware/tenant.middleware";
import { RoleController } from "../controller/role.controller";
import { validate } from "../middleware/validate.middleware";
import { createRoleSchema, updateRoleSchema } from "../validators/role.validator";




const route = Router()
const controller = new RoleController()

route.use(requireAuth, requireActiveTenant)

route.get("/", controller.list)
route.post("/", validate(createRoleSchema), controller.createRole)
route.put("/:id", validate(updateRoleSchema), controller.updateRole)
route.delete("/:id", controller.deleteRole)


export default route;






