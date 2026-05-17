import jwt from 'jsonwebtoken';

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
