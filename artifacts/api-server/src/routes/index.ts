import { Router, type IRouter } from "express";
import healthRouter from "./health";
import healthTipsRouter from "./health-tips";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/health-tips", healthTipsRouter);

export default router;
