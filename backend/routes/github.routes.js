import { Router } from "express"

import { maintainercontrol } from "../controllers/maintainer.controller.js"
import { contributorcontrol } from "../controllers/contributor.controller.js"
import { ownercontrol } from "../controllers/owner.controller.js"


const router = Router()

router.route("/maintainer").get(maintainercontrol)
router.route("/contributor").post(contributorcontrol)
router.route("/owner").post(ownercontrol)


export default router