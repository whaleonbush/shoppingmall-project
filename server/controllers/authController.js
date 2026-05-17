import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { toPublic } from './userController.js';

const JWT_SECRET = process.env.JWT_SECRET?.trim();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_SALT_ROUNDS = 12;

/** bcrypt 저장 형식인지 (로그인 전에 평문으로만 저장된 옛 계정 지원용) */
function looksLikeBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
export async function login(req, res) {
  try {
    const rawEmail = req.body?.email;
    const rawPassword = req.body?.password;

    const email =
      typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';
    const password =
      rawPassword === undefined || rawPassword === null
        ? ''
        : String(rawPassword);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해 주세요.',
      });
    }

    if (!JWT_SECRET) {
      console.error('[auth] JWT_SECRET is not set in environment');
      return res.status(500).json({
        success: false,
        message: '로그인 서비스 설정 오류입니다. 관리자에게 문의하세요.',
      });
    }

    const user = await User.findOne({ email });
    if (!user?.password) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const stored = user.password;
    let passwordOk = false;

    if (looksLikeBcryptHash(stored)) {
      passwordOk = await bcrypt.compare(password, stored);
    } else if (password === stored) {
      passwordOk = true;
      user.password = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      await user.save();
    }

    if (!passwordOk) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다.',
      });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      success: true,
      message: '로그인에 성공했습니다.',
      user: toPublic(user),
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }
}

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 */
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.auth.sub).select('-password -__v');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      });
    }
    return res.status(200).json({
      success: true,
      user: toPublic(user),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    });
  }
}
