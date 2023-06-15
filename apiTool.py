from os.path import isfile, join
from flask import Flask, request, send_file
from flask_restful import Resource, Api
from flask_cors import CORS
import subprocess
import os
import shutil
import sys
import time

from werkzeug.utils import secure_filename


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


def runScylla(projectDir : str, globConfigPath, simConfigPath, bpmnPath):

        # run Scylla: #LB: Just give the output folder as parameter to scylla ...
        beforeList = inDirectory(projectDir)
        run_scylla_command = ('java -jar ./scylla/scylla-0.0.1-SNAPSHOT.jar --headless --enable-bps-logging'.split()) + ['--config=' + globConfigPath, '--bpmn=' + bpmnPath, '--sim=' + simConfigPath]
        print(' '.join(run_scylla_command))
        process = subprocess.Popen(run_scylla_command, stdout=subprocess.PIPE)
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


# define Api
app = Flask("ToolAPI")
CORS(app)
api = Api(app)

# this is the functionality of the Scylla-Api-endpoint to SimuBridge


class ScyllaApi(Resource):
    def get(self):
        print(
            "This is a GET request. Please use a POST instead to get scylla output from SimuBridge input. See request form in repo readme")
        return 201


    def post(self):
        try:
            requestsFolder = 'requests'
            if not os.path.exists(requestsFolder):
                os.makedirs(requestsFolder)
            # get requestId from header and create project Directory:
            if 'requestId' in request.headers and request.headers['requestId'] != '':
                requestId = request.headers['requestId']
            else:
                return 'please define header requestId: <enter request ID>'
            if requestId in inDirectory(requestsFolder):
                return ("requestID exists already. Please choose different ID")
            projectDir = os.path.join(requestsFolder, requestId)
            os.mkdir(projectDir)

            # save BPMN and Parameter file from request:
            if 'bpmn' in request.files and request.files['bpmn'] != '': 
                bpmn = request.files['bpmn']
            else:
                raise 'No proces model .bpmn file attached'
            
            if 'globalConfig' in request.files and request.files['globalConfig'] != '':
                globalConfig = request.files['globalConfig']
            else:
                raise 'No global simulation configuration .xml file attached'

            if 'simConfig' in request.files and request.files['simConfig'] != '':
                simConfig = request.files['simConfig']
            else:
                raise 'No model-specific simulation configuration .xml file attached'
            
            bpmnPath = os.path.join(projectDir, secure_filename(bpmn.filename))
            globalConfigPath = os.path.join(projectDir, secure_filename(globalConfig.filename))
            simConfigPath = os.path.join(projectDir, secure_filename(simConfig.filename))
            
            bpmn.save(bpmnPath)
            globalConfig.save(globalConfigPath)
            simConfig.save(simConfigPath)
            
            (console, newScyllaOutFolder) = runScylla(projectDir, globalConfigPath, simConfigPath, bpmnPath)

            # get filenames created from Scylla:
            newScyllaFiles = fileInDirectory(join(projectDir, newScyllaOutFolder))

            print('These are the Scylla simulation output: ' + str(newScyllaFiles))

            return {
                "message": console,
                "files": list(map(lambda fileName: { "name": fileName, 'data' : open(join(projectDir, newScyllaOutFolder, fileName)).read(), 'type': 'xml'}, newScyllaFiles))
            } 
        except Exception as err:
            print(err)
            return {
                "message": 'An error occured: ' + str(err)
            }, 500 


api.add_resource(ScyllaApi, '/scyllaapi')  # endpoint to SimuBridge

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(port=port, host='0.0.0.0', debug=True) 
