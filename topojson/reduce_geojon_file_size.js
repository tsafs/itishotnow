const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

// Path to the input GeoJSON file
const inputPath = path.join(__dirname, 'json', 'germany_10m_admin_0.json');
// Path to the output reduced GeoJSON file
const outputPath = path.join(__dirname, 'json', 'germany_10m_admin_0_reduced.json');

// Configuration options
const options = {
    precision: 4,      // Number of decimal places for coordinates
    tolerance: 0.000   // Simplification tolerance - higher means more simplification
};

// Read the input GeoJSON file
fs.readFile(inputPath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading the file: ${err.message}`);
        return;
    }

    try {
        // Parse the GeoJSON data
        const geojson = JSON.parse(data);

        // Step 1: Simplify geometry using turf.js
        const simplified = turf.simplify(geojson, {
            tolerance: options.tolerance,
            highQuality: true
        });

        // Step 2: Reduce coordinate precision
        const reducePrecision = (obj) => {
            if (Array.isArray(obj)) {
                if (obj.length === 2 && typeof obj[0] === 'number' && typeof obj[1] === 'number') {
                    // This is a coordinate pair
                    return obj.map(coord => parseFloat(coord.toFixed(options.precision)));
                }
                return obj.map(item => reducePrecision(item));
            } else if (obj !== null && typeof obj === 'object') {
                Object.keys(obj).forEach(key => {
                    obj[key] = reducePrecision(obj[key]);
                });
            }
            return obj;
        };

        const reduced = reducePrecision(simplified);

        // Write the reduced GeoJSON to a file
        fs.writeFile(outputPath, JSON.stringify(reduced), 'utf8', (err) => {
            if (err) {
                console.error(`Error writing the file: ${err.message}`);
                return;
            }

            // Get file sizes for comparison
            const originalSize = fs.statSync(inputPath).size;
            const reducedSize = fs.statSync(outputPath).size;
            const reductionPercent = ((originalSize - reducedSize) / originalSize * 100).toFixed(2);

            console.log(`Reduction complete!`);
            console.log(`Original GeoJSON size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Reduced GeoJSON size: ${(reducedSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Size reduction: ${reductionPercent}%`);
        });
    } catch (error) {
        console.error(`Error processing the GeoJSON: ${error.message}`);
    }
});