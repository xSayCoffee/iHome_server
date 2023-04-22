import express from "express";
import {
  addHomes,
  getAllHomes,
  getAllHomesUsers,
  getHome,
  getHomeUser,
  linkHomes,
  linkHomesSensor,
  unLinkHome,
  unLinkHomeSensor,
} from "../controllers/homes.js";

const router = express.Router();

/* READ */
router.post("/addhome/:id", addHomes);
router.get("/all/:id", getAllHomes);
router.get("/allUser/:id", getAllHomesUsers);
router.get("/usershome/:userId/:homeId", getHomeUser);
router.get("/:id", getHome);
router.patch("/", linkHomes);
router.patch("/unlink", unLinkHome);
router.patch("/sensor", linkHomesSensor);
router.patch("/unlink/sensor", unLinkHomeSensor);

export default router;
