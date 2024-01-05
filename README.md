# Scylla-Container
This repository provides a containerization and http-api for the [Scylla Business Process Simulator](https://github.com/bptlab/scylla).

<!-- ## :technologist: Getting started -->

<!-- ## :star: Run with Docker from Github :star:

1) pull Docker image from Github:

```console
docker pull ghcr.io/TODO/scylla-container:main
```

2) Send a http POST request (Please follow the steps at the "send a http POST request" section at the bottom) -->

## How to run the API

### 1) Clone the repository

```console
git clone --recurse-submodules git@github.com:INSM-TUM/Scylla-Container.git
```

### 2) Navigate into the project directory

```console
cd Scylla-container
```

### 3a) Run it with docker

The easiest way to run the Scylla http-api is to use the containerization also provided with this repo.

#### Build 📦️ Docker image

First, build the Docker image using the Dockerfile. From the project directory, in the terminal, call 

```console
docker build -t scylla-container:1.0.0 .
```

This will get all the dependencies and set up the Docker image called `simulation-bridge`.


#### Run 📦️ Docker Container

After the Docker image is created, the Scylla http-api can be executed by running

```console
docker run -it -p 8080:8080 scylla-container:1.0.0
```
This instantiates the created image and exposes the api port 8080. 

### 3b) Run without docker (recommended only for development)

To run the api without docker, Maven and Python 3 need to be installed. We also recommend to use a virtual environment to handle Python dependencies.

#### Install dependencies
To install the Python dependencies, run the following in the repository root folder:

```console
pip install -r requirements.txt
```

To also install Scylla, navigate to the Scylla submodule folder and run
```console
mvn package -DskipTests
```

Note that there should now be a `scylla<version>.jar` in the `scylla/target` folder. Remember the exact filename.

#### Run API
Then, to start the api, go back to the repository root folder and call
```console
python3 ScyllaApi.py ./scylla/target/<scylla-jar-filename>
```
The api is then running on the default port 8080.


### 4)  Use the API by sending a http POST request

#### Request structure
As can be seen in the main [api file](./ScyllaApi.py), the api provides an http-post endpoint to synchronously start simulation runs. These request need to include the following information: 
- A `requestId` as part of the header
- A `bpmn` process model file in bpmn xml format, as part of the request form-data files
- A `globalConfig` global simulation configuration file in xml format, as part of the request form-data files
- A `simConfig` process specific simulation configuration file in xml format, as part of the request form-data files

Once the simulation is finished, the request returns a `message` that contains the console output, and all `files` created by Scylla.

Details on the Scylla inputs and outputs can be found in the Scylla project documentation.

<!-- #### Sample input files:
In folder _requestData_ there are sample files to simulate a request from SimuBridge: 
  - BPMN-File: _pizza_1.bpmn_
  - Parameter-File: _pizza1.json_ -->

  
#### Example Request using Curl:

```console
curl --location 'http://127.0.0.1:8080/scyllaapi' \
--header 'requestId: request123' \
--form 'bpmn=@"./scylla/samples/p2_normal.bpmn"' \
--form 'simConfig=@"./scylla/samples/p2_normal_sim.xml"' \
--form 'globalConfig=@"./scylla/samples/p0_globalconf.xml"'
```
