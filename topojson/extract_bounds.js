const fs = require('fs');
const path = require('path');

// Read the GeoJSON file
const geojsonPath = path.join(__dirname, 'json', 'germany_10m_admin_0_reduced.json');
const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

// Function to extract bounds from coordinates
function extractBounds(coordinates) {
    let minLon = Infinity;
    let maxLon = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    function processCoords(coords) {
        if (typeof coords[0] === 'number') {
            // This is a single coordinate pair [lon, lat]
            const [lon, lat] = coords;
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
        } else {
            // This is an array of coordinates, recurse
            coords.forEach(processCoords);
        }
    }

    processCoords(coordinates);
    return { minLon, maxLon, minLat, maxLat };
}

// Extract bounds from the geometry
const bounds = extractBounds(geojson.geometry.coordinates);

console.log('\n=== Germany GeoJSON Bounding Box ===\n');
console.log('Western point (min longitude):', bounds.minLon);
console.log('Eastern point (max longitude):', bounds.maxLon);
console.log('Southern point (min latitude):', bounds.minLat);
console.log('Northern point (max latitude):', bounds.maxLat);

console.log('\n=== For TypeScript/JavaScript ===\n');
console.log('const GERMANY_BOUNDS = {');
console.log(`    west: ${bounds.minLon},`);
console.log(`    east: ${bounds.maxLon},`);
console.log(`    south: ${bounds.minLat},`);
console.log(`    north: ${bounds.maxLat},`);
console.log('};');

console.log('\n=== For Observable Plot projection domain ===\n');
console.log('domain: {');
console.log('    type: "Feature",');
console.log('    geometry: {');
console.log('        type: "Polygon",');
console.log('        coordinates: [[');
console.log(`            [${bounds.minLon}, ${bounds.minLat}],`);
console.log(`            [${bounds.maxLon}, ${bounds.minLat}],`);
console.log(`            [${bounds.maxLon}, ${bounds.maxLat}],`);
console.log(`            [${bounds.minLon}, ${bounds.maxLat}],`);
console.log(`            [${bounds.minLon}, ${bounds.minLat}]`);
console.log('        ]]');
console.log('    }');
console.log('}');

console.log('\n');
