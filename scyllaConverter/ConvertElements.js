/**
 * In this file: Conversion of the smallest elements:
 * tasks, timetables, resources, gateways, events,
 * duration, interarrivalTime and
 * Distribution
 *
 */

module.exports = {

    // creates all resources, calls function to create a single resource
    createResources: function (resources) {
        ress = new Array;
        for (let j in resources) {
            ress.push(createOneRes(resources[j]));
        }
        return ress;

    },
    // creates all timetables, calls function to create a single timetable
    createTimeTables: function (timeTables) {
        timetables = new Array;
        for (let j in timeTables) {
            timetables.push(createOneTimeTable(timeTables[j]));
        }

        return timetables;
    },

    // creates all tasks, calls function to create a single task
    createTasks: function (obj) {
        tasks = new Array;
        for (let taskIndex in obj) {
            tasks.push(createOneTask(obj[taskIndex]));
        }
        return tasks;
    },

    // creates all gateways, calls function to create a single gateway
    createGateways: function (obj, gatewayType) {
        gateways = new Array;
        for (let index in obj) {
            if (obj[index].type.split(':')[1] == gatewayType)
                gateways.push(createOneGateway(obj[index]));
        }
        return gateways;

    },

    // creates all events, calls function to create a single event
    createEvents: function (obj, eventType) {
        events = new Array;
        for (let index in obj) {
            if (obj[index].type.split(':')[1] == eventType)
                events.push(createOneEvent(obj[index]));
        }
        return events;

    },

    // makes getTimeUnit function accessible from other files
    getScenTimeUnit: function (timeUnit) {
        return (getTimeUnit(timeUnit))
    }
}

// creates a single resource
function createOneRes(resource) {
    var res = new Object;
    var attributes = new Object;

    attributes.id = resource.id
    attributes.defaultCost = resource.costHour
    attributes.defaultQuantity = resource.numberOfInstances;

    res._attributes = attributes;
    return res;
}

// creates a single task
function createOneTask(activity) {
    var task = new Object;
    var attributes = new Object;
    var resource = new Array;
    var resources = new Object;
    attributes.id = activity.id
    attributes.name = activity.name.replaceAll('\n', ' ')
    timeUnit = activity.unit
    task.duration = createOneDuration(activity.duration, timeUnit);

    // create all resources for this task, count occurances to determine number of instances:
    for (resIndex in activity.resources) {
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
function createOneGateway(gateway, probabilities) {

    var gw = new Object;
    var attributes = new Object;

    attributes.id = gateway.id

    // assign outgoing flows and their correponding probabilities to gateway:
    outgoing = new Array;
    for (let i in gateway.outgoing) {
        outgoing[i] = createOutGoing(gateway.outgoing[i], probabilities);
    }

    gw.outgoingSequenceFlow = outgoing;
    gw._attributes = attributes;
    return gw;

}

// creates a single event
function createOneEvent(event) {

    var ev = new Object;
    var attributes = new Object;

    attributes.id = event.id
    timeUnit = event.unit
    ev.arrivalRate = createOneArrivalRate(event.interArrivalTime, timeUnit);
    ev._attributes = attributes;
    return ev;

}

// creates one outgoing flow and its corresponding probability
function createOutGoing(outFlow, probabilities) {
    var outf = new Object;
    var attributes = new Object;
    attributes.id = (outFlow);
    for (let id in probabilities) {
        if (id == outFlow) {
            outf.branchingProbability = probabilities[id];
        }
    }

    outf._attributes = attributes;
    return outf;
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

// creates a duration:
function createOneDuration(duration, timeUnit) {
    var dur = new Object;
    var attributes = new Object;
    attributes.timeUnit = getTimeUnit(timeUnit);
    disType = duration.distributionType + 'Distribution';
    dur[disType] = createDistribution(duration)
    dur._attributes = attributes;
    return dur;
}

// creates an arrival rate
function createOneArrivalRate(arrivalRate, timeUnit) {
    var arr = new Object;
    var attributes = new Object;
    attributes.timeUnit = getTimeUnit(timeUnit);
    disType = arrivalRate.distributionType + 'Distribution';
    arr[disType] = createDistribution(arrivalRate)
    arr._attributes = attributes;
    return arr;
}

// creates a single timetable
function createOneTimeTable(timetable) {
    var tt = new Array;
    var attributes = new Object;

    attributes.id = timetable.id;
    for (let item in timetable.timeTableItems) {
        tt.timetableItem = createOneTimeTableItem(timetable.timeTableItems[item]);
    }

    tt._attributes = attributes;
    return tt;
}

// create one item of a timetable
function createOneTimeTableItem(timetableItem) {
    var item = new Object;
    var attributes = new Object;

    attributes.from = (timetableItem.startWeekday).toUpperCase();
    attributes.to = (timetableItem.endWeekday).toUpperCase();
    attributes.beginTime = timetableItem.startTime + ':00';
    attributes.endTime = timetableItem.endTime + ':00';

    item._attributes = attributes;
    return item;
}

// create distribution depending on type of distribution
function createDistribution(distribution) {
    var distr = new Object;

    if (distribution.distributionType == 'exponential') {
        distr = createExpDis(distribution)
    } else if (distribution.distributionType == 'normal') {
        distr = createNormDis(distribution)
    } else if (distribution.distributionType == 'binomial') {
        distr = createBinomialDis(distribution)
    } else if (distribution.distributionType == 'constant') {
        distr = createConstantDis(distribution)
    } else if (distribution.distributionType == 'erlang') {
        distr = createErlangDis(distribution)
    } else if (distribution.distributionType == 'triangular') {
        distr = createTrianDis(distribution)
    } else if (distribution.distributionType == 'poisson') {
        distr = createPoissonDis(distribution)
    } else if (distribution.distributionType == 'uniform') {
        distr = createUniformDis(distribution)
    } else if (distribution.distributionType == 'arbitryFinite') {
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
    distr.standardDeviation = Math.sqrt(distribution.values.find(v => v.id == 'variance').value)

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

    distr.lower = distribution.values.find(v => v.id == 'lower').value
    distr.upper = distribution.values.find(v => v.id == 'upper').value

    return distr;
}

// reformat Timeout from PetriSim format to Scylla's format; currently these two available in PetriSim
function getTimeUnit(timeUnit) {
    if (timeUnit == 'mins') {
        return 'MINUTES'
    } else if (timeUnit == 'secs') {
        return 'SECONDS'
    }

}
