from os.path import isfile, join
from flask import Flask, request, send_file
from flask_restful import Resource, Api
import subprocess
import os
import shutil


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

# this is the functionality of the Scylla-Api-endpoint to PetriSim

       
    
class ScyllaApi(Resource):
    def get(self):

        globConfig = '/app/scylla/samples/Kreditkarte_global_1.xml'
        bpmnArg = '/app/scylla/samples/Kreditkarte_1.bpmn'
        simConfig = '/app/scylla/samples/Kreditkarte_sim_1.xml'
        run_scylla_command = 'java -cp /app/scylla/target/classes/:/app/dependencies/*:/app/scylla/lib/*:/app/* de.hpi.bpt.scylla.Scylla --config=' + globConfig + ' --bpmn=' + bpmnArg + ' --sim=' + simConfig + ' --enable-bps-logging'
        #run_scylla_command = 'java -cp /app/scylla/target/classes/:/app/dependencies/*:/app/scylla/lib/*:/app/* de.hpi.bpt.scylla.Scylla --config=/app/scylla/samples/Kreditkarte_global_1.xml --bpmn=/app/scylla/samples/Kreditkarte_1.bpmn --sim=/app/scylla/samples/Kreditkarte_sim_1.xml --enable-bps-logging'
        process = subprocess.Popen(run_scylla_command.split(), stdout=subprocess.PIPE )

        samples_content = os.listdir('/app/scylla/samples/') # when a GET request comes to the Flask listener, we run scylla and print the contents of /app/scylla/samples/ to check whether the experiment folder is created or not.
        
        return samples_content

    def post(self):

        # get projectID from header and create project Directory:
        if 'projectid' in request.headers and request.headers['projectid'] != '':
            projectID = request.headers['projectid']
        else:
            return 'please define header projectid: <enter Project ID>'
        if projectID in inDirectory('projects'):
            return ("ProjectID exists already. Please choose different ID")
        projectDir = os.path.join('projects', projectID)    #TODO: app?
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

        # build file_path_and_name for Converter
        convInputFile = os.path.join('..', projectDir, param.filename)
        converterPath = os.path.join('scyllaConverter', 'ConvertMain.js') #TODO: app?

        # run converter
        subprocess.call("node " + converterPath + " " + convInputFile + " " + projectDir, shell=True) #TODO: app?

        # input of Scylla <- output of Scylla Converter:
        for f in inDirectory(projectDir):
            if f.endswith('Global.xml'):
                globConfig = os.path.join(projectDir, f)     #TODO: '..' or 'app' or nothing
            elif f.endswith('Sim.xml'):
                simConfig = os.path.join(projectDir, f)      #TODO: '..' or 'app' or nothing
        bpmnArg = os.path.join(projectDir, bpmn.filename)    #TODO: '..' or 'app' or nothing


        # run Scylla:
        beforeList = inDirectory(projectDir)
        print('projectDir: ' + projectDir)
        print('contains: ' + str(beforeList))
        #subprocess.call('java -cp "scylla-dev_ui/target/classes;./dependencies/*;lib/*;*" de.hpi.bpt.scylla.Scylla --config=' + globConfig + ' --bpmn=' + bpmnArg + ' --sim=' + simConfig + ' --enable-bps-logging')
        run_scylla_command = 'java -cp /app/scylla/target/classes/:/app/dependencies/*:/app/scylla/lib/*:/app/* de.hpi.bpt.scylla.Scylla --config=' + globConfig + ' --bpmn=' + bpmnArg + ' --sim=' + simConfig + ' --enable-bps-logging'
        process = subprocess.Popen(run_scylla_command.split(), stdout=subprocess.PIPE )
        # run_scylla_command = 'java -cp /scylla-dev_ui/target/classes/:/dependencies/*:/scylla-dev_ui/lib/*:* de.hpi.bpt.scylla.Scylla --config=/scylla-dev_ui/samples/Kreditkarte_global_1.xml --bpmn=/scylla-dev_ui/samples/Kreditkarte_1.bpmn --sim=/scylla-dev_ui/samples/Kreditkarte_sim_1.xml --enable-bps-logging'
        # process = subprocess.Popen(run_scylla_command.split(), stdout=subprocess.PIPE )
        afterList = inDirectory(projectDir)
        print('projectDir: ' + projectDir)
        print('contains: ' + str(afterList))

        # new folder created from Scylla:
        newInDir = listCompare(beforeList, afterList)
        if len(newInDir) == 0:
            raise Exception("No output folders created by scylla!")
        elif len(newInDir) == 1:
            newScyllaOutFolder = newInDir.pop()
        else:
            raise Exception("More folders than one created by scylla!")

        # get filenames created from Scylla:
        newScyllaFiles = fileInDirectory(join(projectDir, newScyllaOutFolder))

        print('These are the Scylla simulation output: ' + str(newScyllaFiles))

        # zip scylla output files:
        zipFormat = 'zip'
        zipName = join(projectDir, projectID + 'ScyllaRes')
        shutil.make_archive(zipName, zipFormat, (join(projectDir, newScyllaOutFolder)))

        # send all scylla output files zipped:
        return send_file(zipName + "." + zipFormat,
                         as_attachment=True)

        # only send event logs:
        for x in inDirectory(os.path.join(projectDir, newScyllaOutFolder)):
            if (x.endswith('.xes')):
                logsFileName = x
        logsPathAndName = os.path.join(projectDir, newScyllaOutFolder, logsFileName)
        return send_file(logsPathAndName,
                         as_attachment=True)  # TODO: which return?


api.add_resource(ScyllaApi, '/scyllaapi')  # endpoint to PetriSim

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(port=port, host='0.0.0.0', debug=True) 
