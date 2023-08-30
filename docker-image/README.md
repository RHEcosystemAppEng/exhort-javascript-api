# Exhort Javascript API Docker Images

These dockerfiles provides all nessesary components to generate images for Red Hat Dependency Analysis (RHDA). 
These images can be used as base images to set up the necessary environment and dependencies for running the Red Hat Dependency Analysis.

## Prerequisites
Before getting started, ensure that you have one of the following prerequisites installed on your system:

- Docker: [Installation Guide](https://docs.docker.com/get-docker/)
- Podman: [Installation Guide](https://podman.io/docs/installation)

Both Docker and Podman are container runtimes that can be used to build and run the Red Hat Dependency Analysis images. You can choose either Docker or Podman based on your preference and the compatibility with your operating system.

## Images generated for Exhort Javascript API

Ecosystem     | Version                                                            | IMAGE                                           | TAG               | 
------------- | ------------------------------------------------------------------ | ----------------------------------------------- |-------------------|
Maven & NPM   | maven 3.9.4, <br>npm 9.5.0                                         |  quay.io/ecosystem-appeng/exhort-javascript-api | 1.0-alpha         |
