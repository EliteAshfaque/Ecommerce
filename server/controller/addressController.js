import database from "../database/db.js";
import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";

const fields = ["label", "recipient_name", "phone", "address", "city", "state", "emirate", "country", "pincode", "latitude", "longitude"];
const required = ["recipient_name", "phone", "address", "city", "state", "emirate", "country", "pincode"];

const cleanAddress = (body) => Object.fromEntries(fields.map((field) => [field, String(body[field] ?? "").trim()]));
const validate = (address, next) => {
  if (!required.every((field) => address[field])) return next(new ErrorHandler("Complete every delivery address field.", 400));
  if (!/^[0-9+\-\s()]{7,20}$/.test(address.phone)) return next(new ErrorHandler("Enter a valid delivery phone number.", 400));
  return null;
};

export const getAddresses = catchAsyncErrors(async (req, res) => {
  const { rows } = await database.query("SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, updated_at DESC", [req.user.id]);
  res.status(200).json({ success: true, addresses: rows });
});

export const createAddress = catchAsyncErrors(async (req, res, next) => {
  const address = cleanAddress(req.body);
  if (validate(address, next)) return;
  const makeDefault = req.body.is_default === true || req.body.is_default === "true";
  if (makeDefault) await database.query("UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1", [req.user.id]);
  const { rows } = await database.query(`INSERT INTO user_addresses (user_id,label,recipient_name,phone,address,city,state,emirate,country,pincode,latitude,longitude,is_default)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NULLIF($11,'')::decimal,NULLIF($12,'')::decimal,$13) RETURNING *`,
    [req.user.id, address.label || "Home", ...fields.slice(1).map((field) => address[field]), makeDefault]);
  res.status(201).json({ success: true, message: "Delivery address saved.", address: rows[0] });
});

export const updateAddress = catchAsyncErrors(async (req, res, next) => {
  const address = cleanAddress(req.body);
  if (validate(address, next)) return;
  const makeDefault = req.body.is_default === true || req.body.is_default === "true";
  if (makeDefault) await database.query("UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1", [req.user.id]);
  const { rows } = await database.query(`UPDATE user_addresses SET label=$1,recipient_name=$2,phone=$3,address=$4,city=$5,state=$6,emirate=$7,country=$8,pincode=$9,latitude=NULLIF($10,'')::decimal,longitude=NULLIF($11,'')::decimal,is_default=$12,updated_at=CURRENT_TIMESTAMP WHERE id=$13 AND user_id=$14 RETURNING *`,
    [address.label || "Home", ...fields.slice(1).map((field) => address[field]), makeDefault, req.params.id, req.user.id]);
  if (!rows[0]) return next(new ErrorHandler("Address not found.", 404));
  res.status(200).json({ success: true, message: "Delivery address updated.", address: rows[0] });
});

export const setDefaultAddress = catchAsyncErrors(async (req, res, next) => {
  const found = await database.query("SELECT id FROM user_addresses WHERE id=$1 AND user_id=$2", [req.params.id, req.user.id]);
  if (!found.rows[0]) return next(new ErrorHandler("Address not found.", 404));
  await database.query("UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1", [req.user.id]);
  const { rows } = await database.query("UPDATE user_addresses SET is_default = TRUE, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND user_id=$2 RETURNING *", [req.params.id, req.user.id]);
  res.status(200).json({ success: true, message: "Default delivery address updated.", address: rows[0] });
});

export const deleteAddress = catchAsyncErrors(async (req, res, next) => {
  const { rows } = await database.query("DELETE FROM user_addresses WHERE id=$1 AND user_id=$2 RETURNING id", [req.params.id, req.user.id]);
  if (!rows[0]) return next(new ErrorHandler("Address not found.", 404));
  res.status(200).json({ success: true, message: "Delivery address removed." });
});
