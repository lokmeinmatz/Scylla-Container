import json
from os.path import isfile, join

from flask import Flask, request, send_file
from flask_restful import Resource, Api, abort
import subprocess
from datetime import datetime
import os


def fileInDirectory(my_dir: str):
    return [f for f in os.listdir(my_dir) if isfile(join(my_dir, f))]

def listCompare(beforeList: list, afterList: list):
    return [x for x in afterList if x not in beforeList]


def inDirectory(myDir: str):
    return [x for x in os.listdir(myDir)]


app = Flask("ToolAPI")
api = Api(app)


# example request:
# curl --location --request PUT 'http://127.0.0.1:5000/storedData/data3' \
# --header 'Content-Type: application/json' \
# --data-raw '{"key1": "someKey"}'






class DataOverview(Resource):

    def get(self):
        print("This is a GET request. Instead of printing we could do sth else")
        return 201

    def post(self):
        data_from_request = request.data.decode('UTF-8')
        #json_object = json.loads(data_from_request)

        # create project directory:
        #projectDir = os.path.join('projects',str(datetime.now()).replace(" ", "T").replace(':', '_'))  #TODO activate those two lines
        #os.mkdir(projectDir)

        projectDir = os.path.join('projects', 'testp')  # TODO: deactivate

        newFile = open(os.path.join(projectDir,"pizza_1.json"), "x") # TODO: getName from request
        newFile.write(data_from_request)
        newFile.close()

        # get filename for file from PetriSim
        for f in inDirectory(projectDir):
            if f.endswith('.json'):
                convInputFile = os.path.join('..', projectDir, f)

        # run converter
        subprocess.call("node scyllaConverter/ConvertMain.js " + convInputFile + " " + projectDir, shell=True)

        # input of Scylla <- output of Scylla Converter:
        for f in inDirectory(projectDir):
            if f.endswith('.bpmn'):
                bpmn = os.path.join('..', projectDir, f)
            elif f.endswith('Global.xml'):
                globConfig = os.path.join('..', projectDir, f)
            elif f.endswith('Sim.xml'):
                simConfig = os.path.join('..', projectDir, f)

        # run Scylla:
        beforeList = inDirectory(projectDir)
        subprocess.call(['bash', "ScyllaScript2.sh", '--config=' + globConfig, '--bpmn=' + bpmn, '--sim=' + simConfig])
        afterList = inDirectory(projectDir)

        # new folder created from Scylla:
        newInDir = listCompare(beforeList, afterList)

        if len(newInDir) == 1:
            newScyllaOutFolder = newInDir.pop()
        else:
            raise Exception("More folders than one created by scylla!")

        # get filenames created from Scylla:
        newScyllaFiles = fileInDirectory(join(projectDir, newScyllaOutFolder))

        print(newScyllaFiles)  # TODO: return to PetriSim
        # def write_changes_to_file():
        #    with open('storedData.json', 'w') as w:
        #        json.dump(storedData, w)
        #

        print("This is a POST request. Instead of printing we could do sth else")
        # start converter with body from request
        files = {'file1': open('hello.py', 'rb'), 'file2': open('hello2.py', 'rb')}
        #return str(open(os.path.join(projectDir,"pizza_1.json"), "r"))
        return send_file() or send_from_directory



api.add_resource(DataOverview, '/storeddata')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
