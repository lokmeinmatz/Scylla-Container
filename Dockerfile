FROM maven:latest as setup
# GET Python for later cached
RUN apt-get update \
    && apt-get install -y python3 python3-pip


# TODO dockerfile: pull scylla
# get Linux
FROM setup as install
WORKDIR /app/
COPY . /app

# Install python requirements
RUN pip install -r requirements.txt

# Install Scylla and requirements
WORKDIR /app/scylla
RUN mvn clean package -DskipTests
WORKDIR /app/


FROM install as cleanup

# Remove everything except things needed to run
WORKDIR /app/scylla
RUN find . -mindepth 1 -maxdepth 1 ! -name 'plugins' ! -name 'target' -exec rm -r {} +
RUN cp ./target/*.jar .
RUN cp -r ./target/libs .
RUN rm -r target
WORKDIR /app/


FROM cleanup as run
# show port 8080 to the outside world
EXPOSE 8080

# run the Flask listener on port 8080
CMD ["python3", "apiTool.py"]
