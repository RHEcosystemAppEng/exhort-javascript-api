#!/usr/bin/env bash

# utility function takes file name and a command
# used for matching the file content and the command output
match() {
	if [[ $(< "$1") != "$(eval "$2")" ]]; then
        echo "- FAILED"
        exit 1
    fi
    echo "- PASSED"
}

##########################################
###### Verify Required Tools Exists ######
##########################################
echo "VERIFYING Node and NPM availability"
if ! node --version > /dev/null 2>&1
then
	echo "- FAILED Node not found"
	exit $?
fi

if ! npm --version > /dev/null 2>&1
then
	echo "- FAILED NPM not found"
	exit $?
fi
echo "- SUCCESSFUL"

##########################################
###### JavaScript Integration Tests ######
##########################################
echo "PREPARING JavaScript integration tests environment"
if ! npm --prefix javascript install --force --silent
then
	echo "- FAILED Installing modules for JS environment"
	exit $?
fi
echo "- SUCCESSFUL"

echo "RUNNING JavaScript integration test for Stack Analysis report in Html"
match "expected_stack_html" "node javascript/index.js stack pom.xml true"

echo "RUNNING JavaScript integration test for Stack Analysis report in Json"
match "expected_stack_json" "node javascript/index.js stack pom.xml false"

##########################################
###### TypeScript Integration Tests ######
##########################################
echo "PREPARING TypeScript integration tests environment"
if ! npm --prefix typescript install --force --silent
then
	echo "- FAILED Installing modules for TS environment"
	exit $?
fi
echo "- SUCCESSFUL"

if ! npm --prefix typescript run compile > /dev/null 2>&1
then
	echo "- FAILED Compiling TS module"
	exit $?
fi

echo "RUNNING TypeScript integration test for Stack Analysis report in Html"
match "expected_stack_html" "node typescript/dist/index.js stack pom.xml true"

echo "RUNNING TypeScript integration test for Stack Analysis report in Json"
match "expected_stack_json" "node typescript/dist/index.js stack pom.xml false"

##########################################
###### CMD Script Integration Tests ######
##########################################
echo "PREPARING CLI Script integration tests environment"
if ! npm --prefix cli install --force --silent
then
	echo "- FAILED Installing modules for JS environment"
	exit $?
fi
echo "- SUCCESSFUL"

echo "RUNNING CLI Script integration test for Stack Analysis report in Html"
match "expected_stack_html" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack pom.xml --html"

echo "RUNNING CLI Script integration test for Stack Analysis report in full Json"
match "expected_stack_json" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack pom.xml"

echo "RUNNING CLI Script integration test for Stack Analysis report in full Json"
match "expected_stack_json_summary" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack pom.xml --summary"
