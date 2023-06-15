FROM maven:latest as setup

RUN apt-get update \
    && apt-get install -y python3 python3-pip


FROM maven:latest as installScylla

COPY ./scylla /app/scylla
# Install Scylla and requirements
WORKDIR /app/scylla
RUN mvn package -DskipTests

# Remove everything except things needed to run
RUN find . -mindepth 1 -maxdepth 1 ! -name 'plugins' ! -name 'target' -exec rm -r {} +
RUN cp ./target/*.jar .
RUN cp -r ./target/libs .
RUN rm -r target
RUN mv *.jar scylla.jar


FROM setup as install
WORKDIR /app/
COPY . /app
RUN rm -r scylla

# Install python requirements
RUN pip install -r requirements.txt

# Get scylla from previous stage
COPY --from=installScylla /app/scylla /app/scylla


FROM install as run
# show port 8080 to the outside world
EXPOSE 8080

# run the Flask listener on port 8080
CMD ["python3", "ScyllaApi.py", "./scylla/scylla.jar"]
