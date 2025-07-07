const fs = require('fs');
const path = require('path');
const topojson = require('topojson-server');

// Path to the input GeoJSON file
const inputPath = path.join(__dirname, 'json', 'europe.geojson');
// Path to the output TopoJSON file
const outputPath = path.join(__dirname, 'json', 'europe.topojson');

// Read the input GeoJSON file
fs.readFile(inputPath, 'utf8', (err, data) => {
    if (err) {
        console.error(`Error reading the file: ${err.message}`);
        return;
    }

    try {
        // Parse the GeoJSON data
        const geojson = JSON.parse(data);

        // Convert GeoJSON to TopoJSON
        // The second parameter is a quantization parameter that helps reduce size
        // Higher values = higher precision but larger file size (usually between 1e4 and 1e6)
        const topology = topojson.topology({ europe: geojson }, 1e5);

        // Write the TopoJSON to a file
        fs.writeFile(outputPath, JSON.stringify(topology), 'utf8', (err) => {
            if (err) {
                console.error(`Error writing the file: ${err.message}`);
                return;
            }

            // Get file sizes for comparison
            const geojsonSize = fs.statSync(inputPath).size;
            const topojsonSize = fs.statSync(outputPath).size;
            const reductionPercent = ((geojsonSize - topojsonSize) / geojsonSize * 100).toFixed(2);

            console.log(`Conversion complete!`);
            console.log(`Original GeoJSON size: ${(geojsonSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`New TopoJSON size: ${(topojsonSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`Size reduction: ${reductionPercent}%`);
        });
    } catch (error) {
        console.error(`Error processing the GeoJSON: ${error.message}`);
    }
});
