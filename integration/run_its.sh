#!/usr/bin/env bash

###### DO NOT FORGET 'npm run compile' on root prior to running this script ######

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

echo "VERIFYING Java and Maven availability"
if ! java --version > /dev/null 2>&1
then
	echo "- FAILED Java not found"
	exit $?
fi

if ! mvn --version > /dev/null 2>&1
then
	echo "- FAILED Maven not found"
	exit $?
fi
echo "- SUCCESSFUL"

##########################################
###### JavaScript Integration Tests ######
##########################################
echo "PREPARING JavaScript integration tests environment"
rm -rf javascript/node_modules
if ! npm --prefix javascript install --silent
then
	echo "- FAILED Installing modules for JS environment"
	exit $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING JavaScript integration test for Stack Analysis report in Html for Java Maven"
match "langs/java/expected_stack_html" "node javascript/index.js stack langs/java/pom.xml true"

echo "RUNNING JavaScript integration test for Stack Analysis report in Json for Java Maven"
match "langs/java/expected_stack_json" "node javascript/index.js stack langs/java/pom.xml false"

echo "RUNNING JavaScript integration test for Component Analysis report for Java Maven"
match "langs/java/expected_component" "node javascript/index.js component pom.xml '$(<langs/java/pom.xml)'"

##########################################
###### TypeScript Integration Tests ######
##########################################
echo "PREPARING TypeScript integration tests environment"
rm -rf typescript/node_modules
if ! npm --prefix typescript install --silent
then
	echo "- FAILED Installing modules for TS environment"
	exit $?
fi
echo "- SUCCESSFUL"

rm -rf typescript/dist
if ! npm --prefix typescript run compile > /dev/null 2>&1
then
	echo "- FAILED Compiling TS module"
	exit $?
fi

#### JAVA MAVEN
echo "RUNNING TypeScript integration test for Stack Analysis report in Html for Java Maven"
match "langs/java/expected_stack_html" "node typescript/dist/index.js stack langs/java/pom.xml true"

echo "RUNNING TypeScript integration test for Stack Analysis report in Json for Java Maven"
match "langs/java/expected_stack_json" "node typescript/dist/index.js stack langs/java/pom.xml false"

echo "RUNNING TypeScript integration test for Component Analysis report for Java Maven"
match "langs/java/expected_component" "node typescript/dist/index.js component pom.xml '$(<langs/java/pom.xml)'"

##########################################
###### CMD Script Integration Tests ######
##########################################
echo "PREPARING CLI Script integration tests environment"
rm -rf cli/node_modules
if ! npm --prefix cli install --silent
then
	echo "- FAILED Installing modules for JS environment"
	exit $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING CLI Script integration test for Stack Analysis report in Html for Java Maven"
match "langs/java/expected_stack_html" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack langs/java/pom.xml --html"

echo "RUNNING CLI Script integration test for Stack Analysis full report in Json for Java Maven"
match "langs/java/expected_stack_json" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack langs/java/pom.xml"

echo "RUNNING CLI Script integration test for Stack Analysis summary only report in Json for Java Maven"
match "langs/java/expected_stack_json_summary" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack langs/java/pom.xml --summary"

echo "RUNNING CLI Script integration test for Component Analysis report for Java Maven"
match "langs/java/expected_component" "node cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js component pom.xml '$(<langs/java/pom.xml)'"
