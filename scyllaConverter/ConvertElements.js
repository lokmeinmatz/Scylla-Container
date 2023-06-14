/**
 * In this file: Conversion of the smallest elements:
 * tasks, timetables, resources, gateways, events,
 * duration, interarrivalTime and
 * Distribution
 *
 */

import { TimeUnits } from "../../SimulationPortal--Main/frontend/src/util/DataModel.js";

export default {

    // creates all resources, calls function to create a single resource
    createRoles: function (roles) {
        return roles.map(role => createRole(role));
    },
    // creates all timetables, calls function to create a single timetable
    createTimeTables: function (timeTables) {
        return timeTables.map(timeTable => createOneTimeTable(timeTable));
    },

    // creates all tasks, calls function to create a single task
    createTasks: function (obj) {
        return obj.map(createOneTask);
    },

    // creates all gateways, calls function to create a single gateway
    createGateways: function (gateways, elementsById) {
        return convertByType(gateways, elementsById, createOneGateway);
    },

    // creates all events, calls function to create a single event
    createEvents: function (events, elementsById) {
        return convertByType(events, elementsById, createOneEvent);
    },   

    createResourceInstance : function(resource) {
        return {
            _attributes : {
                id : resource.id,
                name : resource.id,
                cost : resource.costHour || undefined, // Might be empty to signify using role default
                timetableId : resource.schedule || undefined // "
            }
        };
    }
}



function decapitalize(string) {
    return string[0].toLowerCase() + string.slice(1);
}

function convertByType(jsonConfigElements, elementsById, mapper) {
    const translatedElementsPerType = {};
    jsonConfigElements.forEach(jsonConfigElement => {
        const elementType = decapitalize(elementsById[jsonConfigElement.id].$type.split(':').pop());
        if (!translatedElementsPerType[elementType]) {translatedElementsPerType[elementType] = []};
        translatedElementsPerType[elementType].push(mapper(jsonConfigElement));
    });
    return translatedElementsPerType;
}

// creates a single role
function createRole(role) {
    return {
        _attributes : {
            id : role.id,
            name : role.id,

            defaultCost : role.costHour, 
            defaultQuantity : role.resources.length, //TODO be able to add additional unnamed resources from portal side
            defaultTimetableId : role.schedule,
            defaultTimeUnit : 'HOURS' // Costs are always given per hour
        },
        
        instance : []
    };
}

// creates a single task
function createOneTask(activity) {
    var task = new Object;
    var attributes = new Object;
    var resource = new Array;
    var resources = new Object;
    attributes.id = activity.id
    // TODO unneeded but would be nice attributes.name = activity.name.replaceAll('\n', ' ')
    task.duration = createOneDistributionWithTime(activity.duration);

    // create all resources for this task, count occurances to determine number of instances:
    for (let resIndex in activity.resources) {
        if ((resource.some(r => r._attributes.id == activity.resources[resIndex]))) {
            var index = resource.findIndex(r => r._attributes.id == activity.resources[resIndex]);
            resource[index]._attributes.amount = (parseInt(resource[index]._attributes.amount) + 1);
        } else {
            resource.push(createOneResourceForTask(activity.resources[resIndex]));
        }
    }
    resources.resource = resource;
    task.resources = resources;
    task._attributes = attributes;
    return task;
}

// creates a single gateway
function createOneGateway(gateway) {
    return {
        _attributes : {
            id : gateway.id
        },
        outgoingSequenceFlow : Object.entries(gateway.probabilities).map(([flowId, probability]) => ({
            _attributes : {
                id : flowId
            },
            branchingProbability : probability
        }))
    }
}

// creates a single event
function createOneEvent(event) {
    return {
        _attributes : {
            id : event.id
        },
        arrivalRate : createOneDistributionWithTime(event.interArrivalTime)
    }
}

// creates a single new resource element assigned to a task:
function createOneResourceForTask(resource) {
    var res = new Object;
    var attributes = new Object;
    attributes.id = resource;
    attributes.amount = 1;
    res._attributes = attributes;
    return res;
}

// translates a distribution with timeunit, e.g., arrival rates or durations:
function createOneDistributionWithTime(distributionWithTimeUnit) {
    return {
        _attributes : {
            timeUnit : getTimeUnit(distributionWithTimeUnit.timeUnit)
        },
        [distributionWithTimeUnit.distributionType + 'Distribution'] : createDistribution(distributionWithTimeUnit)
    }
}

