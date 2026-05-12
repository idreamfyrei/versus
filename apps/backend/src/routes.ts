import { Router } from "express";

import vsRoutes from "./modules/vs/vs.routes.js";

const router: Router = Router();

router.use("/vs", vsRoutes);

export { router as routes };
