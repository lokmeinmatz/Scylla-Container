# Scylla-container
This repository contains the components of the Scylla container.

This version is functioning only as docker image, not from source code.
It consists of:
- Scylla Simulator (https://github.com/bptlab/scylla)
- A data converter from PetriSim parameters to Scylla global and simulation configuration
- The API which provides an endpoint to the functionality of this container

The parameter and bpmn file from PetriSim is sent to the endpoint of the server of this container.
The server then returns the simulation output of Scylla.


## :technologist: Getting started

## :star: Run with Docker Download from Github :star:

### pull 📦️ Docker image

This option is to pull Docker image from Github:

```console
docker pull ghcr.io/petrisim/scylla-container:main
```

## Run from source

### build 📦️ Docker image

Following instructers briefly explains the steps required to start the Flask listener in a Scylla Docker container :
(assuming you compile scylla successfully, using Apache Maven)

First, build the Docker image using the Dockerfile. From same directory, in the terminal, call 

```console
docker build -t apiTool .
```

This will get Linux, Java, python and all the dependencies and set up the Docker image called apiTool for later use


### Run 📦️ Docker Container

After the Docker image is created, run

```console
docker run -p 8000:8000 -d apiTool'
```
This runs the created image and exposes port 8000 for the Flask listener.

You can use 'sudo docker ps' to see it's tag and 'docker logs <container-tag>' to check what it prints. 


## Sending a http POST request

#### Sample input files:
In folder _requestData_ there are sample files to simulate a request from PetriSim: 
  - BPMN-File: _pizza_1.bpmn_
  - Parameter-File: _pizza1.json_


#### With Postman:
  - choose endpoint: http://127.0.0.1:8080/scyllaapi
  - define header _projectid: your_project_ID_
  - send output from PetriSim in body as _form-data_ each:
    - `bpmn=@"path-to_BPMN_file"`
    - `param=@"path-to_.json_Parameter_file"`

#### The same request with curl:

```console
curl --location 'http://127.0.0.1:8080/scyllaapi' \
--header 'projectid: your_projectID' \
--form 'bpmn=@"path-to_BPMN_file"' \
--form 'param=@"path-to_.json_Parameter_file"'  
```
  
#### for example:

```console
curl --location 'http://127.0.0.1:8080/scyllaapi' \
--header 'projectid: 123' \
--form 'bpmn=@"/C:/Users/user1/github/Scylla-container/requestData/pizza_1.bpmn"' \
--form 'param=@"/C:/Users/user1/github/Scylla-container/requestData/pizza1.json"'
```

### Returned files to Client
zipped Scylla output files

### 
