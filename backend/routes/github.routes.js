import { Router } from "express"

import { maintainercontrol, getRepoContributors } from "../controllers/maintainer.controller.js"
import { contributorcontrol } from "../controllers/contributor.controller.js"
import { ownercontrol } from "../controllers/owner.controller.js"
import { setUsernameAndChain } from "../controllers/setusername_and_chain.controller.js"


const router = Router()

router.route("/maintainer").get(maintainercontrol)
router.route("/contributor").post(contributorcontrol)
router.route("/owner").post(ownercontrol)
router.route("/repos/:owner/:repo/contributors").get(getRepoContributors)
router.route("/set-user-data").post(setUsernameAndChain)



export default router