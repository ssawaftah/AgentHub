import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspacesRouter from "./workspaces";
import businessesRouter from "./businesses";
import agentsRouter from "./agents";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspacesRouter);
router.use(businessesRouter);
router.use(agentsRouter);

export default router;
