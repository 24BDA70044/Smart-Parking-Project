const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// API: Get all vehicles
app.get('/api/vehicles', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Vehicle');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Register new vehicle
app.post('/api/vehicles', async (req, res) => {
  const { ownerName, type } = req.body;
  try {
    const [result] = await db.query('INSERT INTO Vehicle (OwnerName, Type) VALUES (?, ?)', [ownerName, type]);
    res.json({ id: result.insertId, ownerName, type });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get all slots
app.get('/api/slots', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ParkingSlot');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Get active parked vehicles (where ExitTime is NULL)
app.get('/api/park/active', async (req, res) => {
  try {
    const query = `
      SELECT pr.RecordID, pr.EntryTime, v.OwnerName, v.Type as VehicleType, ps.SlotID, ps.SlotType
      FROM ParkingRecord pr
      JOIN Vehicle v ON pr.VehicleID = v.VehicleID
      JOIN ParkingSlot ps ON pr.SlotID = ps.SlotID
      WHERE pr.ExitTime IS NULL
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Vehicle Entry
app.post('/api/park/entry', async (req, res) => {
  const { vehicleId, slotId } = req.body;
  try {
    // Insert into ParkingRecord
    await db.query('INSERT INTO ParkingRecord (VehicleID, SlotID, EntryTime) VALUES (?, ?, NOW())', [vehicleId, slotId]);
    // Mark slot as Occupied
    await db.query("UPDATE ParkingSlot SET Status = 'Occupied' WHERE SlotID = ?", [slotId]);
    res.json({ message: 'Vehicle parked successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API: Vehicle Exit
app.post('/api/park/exit', async (req, res) => {
  const { recordId, slotId } = req.body;
  try {
    // Mark exit time
    await db.query('UPDATE ParkingRecord SET ExitTime = NOW() WHERE RecordID = ?', [recordId]);
    // Release slot
    await db.query("UPDATE ParkingSlot SET Status = 'Available' WHERE SlotID = ?", [slotId]);
    
    // Calculate charge: (TIMESTAMPDIFF in HOUR * 20). If less than 1 hour, charge minimum of 20
    const [rows] = await db.query(`
      SELECT TIMESTAMPDIFF(HOUR, EntryTime, ExitTime) * 20 AS charge 
      FROM ParkingRecord WHERE RecordID = ?
    `, [recordId]);
    
    let charge = rows[0]?.charge || 0;
    if (charge < 20) charge = 20; // Ensure minimum charge

    // Insert into Payments
    await db.query('INSERT INTO Payments (RecordID, Amount) VALUES (?, ?)', [recordId, charge]);
    
    res.json({ message: 'Vehicle exited successfully', charge });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Smart Parking Server running on port ${port}`));
