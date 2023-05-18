from os.path import isfile, join
from flask import Flask, request, send_file
from flask_restful import Resource, Api
from flask_cors import CORS
import subprocess
import os
import shutil
import sys
import time


# Usage: send Post request to scyllaapi endpoint like this:
# curl --location 'http://127.0.0.1:8080/scyllaapi' \
# --header 'projectid: <enter Project ID here>' \
# --form 'bpmn=@"<path to BPMN file>"' \
# --form 'param=@"<path to .json Parameter-file>"'

# for example:
# curl --location 'http://127.0.0.1:8080/scyllaapi' \
# --header 'projectid: 123' \
# --form 'bpmn=@"/C:/Users/andre/github/Scylla-container/requestData/pizza_1.bpmn"' \
# --form 'param=@"/C:/Users/andre/github/Scylla-container/requestData/pizza1.json"'

#TODO react to cancellation

# helper functions:
def fileInDirectory(my_dir: str):
    return [f for f in os.listdir(my_dir) if isfile(join(my_dir, f))]


def listCompare(beforeList: list, afterList: list):
    return [x for x in afterList if x not in beforeList]


def inDirectory(myDir: str):
    return [x for x in os.listdir(myDir)]


def runScylla(projectDir : str):
        globConfig = ''
        simConfig = ''
        bpmn = ''

        # input of Scylla <- output of Scylla Converter:
        for f in inDirectory(projectDir):
            if f.endswith('Global.xml'):
                globConfig = os.path.join(projectDir, f)
            elif f.endswith('Sim.xml'):
                simConfig = os.path.join(projectDir, f)
            elif f.endswith('.bpmn'):
                bpmn = os.path.join(projectDir, f)

        # run Scylla: #LB: Just give the output folder as parameter to scylla ...
        beforeList = inDirectory(projectDir)
        run_scylla_command = 'java -jar ../scylla/target/scylla-0.0.1-SNAPSHOT.jar --config=' + globConfig + ' --bpmn=' + bpmn + ' --sim=' + simConfig + ' --enable-bps-logging'
        print(run_scylla_command)
        process = subprocess.Popen(run_scylla_command.split(), stdout=subprocess.PIPE)
        output, errors = process.communicate()
        console = output.decode('utf-8')
        afterList = inDirectory(projectDir)


        # new folder created from Scylla:
        newInDir = listCompare(beforeList, afterList)
        if len(newInDir) == 0:
            raise Exception("No output folders created by scylla!")
        elif len(newInDir) == 1:
            newScyllaOutFolder = newInDir.pop()
        else:
            raise Exception("More folders than one created by scylla!")
        
        return (console, newScyllaOutFolder)

def runConverter(projectDir, paramFile):
    # build file_path_and_name for Converter
    convInputFile = os.path.join('..', projectDir, paramFile)
    converterPath = os.path.join('scyllaConverter', 'ConvertMain.js')

    # run converter
    run_converter_command = "node " + converterPath + " " + convInputFile + " " + projectDir
    print(run_converter_command)
    subprocess.call(run_converter_command, shell=True)


# define Api
app = Flask("ToolAPI")
CORS(app)
api = Api(app)

# this is the functionality of the Scylla-Api-endpoint to PetriSim


class ScyllaApi(Resource):
    def get(self):
        print(
            "This is a GET request. Please use a POST instead to get scylla output from PetriSim input. See request form in repo readme")
        return 201


    def post(self):

        # get projectID from header and create project Directory:
        if 'projectid' in request.headers and request.headers['projectid'] != '':
            projectID = request.headers['projectid']
        else:
            return 'please define header projectid: <enter Project ID>'
        if projectID in inDirectory('projects'):
            return ("ProjectID exists already. Please choose different ID")
        projectDir = os.path.join('projects', projectID)
        os.mkdir(projectDir)

        # save BPMN and Parameter file from request:
        if 'bpmn' in request.files and request.files['bpmn'] != '':  # and request.headers['projectid'] != '':
            bpmn = request.files['bpmn']
        else:
            return 'please attach bpmn: <Path to bpmn>'

        if 'param' in request.files and request.files['param'] != '':  # and request.headers['projectid'] != '':
            param = request.files['param']
        else:
            return 'please attach param: <Path to parameter file>'
        if not bpmn.filename.endswith('.bpmn'):
            return 'please attach a .bpmn file'
        if not param.filename.endswith('.json'):
            return 'please attach a .json file'
        bpmn.save(os.path.join(projectDir, bpmn.filename))
        param.save(os.path.join(projectDir, param.filename))

        runConverter(projectDir, param.filename)
        (console, newScyllaOutFolder) = runScylla(projectDir)

        # get filenames created from Scylla:
        newScyllaFiles = fileInDirectory(join(projectDir, newScyllaOutFolder))

        print('These are the Scylla simulation output: ' + str(newScyllaFiles))

        return {
            "message": console,
            "files": list(map(lambda fileName: { "name": fileName, 'data' : open(join(projectDir, newScyllaOutFolder, fileName)).read(), 'type': 'xml'}, newScyllaFiles))
        } 


api.add_resource(ScyllaApi, '/scyllaapi')  # endpoint to PetriSim

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(port=port, host='0.0.0.0', debug=True) 
