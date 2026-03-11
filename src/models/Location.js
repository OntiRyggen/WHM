const { query } = require('../db/connection');

class Location {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
  }
}

async function createLocation(name, description = null) {
  const result = await query(
    'INSERT INTO locations (name, description) VALUES (?, ?) RETURNING *',
    [name, description]
  );
  
  return new Location(result.rows[0]);
}

async function getLocationById(id) {
  const result = await query(
    'SELECT * FROM locations WHERE id = ?',
    [id]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new Location(result.rows[0]);
}

async function getLocationByName(name) {
  const result = await query(
    'SELECT * FROM locations WHERE name = ?',
    [name]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return new Location(result.rows[0]);
}

async function getAllLocations() {
  const result = await query('SELECT * FROM locations ORDER BY name');
  return result.rows.map(row => new Location(row));
}

module.exports = {
  Location,
  createLocation,
  getLocationById,
  getLocationByName,
  getAllLocations
};
