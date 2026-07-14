import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workspacesRouter from "./workspaces";
import businessesRouter from "./businesses";
import agentsRouter from "./agents";
import apiKeysRouter from "./api_keys";
import brainsRouter from "./brains";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workspacesRouter);
router.use(businessesRouter);
router.use(agentsRouter);
router.use(apiKeysRouter);
router.use(brainsRouter);

export default router;
