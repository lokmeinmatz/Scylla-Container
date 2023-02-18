from os.path import isfile, join
from flask import Flask, request, send_file
from flask_restful import Resource, Api
import subprocess
import os

# Usage: send Post request to scyllaapi endpoint like this:
# curl --location 'http://127.0.0.1:5000/scyllaapi?=newtitle' \
# --header 'projectid: <enter Project ID here>' \
# --form 'bpmn=@"<path to BPMN file>"' \
# --form 'param=@"<path to .json Parameter-file>"'

#for example:
# curl --location 'http://127.0.0.1:5000/scyllaapi?=newtitle' \
# --header 'projectid: testproject' \
# --form 'bpmn=@"/C:/Users/andre/Desktop/pizza_1.bpmn"' \
# --form 'param=@"/C:/Users/andre/Desktop/pizza1.json"'


# helper functions:
def fileInDirectory(my_dir: str):
    return [f for f in os.listdir(my_dir) if isfile(join(my_dir, f))]

def listCompare(beforeList: list, afterList: list):
    return [x for x in afterList if x not in beforeList]

def inDirectory(myDir: str):
    return [x for x in os.listdir(myDir)]

# define Api
app = Flask("ToolAPI")
api = Api(app)

# this is a test class for debugging and testing:
class Test(Resource):
    def post(self):
        projectID = request.headers['projectID']
        projectDir = os.path.join('projects', projectID)
        os.mkdir(projectDir)
        bpmn = request.files['bpmn']
        bpmn.save(os.path.join(projectDir, bpmn.filename))
        param = request.files['param']
        param.save(os.path.join(projectDir, param.filename))
        return 201

# this is the functionality of the Scylla-Api-endpoint to PetriSim
class ScyllaApi(Resource):
    def get(self):
        print("This is a GET request. Please use a POST instead to get scylla output from PetriSim input. See request form in repo readme")
        return 201

    def post(self):

        # get projectID from header and create project Directory:
        if 'projectid' in request.headers and request.headers['projectid'] != '':
            projectID = request.headers['projectid']
        else:
            return 'please define header projectid: <enter Project ID>'
        if projectID in inDirectory('projects'):
            return("ProjectID exists already. Please choose different ID")
        projectDir = os.path.join('projects', projectID)
        os.mkdir(projectDir)

        # save BPMN and Parameter file from request
        if 'bpmn' in request.files: # and request.headers['projectid'] != '':
            bpmn = request.files['bpmn']
        else:
            return 'please attach bpmn: <Path to bpmn>'

        if 'param' in request.files: # and request.headers['projectid'] != '':
            param = request.files['param']
        else:
            return 'please attach param: <Path to parameter file>'

        bpmn.save(os.path.join(projectDir, bpmn.filename))
        param.save(os.path.join(projectDir, param.filename))

        # build file_path_and_name for Converter
        convInputFile = os.path.join('..', projectDir, param.filename)

        converterPath = os.path.join('scyllaConverter', 'ConvertMain.js')
        # run converter
        #subprocess.call("node " + converterPath + " " + convInputFile + " " + projectDir, shell=True)
        subprocess.call(['bash', "ConvScript.sh", convInputFile, projectDir])

        # input of Scylla <- output of Scylla Converter:
        for f in inDirectory(projectDir):
            if f.endswith('Global.xml'):
                globConfig = os.path.join('..', projectDir, f)
            elif f.endswith('Sim.xml'):
                simConfig = os.path.join('..', projectDir, f)
        bpmnArg = os.path.join('..', projectDir, bpmn.filename)

        # run Scylla:
        beforeList = inDirectory(projectDir)
        subprocess.call(['bash', "ScyllaScript2.sh", '--config=' + globConfig, '--bpmn=' + bpmnArg, '--sim=' + simConfig])
        afterList = inDirectory(projectDir)

        # new folder created from Scylla:
        newInDir = listCompare(beforeList, afterList)
        if len(newInDir) == 1:
            newScyllaOutFolder = newInDir.pop()
        else:
            raise Exception("More folders than one created by scylla!")

        # get filenames created from Scylla:
        newScyllaFiles = fileInDirectory(join(projectDir, newScyllaOutFolder))

        print('These are the Scylla simulation output: '+ str(newScyllaFiles))
        for x in inDirectory(os.path.join(projectDir, newScyllaOutFolder)):
            if (x.endswith('.xes')):
                logsFileName = x
        logsPathAndName = os.path.join(projectDir, newScyllaOutFolder, logsFileName)
        return send_file(logsPathAndName, as_attachment=True) # TODO: return several files to PetriSim not only the Event Logs


api.add_resource(ScyllaApi, '/scyllaapi') #endpoint to PetriSim
api.add_resource(Test, '/test') #for testing

if __name__ == '__main__':
    app.run(port=8080, debug=True)
