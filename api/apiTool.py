import json

from flask import Flask, request
from flask_restful import Resource, Api, abort

app = Flask("ToolAPI")
api = Api(app)

# example request:
# curl --location --request PUT 'http://127.0.0.1:5000/storedData/data3' \
# --header 'Content-Type: application/json' \
# --data-raw '{"key1": "someKey"}'


with open('storedData.json', 'r') as r:
    storedData = json.load(r)


def write_changes_to_file():
    with open('storedData.json', 'w') as w:
        json.dump(storedData, w)


class OurData(Resource):

    def get(self, data_id):
        if data_id == "all":
            print("This is a GET request. Instead of printing we could do sth else")
            return storedData
        if data_id not in storedData:
            print("This is a GET request. Instead of printing we could do sth else")
            abort(404, message=f"Data {data_id} not found!")
        print("This is a GET request. Instead of printing we could do sth else")
        return storedData[data_id]

    def put(self, data_id):
        data_from_request = request.data.decode('UTF-8')
        json_object = json.loads(data_from_request)
        new_data = {'key1': json_object['key1']}
        storedData[data_id] = new_data
        write_changes_to_file()
        print("This is a PUT request. Instead of printing we could do sth else")
        return {data_id: storedData[data_id]}, 201

    def delete(self, data_id):
        if data_id not in storedData:
            abort(404, message=f"Data {data_id} not found!")
        del storedData[data_id]
        write_changes_to_file()
        print("This is a DELETE request. Instead of printing we could do sth else")
        return "", 204


class DataOverview(Resource):

    def get(self):
        print("This is a GET request. Instead of printing we could do sth else")
        return storedData

    def post(self):
        data_from_request = request.data.decode('UTF-8')
        json_object = json.loads(data_from_request)
        new_data = {'key1': json_object['key1']}
        data_id = 'data' + str(max(int(v.lstrip('data')) for v in storedData.keys()) + 1)
        storedData[data_id] = new_data
        write_changes_to_file()
        print("This is a POST request. Instead of printing we could do sth else")
        return storedData[data_id], 201


api.add_resource(OurData, '/storeddata/<data_id>')
api.add_resource(DataOverview, '/storeddata')

if __name__ == '__main__':
    app.run(port=5000, debug=True)
