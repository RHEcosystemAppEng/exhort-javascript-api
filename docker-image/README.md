# Exhort Javascript API Docker Images

These dockerfiles provides all nessesary components to generate images for Red Hat Dependency Analytics (RHDA). 
These images can be used as base images to set up the necessary environment and dependencies for running the Red Hat Dependency Analytics.

## Prerequisites
Before getting started, ensure that you have one of the following prerequisites installed on your system:

- Docker: [Installation Guide](https://docs.docker.com/get-docker/)
- Podman: [Installation Guide](https://podman.io/docs/installation)

Both Docker and Podman are container runtimes that can be used to build and run the Red Hat Dependency Analytics images. You can choose either Docker or Podman based on your preference and the compatibility with your operating system.

## Images generated for Exhort Javascript API

Ecosystem                     | Version                                                            | IMAGE                                           | TAG               | 
------------------------------| ------------------------------------------------------------------ | ----------------------------------------------- |-------------------|
Maven & NPM                   | mvn 3.9.4, <br>npm 9.5.0                                           |  quay.io/ecosystem-appeng/exhort-javascript-api | 0.7.0-alpha       |
Maven, NPM, Golang & Python   | mvn 3.9.4, <br>npm 9.5.0, <br>go 1.21.1, <br>python3 3.9.16, <br>pip3 21.2.3                                                                                                  |  quay.io/ecosystem-appeng/exhort-javascript-api | 0.7.3-alpha       |