// creates a single timetable
function createOneTimeTable(timetable) {
    return {
        _attributes : {
            id : timetable.id
        },
        timetableItem : timetable.timeTableItems.map(item => createOneTimeTableItem(item))
    };
}

// create one item of a timetable
function createOneTimeTableItem(timetableItem) {
    var item = new Object;
    var attributes = new Object;

    attributes.from = (timetableItem.startWeekday).toUpperCase();
    attributes.to = (timetableItem.endWeekday).toUpperCase();
    attributes.beginTime = timetableItem.startTime + ':00';
    attributes.endTime = timetableItem.endTime + ':00';

    //TODO ducttape
    if (attributes.beginTime.length < '00:00'.length) attributes.beginTime = '0' + attributes.beginTime;
    if (attributes.endTime.length < '00:00'.length) attributes.endTime = '0' + attributes.endTime;
    if (attributes.endTime === '24:00') attributes.endTime = '23:59';

    item._attributes = attributes;
    return item;
}

// create distribution depending on type of distribution
function createDistribution(distribution) {
    var distr = new Object;

    if (distribution.distributionType === 'exponential') {
        distr = createExpDis(distribution)
    } else if (distribution.distributionType === 'normal') {
        distr = createNormDis(distribution)
    } else if (distribution.distributionType === 'binomial') {
        distr = createBinomialDis(distribution)
    } else if (distribution.distributionType === 'constant') {
        distr = createConstantDis(distribution)
    } else if (distribution.distributionType === 'erlang') {
        distr = createErlangDis(distribution)
    } else if (distribution.distributionType === 'triangular') {
        distr = createTrianDis(distribution)
    } else if (distribution.distributionType === 'poisson') {
        distr = createPoissonDis(distribution)
    } else if (distribution.distributionType === 'uniform') {
        distr = createUniformDis(distribution)
    } else if (distribution.distributionType === 'arbitryFinite') {
        distr = createArbFinDis(distribution)
    }
    return distr;
}

function createExpDis(distribution) {
    var distr = new Object;

    distr.mean = distribution.values.find(v => v.id == 'mean').value

    return distr;
}

function createNormDis(distribution) {
    var distr = new Object;

    distr.mean = distribution.values.find(v => v.id == 'mean').value
    distr.standardDeviation = Math.sqrt(distribution.values.find(v => v.id === 'variance').value)

    return distr;
}

function createBinomialDis(distribution) {
    var distr = new Object;

    distr.probability = distribution.values.find(v => v.id == 'probability').value
    distr.amount = distribution.values.find(v => v.id == 'amount').value

    return distr;
}

function createConstantDis(distribution) {
    var distr = new Object;
    distr.constantValue = distribution.values.find(v => v.id == 'constantValue').value

    return distr;
}

function createErlangDis(distribution) {
    var distr = new Object;

    distr.order = distribution.values.find(v => v.id == 'order').value
    distr.mean = distribution.values.find(v => v.id == 'mean').value

    return distr;
}

function createTrianDis(distribution) {
    var distr = new Object;

    distr.lower = distribution.values.find(v => v.id == 'lower').value
    distr.peak = distribution.values.find(v => v.id == 'peak').value
    distr.upper = distribution.values.find(v => v.id == 'upper').value

    return distr;
}

function createPoissonDis(distribution) {
    var distr = new Object;

    distr.mean = distribution.values.find(v => v.id == 'mean').value

    return distr;
}

function createUniformDis(distribution) {
    var distr = new Object;

    distr.lower = distribution.values.find(v => v.id == 'lower').value
    distr.upper = distribution.values.find(v => v.id == 'upper').value

    return distr;
}

function createArbFinDis(distribution) {    //to modify if necessary
    var distr = new Object;
    distr.entry = distribution.values.map(entry => ({
        value : entry.value,
        frequency : entry.frequency || 1, //TODO portal currently does not produce frequencies
    }));
    return distr;
}

// reformat timeunits from SimuBridge format to Scylla's format
function getTimeUnit(timeUnit) {
    return {
        [TimeUnits.SECONDS] : 'SECONDS',
        [TimeUnits.MINUTES] : 'MINUTES',
        [TimeUnits.HOURS] : 'HOURS'
    }[timeUnit];
}
