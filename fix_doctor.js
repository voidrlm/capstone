const fs = require('fs');
let content = fs.readFileSync('backend/src/scripts/seedMockData.ts', 'utf8');

const fix = `
    // Create a generic doctor in the doctors table
    await pool.query(\`
      INSERT INTO doctors (id, name, specialty)
      VALUES ($1, 'Dr. Smith', 'General Practice')
      ON CONFLICT DO NOTHING
    \`, [drSmith?.id]);
    
    // Helper to get doctor ID (using Dr. Smith)
    const doctorId = drSmith?.id;
`;

content = content.replace('// Helper to get doctor ID (using Dr. Smith)\n    const doctorId = drSmith?.id;', fix);
fs.writeFileSync('backend/src/scripts/seedMockData.ts', content);
console.log('Fixed doctor seeding');
