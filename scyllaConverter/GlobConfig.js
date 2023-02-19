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
    for (let prop in scenario) {

        //create Elements from resource parameters:
        if (prop == 'resourceParameters') {

            // resources:
            for (let prop2 in scenario[prop]) {
                if (prop2 == 'resources') {
                    resourceData.dynamicResource = conv_ele.createResources(scenario[prop][prop2]);
                    // roles: here: get defaultTimetable
                    for (let res in resourceData.dynamicResource) {
                        var myId = resourceData.dynamicResource[res]._attributes.id;
                        var myRoles = scenario.resourceParameters.roles
                        for (let i in myRoles) {
                            for (let j in myRoles[i].resources) {
                                if (myRoles[i].resources[j].id == myId) {
                                    sch = myRoles[i].schedule
                                }
                            }
                        }
                        resourceData.dynamicResource[res]._attributes.defaultTimetableId = sch
                    }
                }
            }

            //timetables:
            for (let prop2 in scenario[prop]) {
                if (prop2 == 'timeTables') {
                    timetables.timetable = conv_ele.createTimeTables(scenario[prop][prop2]);
                }
            }
        }

    }
    attributes.id = projectName + '_Sce' + sceIndex + '_Global'
    resourceData.dynamicResource.map(d => d._attributes.defaultTimeUnit = conv_ele.getScenTimeUnit(scenario.timeUnit))
    globConfig.resourceData = resourceData;
    globConfig.timetables = timetables;
    globConfig._attributes = attributes;
    return globConfig;
}