import ErrorHandler from "../middlewares/errorMiddlesware.js";
import { catchAsyncErrors } from "../middlewares/catchAsynError.js";
import database from "../database/db.js";
import bcrypt from "bcrypt";
import { sendToken } from "../utils/jwtTokens.js";
import { generateResetPasswordToken } from "../utils/generateRessetPasswrodTokens.js";
import { generateEmailTemplate } from "../utils/generateForgotPassEmailTemplate.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import cloudinary  from "cloudinary";
import { emitAdminChange } from "../realtime/socket.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  const { password } = req.body;
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();

  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || password.length > 72) {
    return next(new ErrorHandler("Use a valid email and a password between 8 and 72 characters.", 400));
  }

  const isAlreadyRegistered = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (isAlreadyRegistered.rows.length > 0) {
    return next(
      new ErrorHandler("User already registered with this email.", 400),
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await database.query(
    "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *",
    [name, email, hashedPassword],
  );

  sendToken(user.rows[0], 201, "User registered successfully", res);
  emitAdminChange("users", "created");
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password.", 400));
  }

  const result = await database.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);

  if (result.rows.length === 0) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  const user = result.rows[0];
  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }

  sendToken(user, 200, "User logged in successfully", res);
});

export const logout = catchAsyncErrors(async (req, res) => {
  const useSecureCookies =
    process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https://");
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: useSecureCookies ? "none" : "lax",
      secure: useSecureCookies,
    })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

export const getUser = catchAsyncErrors(async (req, res) => {
  const { password, ...user } = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;
  const { frontendUrl } = req.query;

  let userResult = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("User not found with this email.", 404));
  }

  const user = userResult.rows[0];

  // 1. Generate the tokens
  const { hashedToken, resetPasswordExpireTime, resetToken } =
    generateResetPasswordToken();

  // 2. Save the hashed token and expiry time in the database
  await database.query(
    `UPDATE users SET reset_password_token = $1, reset_password_expire = $2 WHERE id = $3`,
    [hashedToken, resetPasswordExpireTime, user.id],
  );

  // 3. Create the URL that will be sent to the user
  const resetPasswordUrl = `${frontendUrl}/password/reset/${resetToken}`;

  // 4. Generate the HTML email template
  // Note: Fixed the arguments being passed to match the function definition from earlier
  const message = generateEmailTemplate(user, resetToken);

  try {
    // 5. Send the email
    await sendEmail({
      email: user.email,
      subject: "Ecommerce Password Recovery",
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    // 6. If sending the email fails, clear the tokens from the database so the user can try again cleanly
    await database.query(
      `UPDATE users SET reset_password_token = NULL, reset_password_expire = NULL WHERE email = $1`,
      [email],
    );

    return next(new ErrorHandler(error.message, 500));
  }
});
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Fixed 'user' to 'users' and used CURRENT_TIMESTAMP instead of NOW() for Postgres
  const user = await database.query(
    "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expire > CURRENT_TIMESTAMP",
    [resetPasswordToken],
  );

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid or expired reset token.", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  if (
    req.body.password.length < 8 ||
    req.body.password.length > 16 ||
    req.body.confirmPassword.length < 8 ||
    req.body.confirmPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400),
    );
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  // COMPLETED THE CUT-OFF QUERY
  const updatedUser = await database.query(
    `UPDATE users 
       SET password = $1, reset_password_token = NULL, reset_password_expire = NULL 
       WHERE id = $2 
       RETURNING *`,
    [hashedPassword, user.rows[0].id],
  );

  // Automatically log the user in after a successful reset
  sendToken(updatedUser.rows[0], 200, "Password reset successfully", res);
});
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  // 1. Get the passwords from the request body
  // Note: Ensure your frontend sends these exact keys: currentPassword, newPassword, confirmNewPassword
  const { currentPassword, newPassword, confirmNewPassword } = req.body;

  // 2. Check if all fields are provided
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }

  // 3. Verify the current password matches the one in the database
  // (This relies on the 'isAuthenticated' middleware running before this, which sets 'req.user')
  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    req.user.password,
  );

  if (!isPasswordMatch) {
    return next(new ErrorHandler("Current password is incorrect.", 401));
  }

  // 4. Check if the new passwords match
  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New passwords do not match.", 400));
  }

  // 5. Check length restrictions (from your screenshot)
  if (
    newPassword.length < 8 ||
    newPassword.length > 16 ||
    confirmNewPassword.length < 8 ||
    confirmNewPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400),
    );
  }

  // --- COMPLETED CODE BELOW (Not shown in screenshots) ---

  // 6. Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // 7. Update the password in the database
  const updatedUser = await database.query(
    `UPDATE users SET password = $1 WHERE id = $2 RETURNING *`,
    [hashedPassword, req.user.id],
  );

  // 8. Send a new token/cookie and success response
  sendToken(updatedUser.rows[0], 200, "Password updated successfully", res);
});
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const { name, email } = req.body;
  
    if (!name || !email) {
      return next(new ErrorHandler("Please provide all required fields.", 400));
    }
  
    if (name.trim().length === 0 || email.trim().length === 0) {
      return next(new ErrorHandler("Name and email cannot be empty.", 400));
    }
  
    let avatarData = {};
  
    // 1. Handle Avatar Upload if a file was provided
    if (req.files && req.files.avatar) {
      const { avatar } = req.files;
  
      // If the user already has an avatar, delete the old one from Cloudinary
      if (req.user?.avatar?.public_id) {
        await cloudinary.uploader.destroy(req.user.avatar.public_id);
      }
  
      // Upload the new avatar to Cloudinary
      const newProfileImage = await cloudinary.uploader.upload(avatar.tempFilePath, {
        folder: "Ecommerce_Avatars",
        width: 150,
        crop: "scale",
      });
  
      // Prepare the new avatar data object
      avatarData = {
        public_id: newProfileImage.public_id,
        url: newProfileImage.secure_url,
      };
    }
  
    let user;
  
    // 2. Update Database
    if (Object.keys(avatarData).length === 0) {
      // If no new avatar was uploaded, just update name and email
      user = await database.query(
        "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *",
        [name, email, req.user.id]
      );
    } else {
      // If a new avatar WAS uploaded, update name, email, AND avatar
      // (This section was missing/cut off in the screenshots, but is required)
      user = await database.query(
        "UPDATE users SET name = $1, email = $2, avatar = $3 WHERE id = $4 RETURNING *",
        [name, email, JSON.stringify(avatarData), req.user.id]
      );
    }
  
    // 3. Send Response
    const { password, reset_password_token, reset_password_expire, ...safeUser } = user.rows[0];

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  });
