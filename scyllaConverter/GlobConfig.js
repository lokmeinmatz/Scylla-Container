const conv_ele = require('./ConvertElements');

module.exports = {
    createNewJsonGlob: function (scenario, projectName, sceIndex) {

        var newJson = {"_declaration": {"_attributes": {"version": "1.0", "encoding": "UTF-8"}}};
        newJson.globalConfiguration = createGlobConfig(scenario, projectName, sceIndex);
        return newJson;
    }
}

/** Scylla global configuration:
 * https://github.com/bptlab/scylla/wiki/Global-Configuration
 *
 * unique id,
 * resource assignment strategies, (<resourceAssignmentOrder> tag)
 * a global simulation seed, (<randomSeed> tag)
 * simulation time zone, ( <zoneOffset> tag) +hh:mm or -hh:mm
 * timetables for resources,(<timetables>) parseable by java LocalTime.pars
 * resource definitions (<resourceData>)
 */
function createGlobConfig(scenario, projectName, sceIndex) {
    var globConfig = new Object;
    var attributes = new Object;
    var resourceData = new Object;
    var timetables = new Object;

    //create Elements from resource parameters:

    // resources:
    resourceData.dynamicResource = conv_ele.createRoles(scenario.resourceParameters.roles);
    let roleMapping = {};
    for (let role of scenario.resourceParameters.roles) {
        for (let resource of role.resources) {
            if (roleMapping[resource.id]) throw new Error(`Resource ${resource} assigned to role ${role} while already being assigned to role ${roleMapping[resource.id]}`);
            roleMapping[resource.id] = role.id;
        }
    }

    scenario.resourceParameters.resources.forEach(resourceInstance => {
        let role = resourceData.dynamicResource.find(role => role._attributes.id === roleMapping[resourceInstance.id]);
        if (!role) throw new Error(`Couldn't assign resource ${resourceInstance.id} to any role.`);
        role.instance.push(conv_ele.createResourceInstance(resourceInstance))
    });

    //timetables:
    timetables.timetable = conv_ele.createTimeTables(scenario.resourceParameters.timeTables);

    attributes.id = projectName + '_Sce' + sceIndex + '_Global'
    globConfig.resourceData = resourceData;
    globConfig.timetables = timetables;
    globConfig._attributes = attributes;
    return globConfig;
}