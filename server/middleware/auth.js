import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET?.trim();

/**
 * Requires `Authorization: Bearer <JWT>`. Sets `req.auth = { sub, email }` on success.
 */
export function requireAuth(req, res, next) {
  if (!JWT_SECRET) {
    return res.status(500).json({
      success: false,
      message: '인증 서비스 설정 오류입니다.',
    });
  }

  const header = req.headers.authorization;
  if (!header || typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다. 토큰을 보내 주세요.',
    });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '로그인이 필요합니다. 토큰을 보내 주세요.',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const sub = payload.sub;
    if (!sub) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 토큰입니다.',
      });
    }
    req.auth = {
      sub: String(sub),
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
    next();
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다. 다시 로그인해 주세요.',
      });
    }
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.',
    });
  }
}

/**
 * `requireAuth` 이후에 사용. 토큰의 sub로 사용자 정보를 조회해
 * `user-type === 'admin'`인 경우에만 통과시키고, 그 외에는 403을 반환한다.
 * 성공 시 `req.user`에 조회한 사용자 문서가 채워진다.
 */
export async function requireAdmin(req, res, next) {
  try {
    if (!req.auth?.sub) {
      return res.status(401).json({
        success: false,
        message: '로그인이 필요합니다.',
      });
    }

    const user = await User.findById(req.auth.sub).select('-password -__v');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '사용자를 찾을 수 없습니다. 다시 로그인해 주세요.',
      });
    }

    if (user['user-type'] !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '관리자 권한이 필요합니다.',
      });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[auth] requireAdmin error:', err);
    return res.status(500).json({
      success: false,
      message: '권한 확인 중 오류가 발생했습니다.',
    });
  }
}
