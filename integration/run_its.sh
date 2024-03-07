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
    echo
}

matchConstant() {
    TEST_MESSAGE="$3"
    sleep 1
    echo $TEST_MESSAGE
    if [[ "$1" != "$2" ]]; then
        echo "- FAILED"
       echo "expected = $1, actual= $2"
       cleanup 1
    fi
    echo "- PASSED"
    echo
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
###### Preparing CLI Tests ######
##########################################
echo "PREPARING JavaScript CLI tests environment"
rm -rf testers/cli/node_modules
rm -f testers/cli/package-lock.json
if !  npm --prefix testers/cli install  --silent ; then
	echo "- FAILED Installing exhort-javascript-api environment for testing"
	cleanup $?
fi
echo "- SUCCESSFUL"
mkdir -p ./responses
#### JAVA MAVEN
echo "RUNNING JavaScript CLI integration test for Stack Analysis report in Html for Java Maven"

testers/cli/node_modules/.bin/exhort-javascript-api  stack scenarios/maven/pom.xml --html &> ./responses/stack.html

if [ "$?" -ne 0 ]; then
	echo "- FAILED , return $RC from invocation"
			cleanup $RC
fi
RESPONSE_CONTENT=$(grep -i "DOCTYPE html" ./responses/stack.html)
if [[ -z "${RESPONSE_CONTENT}"  ]]; then
    echo "- FAILED ,return code is ok ,but received doc is not HTML"
            cleanup 1
fi
echo "- PASSED"
echo

echo 'RUNNING JavaScript CLI integration test for Stack Analysis report summary of snyk provider for Java Maven'

testers/cli/node_modules/.bin/exhort-javascript-api stack scenarios/maven/pom.xml --summary > ./responses/stack-summary.json

if [ "$?" -ne 0 ]; then
	echo "- FAILED , return $RC from invocation"
			cleanup $RC
fi

RESPONSE_CONTENT=$(jq . ./responses/stack-summary.json)
if [ "$?" -ne 0 ]; then
	echo "- FAILED , response is not a valid json"
			cleanup $RC
fi
echo
echo $RESPONSE_CONTENT
echo "- PASSED"
echo




echo "RUNNING JavaScript CLI integration test for Stack Analysis report in Json for Java Maven"
testers/cli/node_modules/.bin/exhort-javascript-api stack scenarios/maven/pom.xml  > ./responses/stack.json

if [ "$?" -ne 0 ]; then
	echo "- FAILED , return $RC from invocation"
			cleanup $RC
fi
RESPONSE_CONTENT=$(jq . ./responses/stack.json)
if [ "$?" -ne 0 ]; then
	echo "- FAILED , response is not a valid json"
			cleanup $RC
fi
StatusCodeTC=$(jq '.providers["trusted-content"].status.code' ./responses/stack.json)
matchConstant "200" "$StatusCodeTC" "Check that Response code from Trusted Content is OK ( Http Status = 200)..."

StatusCodeSnyk=$(jq '.providers.snyk.status.code' ./responses/stack.json)
matchConstant "200" "$StatusCodeSnyk" "Check that Response code from Snyk Provider is OK ( Http Status = 200)..."

echo "RUNNING JavaScript CLI integration test for Component Analysis report for Java Maven"
eval "testers/cli/node_modules/.bin/exhort-javascript-api component pom.xml '$(<scenarios/maven/pom.xml)'"  > ./responses/component.json

if [ "$?" -ne 0 ]; then
	echo "- FAILED , return $RC from invocation"
			cleanup $RC
fi
RESPONSE_CONTENT=$(jq . ./responses/component.json)
if [ "$?" -ne 0 ]; then
	echo "- FAILED , response is not a valid json, got $RC from parsing the file"
			cleanup $RC
fi

StatusCodeTC=$(jq '.providers["trusted-content"].status.code' ./responses/stack.json)
matchConstant "200" "$StatusCodeTC" "Check that Response code from Trusted Content is OK ( Http Status = 200)..."
StatusCodeSnyk=$(jq '.providers.snyk.status.code' ./responses/stack.json)
matchConstant "200" "$StatusCodeSnyk" "Check that Response code from Snyk Provider is OK ( Http Status = 200)..."

echo "RUNNING JavaScript CLI integration test for Validate Token Function With wrong token, expecting getting 401 http status code "
answerAboutToken=$(testers/cli/node_modules/.bin/exhort-javascript-api validate-token snyk --value=veryBadTokenValue)
matchConstant "401" "$answerAboutToken" "Checking That dummy Token is Invalid , Expecting Response Status of Authentication Failure( Http Status = 401)..."

echo "RUNNING JavaScript CLI  integration test for Validate Token Function With no token at all, Expecting getting 400 http status code"
answerAboutToken=$(testers/cli/node_modules/.bin/exhort-javascript-api validate-token snyk )
matchConstant "400" "$answerAboutToken" "Checking That Token is missing , Expecting Response Status of Bad Request( Http Status = 400)..."
echo "==>SUCCESS!!"

cleanup 0
