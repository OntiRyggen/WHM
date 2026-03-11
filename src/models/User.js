const bcrypt = require('bcrypt');
const { query } = require('../db/connection');

const SALT_ROUNDS = 10;

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.role = data.role;
    this.createdAt = data.created_at;
    this.lastLogin = data.last_login;
  }
}

async function createUser(username, password, role) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  
  const result = await query(
    `INSERT INTO users (username, password_hash, role) 
     VALUES (?, ?, ?) 
     RETURNING id, username, role, created_at, last_login`,
    [username, passwordHash, role]
  );
  
  return new User(result.rows[0]);
}

async function findUserByUsername(username) {
  const result = await query(
    'SELECT id, username, password_hash, role, created_at, last_login FROM users WHERE username = ?',
    [username]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    passwordHash: result.rows[0].password_hash
  };
}

async function findUserById(id) {
  const result = await query(
    'SELECT id, username, role, created_at, last_login FROM users WHERE id = ?',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new User(result.rows[0]);
}


async function updateLastLogin(userId) {
  await query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
    [userId]
  );
}

async function verifyPassword(plainPassword, passwordHash) {
  return await bcrypt.compare(plainPassword, passwordHash);
}

async function updateUser(userId, updates) {
  const fields = [];
  const values = [];
  let paramCount = 1;
  
  if (updates.password) {
    const passwordHash = await bcrypt.hash(updates.password, SALT_ROUNDS);
    fields.push(`password_hash = ?`);
    values.push(passwordHash);
  }
  
  if (updates.role) {
    fields.push(`role = ?`);
    values.push(updates.role);
  }
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(userId);
  
  const result = await query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ? 
     RETURNING id, username, role, created_at, last_login`,
    values
  );
  
  return new User(result.rows[0]);
}

module.exports = {
  User,
  createUser,
  findUserByUsername,
  findUserById,
  updateLastLogin,
  verifyPassword,
  updateUser
};
