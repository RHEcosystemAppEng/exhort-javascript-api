#!/usr/bin/env bash

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
htmlStackRep=$(node javascript/index.js stack pom.xml true)
if [[ $(< expected_stack_html) != "$htmlStackRep" ]]; then
    echo "- FAILED"
    exit 1
fi
echo "- PASSED"

echo "RUNNING JavaScript integration test for Stack Analysis report in Json"
jsonStackRep=$(node javascript/index.js stack pom.xml false)
if [[ $(< expected_stack_json) != "$jsonStackRep" ]]; then
    echo "- FAILED"
    exit 1
fi
echo "- PASSED"

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
htmlStackRep=$(node typescript/dist/index.js stack pom.xml true)
if [[ $(< expected_stack_html) != "$htmlStackRep" ]]; then
    echo "- FAILED"
    exit 1
fi
echo "- PASSED"

echo "RUNNING TypeScript integration test for Stack Analysis report in Json"
jsonStackRep=$(node typescript/dist/index.js stack pom.xml false)
if [[ $(< expected_stack_json) != "$jsonStackRep" ]]; then
    echo "- FAILED"
    exit 1
fi
echo "- PASSED"
