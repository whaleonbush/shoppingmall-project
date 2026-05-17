import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const ALLOWED_FIELDS = ['email', 'name', 'password', 'user-type', 'address'];
const BCRYPT_SALT_ROUNDS = 12;

function pickAllowed(body) {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
}

/** Replaces plain `password` in `data` with a bcrypt hash when present and non-empty. */
async function hashPasswordInPlace(data) {
  if (data.password === undefined || data.password === null) return;
  const plain = String(data.password);
  if (plain.length === 0) return;
  data.password = await bcrypt.hash(plain, BCRYPT_SALT_ROUNDS);
}

export function toPublic(userDoc) {
  if (!userDoc) return userDoc;
  const obj = userDoc.toObject ? userDoc.toObject() : userDoc;
  delete obj.password;
  delete obj.__v;
  return obj;
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

function handleError(res, err) {
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation failed',
      errors: Object.fromEntries(
        Object.entries(err.errors).map(([k, v]) => [k, v.message])
      ),
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate key',
      keys: err.keyValue,
    });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}

export async function createUser(req, res) {
  try {
    const data = pickAllowed(req.body ?? {});
    await hashPasswordInPlace(data);
    const created = await User.create(data);
    res.status(201).json(toPublic(created));
  } catch (err) {
    handleError(res, err);
  }
}

export async function listUsers(req, res) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const filter = {};
    if (req.query['user-type']) filter['user-type'] = req.query['user-type'];
    if (req.query.email) filter.email = String(req.query.email).toLowerCase();

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-password -__v')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({ items, page, limit, total });
  } catch (err) {
    handleError(res, err);
  }
}

export async function getUserById(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const user = await User.findById(req.params.id).select('-password -__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    handleError(res, err);
  }
}

export async function updateUser(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const data = pickAllowed(req.body ?? {});
    await hashPasswordInPlace(data);
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      data,
      { new: true, runValidators: true, context: 'query' }
    ).select('-password -__v');

    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    handleError(res, err);
  }
}

export async function deleteUser(req, res) {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const deleted = await User.findByIdAndDelete(req.params.id).select('-password -__v');
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Deleted', user: deleted });
  } catch (err) {
    handleError(res, err);
  }
}
