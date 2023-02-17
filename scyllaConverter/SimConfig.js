const conv_ele = require('./ConvertElements');

module.exports ={
    createNewJsonSim: function (scenario, sceIndex, projectName, modIndex) {

        var newJson = {"_declaration":{"_attributes":{"version":"1.0","encoding":"UTF-8"}}};
        newJson.definitions = createSimConfig(scenario,sceIndex, projectName, modIndex);
        return newJson;
    }
}

function createSimConfig(scenario, sceIndex, projectName, modIndex) {
    var simConfig = new Object;
    var definitions = new Object;
    var defAttr = new Object;
    var attributes = new Object;

    newModel = scenario.models[modIndex]

    // create Tasks:
    simConfig.Task = conv_ele.createTasks(newModel.modelParameter.activities)

    // create Gateways:
    gatewayTypes = newModel.modelParameter.gateways.map(value => value.type)

    // find types of Gateways first, because a gateway's tag includes the type
    var uniqueGatewayTypes = new Array;
    for (let i in gatewayTypes) {
        if (!uniqueGatewayTypes.includes(gatewayTypes[i])) {
            uniqueGatewayTypes.push(gatewayTypes[i].split(':')[1]);//.slice(4,-0));
        }
    }
    //    uniqueGatewayTypes= uniqueGatewayTypes.map(g =>g.charAt(0).toLowerCase() + g.slice(1));

    // taking care of different capitalization in Scylla and PetriSim
    for (let i in uniqueGatewayTypes) {
        simConfig[uniqueGatewayTypes[i].charAt(0).toLowerCase() + uniqueGatewayTypes[i].slice(1)] = conv_ele.createGateways(newModel.modelParameter.gateways, uniqueGatewayTypes[i]);
    }
    uniqueGatewayTypes= uniqueGatewayTypes.map(g =>g.charAt(0).toLowerCase() + g.slice(1));

    // adding probabilities to gateways (getting them from sequence by flow ids):
    for (let k in uniqueGatewayTypes) {
        for (let i in simConfig[uniqueGatewayTypes[k]]) {
            for (let j in simConfig[uniqueGatewayTypes[k]][i].outgoingSequenceFlow) {
                myId = simConfig[uniqueGatewayTypes[k]][i].outgoingSequenceFlow[j]._attributes.id
                proba = newModel.modelParameter.sequences.find(s => s.id == myId).probability
                simConfig[uniqueGatewayTypes[k]][i].outgoingSequenceFlow[j].branchingProbability = proba

            }
        }
    }

    // create events:
    eventTypes = newModel.modelParameter.events.map(value => value.type)//.split(':')[1])

    var uniqueEventTypes = new Array;
    for (let i in eventTypes) {
        if (!uniqueEventTypes.includes(eventTypes[i])) {
            uniqueEventTypes.push(eventTypes[i])//.split(':')[1]);//.slice(4,-0));
        }
    }
    uniqueEventTypes = uniqueEventTypes.map(u=> u.split(':')[1])    //TODO: maybe first letter lower case
    for (let i in uniqueEventTypes) {
        simConfig[uniqueEventTypes[i].charAt(0).toLowerCase() + uniqueEventTypes[i].slice(1)] = conv_ele.createEvents(newModel.modelParameter.events, uniqueEventTypes[i]);
    }


    date =  scenario.startingDate.slice(6,10) + '-' +
            scenario.startingDate.slice(3,5) + '-' +
            scenario.startingDate.slice(0,2)
    time = scenario.startingTime + '+01:00'

    attributes.id = projectName + '_Sce' + sceIndex + '_Mod' + modIndex + '_Sim'
    attributes.startDateTime = date + 'T' + time
    //defAttr.xmlns = 'xmlns:name'; //not used by PetriSim yet
    //defAttr.targetname = 'ourTargetName';    //not used by PetriSim yet
    attributes.processRef = 'Process_1'  //TODO: maybe model?
    attributes.processInstances = scenario.numberOfInstances
    definitions._attributes = defAttr;
    simConfig._attributes = attributes;
    definitions.simulationConfiguration = simConfig;
    return definitions;
}