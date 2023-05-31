/**
 This file is run to convert a .json-file to .xml-files for Scylla.
 It produces one global configuration file for each "scenario"
 and one simulation configuration file for each "model" in each scenario

 the input files are in the ../input folder
 the output files in the ../output folder

 to install the xml-js package run "npm install --save xml-js" in command line

 example input file in folder:
 Scylla-container/scyllaConverter/projects/testp/pizza1.json

 example execution:
 from directory: Scylla-container/scyllaConverter:
 node ConvertMain.js ../projects/testp/pizza1.json ./projects/testp
 */

const conv_sce = require('./ConvertScenario');

// read command line arguments:
if (process.argv.length != 4) {
    throw new Error('wrong number of arguments. usage: \n' +
        'node ConvertMain.js path_and_name_of_input_file path_ for_output_files');
}
const jsonObj = require(process.argv[2]);
const filename = process.argv[2].replace(/^.*[\\\/]/, '')
const projectDir = process.argv[3]
const projectName = filename.split('.')[0];

// check format of input file:
if (!filename.endsWith('.json')) {
    throw new Error('input file should be a .json-file');
}

console.log('Converting input-file: ' + filename)

// start conversion for each scenario in input file:
const expectedAttributes = [ "scenarioName", "startingDate", "startingTime", "numberOfInstances", "interArrivalTime", "timeUnit", "currency", "resourceParameters", "models"];
const missingAttributes = expectedAttributes.filter(attribute => !jsonObj[attribute]);
if (missingAttributes.length === 0) {
    conv_sce.convertScen(jsonObj, projectName, 0, projectDir);
} else {
    throw new Error('input file does not conform with the format of PetriSim Parameter output. Missing attributes '+missingAttributes+' Check example input-file pizza1.json');
}
