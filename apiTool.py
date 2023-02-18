import json
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

#for example
# curl --location 'http://127.0.0.1:5000/scyllaapi?=newtitle' \
# --header 'projectid: testproject' \
# --form 'bpmn=@"/C:/Users/andre/Desktop/pizza_1.bpmn"' \
# --form 'param=@"/C:/Users/andre/Desktop/pizza1.json"'


def fileInDirectory(my_dir: str):
    return [f for f in os.listdir(my_dir) if isfile(join(my_dir, f))]

def listCompare(beforeList: list, afterList: list):
    return [x for x in afterList if x not in beforeList]

def inDirectory(myDir: str):
    return [x for x in os.listdir(myDir)]


app = Flask("ToolAPI")
api = Api(app)


class Test(Resource):
# this is a test class for debugging and testing
    def post(self):
        #keys = request.files.keys()
        projectID = request.headers['projectID']
        projectDir = os.path.join('projects', projectID)
        os.mkdir(projectDir)
        bpmn = request.files['bpmn']
        bpmn.save(os.path.join(projectDir, bpmn.filename))
        param = request.files['param']
        param.save(os.path.join(projectDir, param.filename))
        # for file in files:
        #     file.save(os.path.join('projects', file.filename))

        #data_from_request = request.files[name]
        # with open(os.path.join('/path/to/Documents', completeName), "w") as file1:
        #     toFile = raw_input("Write what you want into the field")
        #     file1.write(toFile)
        return 201


class DataFromPetriSim(Resource):
# this is the functionality of the Scylla-Api-endpoint to PetriSim
    def get(self):
        print("This is a GET request. Instead of printing we could do sth else")
        return 201

    def post(self):

        # get projectID from header and create project Directory:
        projectID = request.headers['projectID']
        projectDir = os.path.join('projects', projectID)
        os.mkdir(projectDir)

        # save BPMN and Parameter file from request
        bpmn = request.files['bpmn']
        bpmn.save(os.path.join(projectDir, bpmn.filename))
        param = request.files['param']
        param.save(os.path.join(projectDir, param.filename))

        # build file_path_and_name for Converter
        convInputFile = os.path.join('..', projectDir, param.filename)

        # run converter
        subprocess.call("node scyllaConverter/ConvertMain.js " + convInputFile + " " + projectDir, shell=True)

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

        print(newScyllaFiles)

        print("This is a POST request. Instead of printing we could do sth else")

        return send_file('projects/testp/pizza_1.bpmn', as_attachment=True) # TODO: return several files to PetriSim


api.add_resource(DataFromPetriSim, '/scyllaapi') #endpoint to PetriSim
api.add_resource(Test, '/test') #for testing

if __name__ == '__main__':
    app.run(port=5000, debug=True)
