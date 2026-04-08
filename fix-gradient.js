const fs = require('fs');
let content = fs.readFileSync('frontend/src/pages/PatientsPage.tsx', 'utf8');
content = content.replace('background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",', 'bgcolor: "background.paper",');
fs.writeFileSync('frontend/src/pages/PatientsPage.tsx', content);
console.log('Fixed gradient in PatientsPage.tsx');