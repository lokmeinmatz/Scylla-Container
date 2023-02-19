/** 
    This file is run to convert a .json-file to .xml-files for Scylla.
    It produces one global configuration file for each "scenario"
    and one simulation configuration file for each "model" in each scenario

    the input files are in the ../input folder
    the output files in the ../output folder

    to install the xml-js package run "npm install --save xml-js" in command line

    execution:

    node ConvertMain.js <path and name of input file> <path for output files>
*/

const conv_sce = require('./ConvertScenario');

if (process.argv.length != 4) {
    throw new Error ('wrong number of arguments. usage: \n' +
        'node ConvertMain.js path_and_name_of_input_file path_ for_output_files');
}
const jsonObj = require(process.argv[2]);

const filename = process.argv[2].replace(/^.*[\\\/]/, '')

const projectDir = process.argv[3]

const projectName = filename.split('.')[0];

if (!filename.endsWith('.sjon')) {
    new Error('input file should be a .json-file');
}

console.log('Converting input-file: ' + filename)

// start conversion for each scenario in input file:
if (jsonObj instanceof Array) {
    for (let scenarioIndex in jsonObj) {

        conv_sce.convertScen(jsonObj[scenarioIndex], projectName, scenarioIndex, projectDir);
    }
}
