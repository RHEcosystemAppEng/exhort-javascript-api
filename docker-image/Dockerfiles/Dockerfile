# first stage
FROM registry.access.redhat.com/ubi9/nodejs-18 as builder

# use privilaged user
USER root

# assign token for reading packages from github package registry
ARG GITHUB_PACKAGE_REGISTRY_ACCESS_TOKEN=''

# install Java
RUN curl -kL https://download.oracle.com/java/20/latest/jdk-20_linux-x64_bin.tar.gz -o /tmp/java-package.tar.gz \
    && tar xvzf /tmp/java-package.tar.gz -C /usr/

# install Maven package manager
RUN curl -kL https://dlcdn.apache.org/maven/maven-3/3.9.4/binaries/apache-maven-3.9.4-bin.tar.gz -o /tmp/maven-package.tar.gz \
    && tar xvzf /tmp/maven-package.tar.gz -C /usr/

# install go package manager
RUN curl -kL https://go.dev/dl/go1.20.6.linux-amd64.tar.gz -o /tmp/go-package.tar.gz \
    && tar xvzf /tmp/go-package.tar.gz -C /usr/

# install python package manager (pip)
RUN python3 -m ensurepip --upgrade

# install jq JSON formating tool
RUN curl -kL https://github.com/jqlang/jq/releases/download/jq-1.6/jq-linux64 -o /usr/bin/jq 

# copy the .npmrc file
COPY configs/.npmrc .
# replace placeholder with the actual environment variable
RUN sed -i "s/__GITHUB_PACKAGE_REGISTRY_ACCESS_TOKEN__/${GITHUB_PACKAGE_REGISTRY_ACCESS_TOKEN}/g" ./.npmrc
# install Exhort javascript API
RUN npm install --global @RHEcosystemAppEng/exhort-javascript-api

# add exhort script
COPY scripts/exhort.sh /

# assign executable permissions to all installed binaries
RUN chmod +x /usr/jdk-20.0.2/bin/java \
    && chmod +x /usr/apache-maven-3.9.4/bin/mvn \
    && chmod +x /usr/go/bin/go \
    && chmod +x /usr/local/bin/pip3 \
    && chmod +x /usr/bin/jq \
    && chmod +x /opt/app-root/src/.npm-global/bin/exhort-javascript-api \
    && chmod +x /exhort.sh 

# use default user
USER default 

#second stage
FROM registry.access.redhat.com/ubi9/nodejs-18-minimal

LABEL org.opencontainers.image.source https://github.com/RHEcosystemAppEng/exhort-javascript-api

# assign token for exhort authentication with Snyk provider
ENV EXHORT_SNYK_TOKEN=''

# Copy java executable from the builder stage
COPY --from=builder /usr/jdk-20.0.2/ /usr/jdk-20.0.2/
ENV JAVA_HOME=/usr/jdk-20.0.2

# Copy maven executable from the builder stage
COPY --from=builder /usr/apache-maven-3.9.4/ /usr/apache-maven-3.9.4/
ENV MAVEN_HOME=/usr/apache-maven-3.9.4

# Copy golang executable from the builder stage
COPY --from=builder /usr/go/ /usr/go/
ENV GO_HOME=/usr/go

# Update PATH
ENV PATH=$PATH:$JAVA_HOME/bin:$MAVEN_HOME/bin:$GO_HOME/bin

# Copy python executable from the builder stage
COPY --from=builder /usr/bin/python3 /usr/bin/python3
COPY --from=builder /usr/local/bin/pip3 /usr/local/bin/pip3
COPY --from=builder /usr/lib64/python3.9 /usr/lib64/python3.9
COPY --from=builder /usr/local/lib/python3.9 /usr/local/lib/python3.9
COPY --from=builder /usr/lib64/libpython3.9.so.1.0 /usr/lib64/libpython3.9.so.1.0
COPY --from=builder /usr/lib64/libexpat.so.1 /usr/lib64/libexpat.so.1

RUN ln -s /usr/bin/python3 /usr/bin/python \
    && ln -s /usr/local/bin/pip3 /usr/bin/pip

# Copy jq executable from the builder stage
COPY --from=builder /usr/bin/jq /usr/bin/jq

# Copy exhort-javascript-api executable from the builder stage
COPY --from=builder /opt/app-root/src/.npm-global/ /opt/app-root/src/.npm-global/

# Copy exhort executable script from the builder stage
COPY --from=builder /exhort.sh /exhort.sh