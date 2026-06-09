import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../services/mail.service.js";
const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const isUserExist = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (isUserExist) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const newUser = await User.create({
      username,
      email,
      password,
    });
    await sendEmail({
      to: email,
      subject: "Welcome to Perplex",
      text: `Hello ${username},

Welcome to Perplex! 🎉

We're excited to have you join our community.

Your account has been successfully created, and you can now start connecting with others, sharing messages, and exploring everything Perplex has to offer.

If you have any questions or need assistance, feel free to reach out to our team.

Thank you for choosing Perplex.

Best regards,
The Perplex Team`,
    });
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export default registerUser;
