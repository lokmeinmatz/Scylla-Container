// in PetriSim representation a model contains
//  one BPMN and
//  one set of global configurations and
//  one set of process configurations

// one model is one element in the models array

const glo_co = require("./GlobConfig");
const convert = require("xml-js");
const fs = require('fs');
const sim_co = require("./SimConfig");
const path = require('path');

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


module.exports = {

    convertScen: function (scenario, projectName, sceIndex, projectDir) {

        // create output folder path
        var folderPath = path.join(__dirname, '..', projectDir);
        console.log('Into folder: ' + folderPath)

        // create one global configuration:
        globalConfig_json = glo_co.createNewJsonGlob(scenario, projectName, sceIndex);
        var result = convert.json2xml(globalConfig_json, options);
        var outputFileName = globalConfig_json.globalConfiguration._attributes.id + '.xml'
        console.log('Converting to global configuration file: ' + path.join(folderPath, outputFileName))
        fs.writeFile(path.join(folderPath, outputFileName), result, (err) => {
            if (err) throw err;
        })

        let simulationConfigurations = []
        // create one simulation configuration for each model in a scenario:
        for (let modelIndex in scenario.models) {
            let currentModel = scenario.models[modelIndex];
            currentModel.BPMN = scenario.modelJSON[modelIndex] //TODO please work on xml for an xml model :/
            simConfig_json = sim_co.createNewJsonSim(scenario, sceIndex, projectName, modelIndex, currentModel);
            var result = convert.json2xml(simConfig_json, options);
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
}