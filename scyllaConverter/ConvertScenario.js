import * as path from 'path'
import * as fs from 'fs';
import { json2xml } from 'xml-js';
import createNewJsonGlob from './GlobConfig.js';
import createNewJsonSim from './SimConfig.js';

// set options for conversion from .json to .xml
var options = {
    fullTagEmptyElement: false,
    compact: true,
    ignoreComment: true,
    spaces: '\t',
    instructionHasAttributes: false,
    indentCdata: true,
    addParent: true
};


export async function convertScen(scenario, projectName, sceIndex, projectDir) {

    // create output folder path
    var folderPath = projectDir;
    console.log('Into folder: ' + folderPath)

    // create one global configuration:
    const globalConfig_json = createNewJsonGlob(scenario, projectName, sceIndex);
    var result = json2xml(globalConfig_json, options);
    var outputFileName = globalConfig_json.globalConfiguration._attributes.id + '.xml'
    console.log('Converting to global configuration file: ' + path.join(folderPath, outputFileName))
    fs.writeFile(path.join(folderPath, outputFileName), result, (err) => {
        if (err) throw err;
    })

    let simulationConfigurations = []
    // create one simulation configuration for each model in a scenario:
    for (let modelIndex in scenario.models) {
        let currentModel = scenario.models[modelIndex];
        const simConfig_json = await createNewJsonSim(scenario, sceIndex, projectName, modelIndex, currentModel);
        var result = json2xml(simConfig_json, options);
        var outputFileName = simConfig_json.definitions.simulationConfiguration._attributes.id + '.xml'
        console.log('Converting to simulation configuration file: ' + path.join(folderPath, outputFileName))
        fs.writeFile(path.join(folderPath, outputFileName), result, (err) => {
            if (err) throw err;
        });
        simulationConfigurations.push(outputFileName)
    }
    if (simulationConfigurations.length === 0) throw 'No modelconfiguration converted!'
    console.log('Converter is finished')
}