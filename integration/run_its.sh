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
rm -rf testers/javascript/node_modules
rm -f testers/javascript/package-lock.json
if ! npm --prefix ./testers/javascript install --silent
then
	echo "- FAILED Installing modules for JS environment"
	exit $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING JavaScript integration test for Stack Analysis report in Html for Java Maven"
match "scenarios/java/expected_stack_html" "node testers/javascript/index.js stack scenarios/java/pom.xml true"

echo "RUNNING JavaScript integration test for Stack Analysis report in Json for Java Maven"
match "scenarios/java/expected_stack_json" "node testers/javascript/index.js stack scenarios/java/pom.xml false"

echo "RUNNING JavaScript integration test for Component Analysis report for Java Maven"
match "scenarios/java/expected_component" "node testers/javascript/index.js component pom.xml '$(<scenarios/java/pom.xml)'"

##########################################
###### TypeScript Integration Tests ######
##########################################
echo "PREPARING TypeScript integration tests environment"
rm -rf testers/typescript/node_modules
rm -f testers/typescript/package-lock.json
if ! npm --prefix ./testers/typescript install --silent
then
	echo "- FAILED Installing modules for TS environment"
	exit $?
fi
echo "- SUCCESSFUL"

rm -rf testers/typescript/dist
if ! npm --prefix ./testers/typescript run compile > /dev/null 2>&1
then
	echo "- FAILED Compiling TS module"
	exit $?
fi

#### JAVA MAVEN
echo "RUNNING TypeScript integration test for Stack Analysis report in Html for Java Maven"
match "scenarios/java/expected_stack_html" "node testers/typescript/dist/index.js stack scenarios/java/pom.xml true"

echo "RUNNING TypeScript integration test for Stack Analysis report in Json for Java Maven"
match "scenarios/java/expected_stack_json" "node testers/typescript/dist/index.js stack scenarios/java/pom.xml false"

echo "RUNNING TypeScript integration test for Component Analysis report for Java Maven"
match "scenarios/java/expected_component" "node testers/typescript/dist/index.js component pom.xml '$(<scenarios/java/pom.xml)'"

##########################################
###### CMD Script Integration Tests ######
##########################################
echo "PREPARING CLI Script integration tests environment"
rm -rf testers/cli/node_modules
rm -f testers/cli/package-lock.json
if ! npm --prefix ./testers/cli install --silent
then
	echo "- FAILED Installing modules for JS environment"
	exit $?
fi
echo "- SUCCESSFUL"

#### JAVA MAVEN
echo "RUNNING CLI Script integration test for Stack Analysis report in Html for Java Maven"
match "scenarios/java/expected_stack_html" "node testers/cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack scenarios/java/pom.xml --html"

echo "RUNNING CLI Script integration test for Stack Analysis full report in Json for Java Maven"
match "scenarios/java/expected_stack_json" "node testers/cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack scenarios/java/pom.xml"

echo "RUNNING CLI Script integration test for Stack Analysis summary only report in Json for Java Maven"
match "scenarios/java/expected_stack_json_summary" "node testers/cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js stack scenarios/java/pom.xml --summary"

echo "RUNNING CLI Script integration test for Component Analysis report for Java Maven"
match "scenarios/java/expected_component" "node testers/cli/node_modules/@RHEcosystemAppEng/crda-javascript-api/dist/src/cli.js component pom.xml '$(<scenarios/java/pom.xml)'"
