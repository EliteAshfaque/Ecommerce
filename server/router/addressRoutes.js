import express from "express";
import { isAuthenticated } from "../middlewares/authmiddleware.js";
import { createAddress, deleteAddress, getAddresses, setDefaultAddress, updateAddress } from "../controller/addressController.js";

const router = express.Router();
router.use(isAuthenticated);
router.route("/").get(getAddresses).post(createAddress);
router.route("/:id").put(updateAddress).delete(deleteAddress);
router.put("/:id/default", setDefaultAddress);
export default router;
