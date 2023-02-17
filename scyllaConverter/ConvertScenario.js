// in our representation a model contains
//  one BPMN and
//  one set of global configurations and
//  one set of process configurations

// one model is one element in the models array

const glo_co = require("./GlobConfig");
const convert = require("xml-js");
const fs = require('fs');
const sim_co = require("./SimConfig");
const path = require('path');

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

/*        var folder = 'convOut'
        var folderName = path.join(projectDir, folder)
        */
        var folderName = projectDir
        var folderpath = path.join(__dirname,'..', folderName);
        // var folderpath = path.join(__dirname, folderName); //for debugging
/*        fs.mkdir(folderpath, (err) => {
            if (err) {
                return console.error(err);
            }
        });*/
        console.log(folderName)
        console.log(folderpath)

        // create one global configuration:
        globalConfig_json = glo_co.createNewJsonGlob(scenario, projectName, sceIndex);
        var result = convert.json2xml(globalConfig_json, options);
        var outputFileName = globalConfig_json.globalConfiguration._attributes.id + '.xml'
        console.log('Converting to global configuration file: ' + path.join(folderpath, outputFileName))
        fs.writeFile(path.join(folderpath, outputFileName), result, (err) => {
            if (err) throw err;
        })

        for (let prop in scenario) {
            // create one simulation configuration for each model in a scenario:
            if (prop == 'models') {
                for (let modIndex in scenario[prop]) {
                    simConfig_json = sim_co.createNewJsonSim(scenario, sceIndex, projectName, modIndex);
                    var result = convert.json2xml(simConfig_json, options);

                    var outputFileName = simConfig_json.definitions.simulationConfiguration._attributes.id + '.xml'
                    console.log('Converting to simulation configuration file: ' + path.join(folderpath, outputFileName))
                    fs.writeFile(path.join(folderpath, outputFileName), result, (err) => {
                        if (err) throw err;
                    })
                }
            }
        }
        console.log('Converter is finished')
    }
}