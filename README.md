# Scylla-container

clone repository

make sure following requirements are fullfilled:

  python
  Flask==2.2.2
  Flask-RESTful==0.3.9

  node
  xml-js (to install the xml-js package run "npm install --save xml-js" in command line)

to run Server:
  python apiTool.py

to send a http POST request:
  e.g. with Postman to endpoint: http://127.0.0.1:8080/scyllaapi
  choose header 'projectid: <enter Project ID here>'
  send output from PetriSim in body as form-data each:
    'bpmn=@"<path to BPMN file>"'
    'param=@"<path to .json Parameter-file>"'

the same request with curl:

curl --location 'http://127.0.0.1:8080/scyllaapi' \
--header 'projectid: <enter Project ID here>' \
--form 'bpmn=@"<path to BPMN file>"' \
--form 'param=@"<path to .json Parameter-file>"'

for example:
curl --location 'http://127.0.0.1:8080/scyllaapi' \
--header 'projectid: 123' \
--form 'bpmn=@"/C:/Users/andre/github/Scylla-container/requestData/pizza_1.bpmn"' \
--form 'param=@"/C:/Users/andre/github/Scylla-container/requestData/pizza1.json"'

Scylla's simulation's event logs will be returned.
