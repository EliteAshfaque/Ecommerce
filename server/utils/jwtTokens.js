import jwt from "jsonwebtoken";

export const sendToken = (user, statusCode, message, res) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  const useSecureCookies =
    process.env.NODE_ENV === "production" || process.env.FRONTEND_URL?.startsWith("https://");

  const options = {
    expires: new Date(
      Date.now() + Number(process.env.COOKIE_EXPIRES_IN) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    // Cross-origin production clients need an explicit SameSite policy, while
    // local HTTP development remains secure and convenient with Lax cookies.
    sameSite: useSecureCookies ? "none" : "lax",
    secure: useSecureCookies,
  };

  const { password, ...userWithoutPassword } = user;

  res
    .status(statusCode)
    .cookie("token", token, options)
    .json({
      success: true,
      message,
      user: userWithoutPassword,
      token,
    });
};
