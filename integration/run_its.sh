#!/usr/bin/env bash

#!!!!! DO NOT FORGET 'npm run compile' on root prior to running this script !!!!#

# set EXHORT_ITS_USE_REAL_API=true to use the real backend
EXHORT_ITS_USE_REAL_API="${EXHORT_ITS_USE_REAL_API:=false}"

# utility function for wrapping up and exiting
# takes an exit code
cleanup() {
	# PID is set when we start the mock server
	if [ -n "${PID}" ]; then
		echo "STOPPING Mock HTTP Server"
		if ! kill "$PID"; then
			echo "- FAILED Killing PID $PID"
		else
			echo "- SUCCESSFUL"
		fi
	fi
	exit "$1"
}

# utility function takes file name and a command
# used for matching the file content and the command output
match() {
	if [[ $(< "$1") != "$(eval "$2")" ]]; then
        echo "- FAILED"
        cleanup 1
    fi
    echo "- PASSED"
}

##########################################
###### Verify Required Tools Exists ######
##########################################
echo "VERIFYING Node and NPM availability"
if ! node --version > /dev/null 2>&1; then
	echo "- FAILED Node not found"
	cleanup $?
fi

if ! npm --version > /dev/null 2>&1; then
	echo "- FAILED NPM not found"
	cleanup $?
fi
echo "- SUCCESSFUL"

echo "VERIFYING Java and Maven availability"
if ! java --version > /dev/null 2>&1; then
	echo "- FAILED Java not found"
	cleanup $?
fi

if ! mvn --version > /dev/null 2>&1; then
	echo "- FAILED Maven not found"
	cleanup $?
fi
echo "- SUCCESSFUL"

##########################################
###### Mock Server Conditional Start ######
##########################################
# unless required to use real backend, set custom url (from config) and start mock server
# note that based on the config file, the server will be automatically stopped after 5 minutes
if [ "$EXHORT_ITS_USE_REAL_API" != "true" ]; then
	echo "STARTING Mock HTTP Server"
	export EXHORT_BACKEND_URL=http://localhost:9432
	eval "node server/mock_server.js server/mock_server_config.json &"
	PID="$!"
	# shellcheck disable=SC2181
	if [ "$?" -ne 0 ]; then
		echo "- FAILED Starting up the Mock Server"
		cleanup 1
	fi
	echo "- SUCCESSFUL"
fi

##########################################
###### JavaScript Integration Tests ######
##########################################
echo "PREPARING JavaScript integration tests environment"
rm -rf testers/javascript/node_modules
rm -f testers/javascript/package-lock.json
if ! npm --prefix ./testers/javascript install --silent; then
	echo "- FAILED Installing modules for JS environment"
	cleanup $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING JavaScript integration test for Stack Analysis report in Html for Java Maven"
match "scenarios/maven/expected_stack_html" "node testers/javascript/index.js stack scenarios/maven/pom.xml true"

echo "RUNNING JavaScript integration test for Stack Analysis report in Json for Java Maven"
match "scenarios/maven/expected_stack_json" "node testers/javascript/index.js stack scenarios/maven/pom.xml false"

echo "RUNNING JavaScript integration test for Component Analysis report for Java Maven"
match "scenarios/maven/expected_component" "node testers/javascript/index.js component pom.xml '$(<scenarios/maven/pom.xml)'"

##########################################
###### TypeScript Integration Tests ######
##########################################
echo "PREPARING TypeScript integration tests environment"
rm -rf testers/typescript/node_modules
rm -f testers/typescript/package-lock.json
if ! npm --prefix ./testers/typescript install --silent; then
	echo "- FAILED Installing modules for TS environment"
	cleanup $?
fi
echo "- SUCCESSFUL"

rm -rf testers/typescript/dist
if ! npm --prefix ./testers/typescript run compile > /dev/null 2>&1; then
	echo "- FAILED Compiling TS module"
	cleanup $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING TypeScript integration test for Stack Analysis report in Html for Java Maven"
match "scenarios/maven/expected_stack_html" "node testers/typescript/dist/index.js stack scenarios/maven/pom.xml true"

echo "RUNNING TypeScript integration test for Stack Analysis report in Json for Java Maven"
match "scenarios/maven/expected_stack_json" "node testers/typescript/dist/index.js stack scenarios/maven/pom.xml false"

echo "RUNNING TypeScript integration test for Component Analysis report for Java Maven"
match "scenarios/maven/expected_component" "node testers/typescript/dist/index.js component pom.xml '$(<scenarios/maven/pom.xml)'"

##########################################
###### CMD Script Integration Tests ######
##########################################
echo "PREPARING CLI Script integration tests environment"
rm -rf testers/cli/node_modules
rm -f testers/cli/package-lock.json
if ! npm --prefix ./testers/cli install --silent; then
	echo "- FAILED Installing modules for JS environment"
	cleanup $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING CLI Script integration test for Stack Analysis report in Html for Java Maven"
match "scenarios/maven/expected_stack_html" "node testers/cli/node_modules/@RHEcosystemAppEng/exhort-javascript-api/dist/src/cli.js stack scenarios/maven/pom.xml --html"

echo "RUNNING CLI Script integration test for Stack Analysis full report in Json for Java Maven"
match "scenarios/maven/expected_stack_json" "node testers/cli/node_modules/@RHEcosystemAppEng/exhort-javascript-api/dist/src/cli.js stack scenarios/maven/pom.xml"

echo "RUNNING CLI Script integration test for Stack Analysis summary only report in Json for Java Maven"
match "scenarios/maven/expected_stack_json_summary" "node testers/cli/node_modules/@RHEcosystemAppEng/exhort-javascript-api/dist/src/cli.js stack scenarios/maven/pom.xml --summary"

echo "RUNNING CLI Script integration test for Component Analysis report for Java Maven"
match "scenarios/maven/expected_component" "node testers/cli/node_modules/@RHEcosystemAppEng/exhort-javascript-api/dist/src/cli.js component pom.xml '$(<scenarios/maven/pom.xml)'"

cleanup 0
