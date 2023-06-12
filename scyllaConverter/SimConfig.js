import BPMNModdle from 'bpmn-moddle';
import conv_ele from './ConvertElements.js';

const moddle = new BPMNModdle();

export default async function createNewJsonSim(scenario, sceIndex, projectName, modIndex, processModel) {
    var newJson = {"_declaration": {"_attributes": {"version": "1.0", "encoding": "UTF-8"}}};
    newJson.definitions = await createSimConfig(scenario, sceIndex, projectName, modIndex, processModel);
    return newJson;
}

async function createSimConfig(scenario, sceIndex, projectName, modIndex, processModel) {
    var simConfig = new Object;
    var attributes = new Object;

    const {
      rootElement,
      references,
      warnings,
      elementsById
    } = await moddle.fromXML(processModel.BPMN, 'bpmn:Definitions');

    // create Tasks:
    simConfig.Task = conv_ele.createTasks(processModel.modelParameter.activities)

    // find types of Gateways first, because a gateway's tag includes the type
    const gatewaysPerType = conv_ele.createGateways(processModel.modelParameter.gateways, elementsById);
    Object.assign(simConfig, gatewaysPerType);

    // create events:
    const eventsPerType = conv_ele.createEvents(processModel.modelParameter.events, elementsById);
    Object.assign(simConfig, eventsPerType);


    const date = scenario.startingDate.slice(6, 10) + '-' + //TODO magic index acces
        scenario.startingDate.slice(3, 5) + '-' +
        scenario.startingDate.slice(0, 2)
    const time = scenario.startingTime + '+00:00'

    attributes.id = projectName + '_Sce' + sceIndex + '_Mod' + modIndex + '_Sim'
    attributes.startDateTime = date + 'T' + time

    attributes.processRef = rootElement.rootElements[0].id;
    attributes.processInstances = Math.min(scenario.numberOfInstances, 100) //TODO: Scylla cannot do Billions of instances
    simConfig._attributes = attributes;
    return { simulationConfiguration : simConfig };
}