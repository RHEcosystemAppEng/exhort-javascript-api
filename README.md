# Exhort JavaScript API<br/>![latest-no-snapshot][0] ![latest-snapshot][1]

* Looking for our Java API? Try [Exhort Java API](https://github.com/RHEcosystemAppEng/exhort-java-api).
* Looking for our Backend implementation? Try [Exhort](https://github.com/RHEcosystemAppEng/exhort).

The _Exhort JavaScript API_ module is deployed to _GitHub Package Registry_.

<details>
<summary>Click here for configuring <em>GHPR</em> registry access.</summary>
<h3>Configure Registry Access</h3>
<p>
Create a
<a href="https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages#authenticating-to-github-packages">token</a>
with the <strong>read:packages</strong> scope<br/>

> Based on
> <a href="https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages">GitHub documentation</a>,
> In <em>Actions</em> you can use <em>GITHUB_TOKEN</em>
</p>
<p>

Add the following line to the <em>.npmrc</em> file in your user home (
See [GH Docs](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-with-a-personal-access-token)):

```text
//npm.pkg.github.com/:_authToken=<your-ghp-token-goes-here>
```
</p>
</details>

<h3>Usage</h3>
<p>
Configuring <em>NPM</em> to look in <em>GHPR</em> for the <em>RHEcosystemAppEng</em> namespace is done by adding
<code>@RHEcosystemAppEng:registry=https://npm.pkg.github.com</code> to <em>.npmrc</em> in the project root or user home.

```shell
echo "@RHEcosystemAppEng:registry=https://npm.pkg.github.com" >> .npmrc
```
</p>

<ul>
<li>
Use as ESM Module

```shell
npm install @RHEcosystemAppEng/exhort-javascript-api
```

```javascript
import exhort from '@RHEcosystemAppEng/exhort-javascript-api'
import fs from 'node:fs'

// Get stack analysis in JSON format
let stackAnalysis = await exhort.stackAnalysis('/path/to/pom.xml')
// Get stack analysis in HTML format (string)
let stackAnalysisHtml = await exhort.stackAnalysis('/path/to/pom.xml', true)

// Get component analysis in JSON format
let buffer = fs.readFileSync('/path/to/pom.xml')
let componentAnalysis = await exhort.componentAnalysis('pom.xml', buffer.toString())
```
</li>

<li>
Use as CLI Script
<details>
<summary>Click for help menu</summary>

```shell
$ npx @RHEcosystemAppEng/exhort-javascript-api help

Usage: exhort-javascript-api {component|stack}

Commands:
  exhort-javascript-api stack </path/to/manifest> [--html|--summary]               produce stack report for manifest path
  exhort-javascript-api component <manifest-name> <manifest-content> [--summary]   produce component report for a manifest type and content

Options:
  --help  Show help                                                    [boolean]
```
</details>

```shell
# get stack analysis in json format
$ npx @RHEcosystemAppEng/exhort-javascript-api stack /path/to/pom.xml

# get stack analysis in json format (summary only)
$ npx @RHEcosystemAppEng/exhort-javascript-api stack /path/to/pom.xml --summary

# get stack analysis in html format format
$ npx @RHEcosystemAppEng/exhort-javascript-api stack /path/to/pom.xml --html

# get component analysis
$ npx @RHEcosystemAppEng/exhort-javascript-api component pom.xml "$(</path/to/pom.xml)"
```
</li>

<li>
Use as Global Binary

```shell
npm install --global @RHEcosystemAppEng/exhort-javascript-api
```

```shell
# get stack analysis in json format
$ exhort-javascript-api stack /path/to/pom.xml

# get stack analysis in json format (summary only)
$ exhort-javascript-api stack /path/to/pom.xml --summary

# get stack analysis in html format format
$ exhort-javascript-api stack /path/to/pom.xml --html

# get component analysis
$ exhort-javascript-api component pom.xml "$(</path/to/pom.xml)"
```
</li>
</ul>

<h3>Supported Ecosystems</h3>
<ul>
<li><a href="https://www.java.com/">Java</a> - <a href="https://maven.apache.org/">Maven</a></li>
<li><a href="https://www.javascript.com//">JavaScript</a> - <a href="https://www.npmjs.com/">Npm</a></li>
<li><a href="https://go.dev//">Golang</a> - <a href="https://go.dev/blog/using-go-modules/">Go Modules</a></li>
<li><a href="https://go.dev//">Python</a> - <a href="https://pypi.org/project/pip/">pip Installer</a></li>
</ul>

<h3>Excluding Packages</h3>
<p>
Excluding a package from any analysis can be achieved by marking the package for exclusion.
</p>

<ul>
<li>
<em>Java Maven</em> users can add a comment in <em>pom.xml</em>

```xml
<dependency> <!--exhortignore-->
  <groupId>...</groupId>
  <artifactId>...</artifactId>
  <version>...</version>
</dependency>
```
</li>

</ul>
<ul>
<li>
<em>Javascript NPM </em> users can add a root (key, value) pair with value of list of names (strings) to be ignored (without versions), and key called <b>exhortignore</b> in <em>package.json</em>,  example:

```json
{
  "name": "sample",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "dotenv": "^8.2.0",
    "express": "^4.17.1",
    "jsonwebtoken": "^8.5.1",
    "mongoose": "^5.9.18"
  },
  "exhortignore": [
    "jsonwebtoken"
  ]
}
```

<em>Golang</em> users can add in go.mod a comment with //exhortignore next to the package to be ignored, or to "piggyback" on existing comment ( e.g - //indirect) , for example:
```go
module github.com/RHEcosystemAppEng/SaaSi/deployer

go 1.19

require (
        github.com/gin-gonic/gin v1.9.1
        github.com/google/uuid v1.1.2
        github.com/jessevdk/go-flags v1.5.0 //exhortignore
        github.com/kr/pretty v0.3.1
        gopkg.in/yaml.v2 v2.4.0
        k8s.io/apimachinery v0.26.1
        k8s.io/client-go v0.26.1
)

require (
        github.com/davecgh/go-spew v1.1.1 // indirect exhortignore
        github.com/emicklei/go-restful/v3 v3.9.0 // indirect
        github.com/go-logr/logr v1.2.3 // indirect //exhortignore

)
```

<em>Python pip</em> users can add in requirements.txt a comment with #exhortignore(or # exhortignore) to the right of the same artifact to be ignored, for example:
```properties
anyio==3.6.2
asgiref==3.4.1
beautifulsoup4==4.12.2
certifi==2023.7.22
chardet==4.0.0
click==8.0.4 #exhortignore
contextlib2==21.6.0
fastapi==0.75.1
Flask==2.0.3
h11==0.13.0
idna==2.10
immutables==0.19
importlib-metadata==4.8.3
itsdangerous==2.0.1
Jinja2==3.0.3
MarkupSafe==2.0.1
pydantic==1.9.2 # exhortignore
requests==2.25.1
six==1.16.0
sniffio==1.2.0
soupsieve==2.3.2.post1
starlette==0.17.1
typing_extensions==4.1.1
urllib3==1.26.16
uvicorn==0.17.0
Werkzeug==2.0.3
zipp==3.6.0

```

All of the 4 above examples are valid for marking a package to be ignored
</li>

</ul>

<h3>Customization</h3>
<p>
There are 2 approaches for customizing <em>Exhort JavaScript API</em>. Whether you're using this API as a
<em>Global Module</em>, a <em>Remote Script</em>, or an <em>ESM Module</em>, you can use <em>Environment Variables</em>
for various customization.

However, <em>ESM Module</em> users, can opt for customizing programmatically:

```javascript
import exhort from '@RHEcosystemAppEng/exhort-javascript-api'
import fs from 'node:fs'

let options = {
  'EXHORT_SNYK_TOKEN': 'my-secret-snyk-token',
  'EXHORT_MVN_PATH': '/path/to/my/mvn',
  'EXHORT_NPM_PATH': '/path/to/npm',
  'EXHORT_GO_PATH': '/path/to/go',
  //python - python3, pip3 take precedence if python version > 3 installed
  'EXHORT_PYTHON3_PATH' : '/path/to/python3',
  'EXHORT_PIP3_PATH' : '/path/to/pip3',
  'EXHORT_PYTHON_PATH' : '/path/to/python',
  'EXHORT_PIP_PATH' : '/path/to/pip'

}

// Get stack analysis in JSON format
let stackAnalysis = await exhort.stackAnalysis('/path/to/pom.xml', false, options)
// Get stack analysis in HTML format (string)
let stackAnalysisHtml = await exhort.stackAnalysis('/path/to/pom.xml', true, options)

// Get component analysis in JSON format
let buffer = fs.readFileSync('/path/to/pom.xml')
let componentAnalysis = await exhort.componentAnalysis('pom.xml', buffer.toString(), options)
```
 **_Environment variables takes precedence._**
</p>

<h4>Customizing Tokens</h4>
<p>
For including extra vulnerability data and resolutions, otherwise only available only to vendor registered users. You
can use the following keys for setting various vendor tokens.
</p>

<table>
<tr>
<th>Vendor</th>
<th>Token Key</th>
</tr>
<tr>
<td><a href="https://app.snyk.io/redhat/snyk-token">Snyk</a></td>
<td>EXHORT_SNYK_TOKEN</td>
</tr>
</table>

<h4>Customizing Executables</h4>
<p>
This project uses each ecosystem's executable for creating dependency trees. These executables are expected to be
present on the system's PATH environment. If they are not, or perhaps you want to use custom ones. Use can use the
following keys for setting custom paths for the said executables.
</p>

<table>
<tr>
<th>Ecosystem</th>
<th>Default</th>
<th>Executable Key</th>
</tr>
<tr>
<td><a href="https://maven.apache.org/">Maven</a></td>
<td><em>mvn</em></td>
<td>EXHORT_MVN_PATH</td>
</tr>
<tr>
<td><a href="https://www.npmjs.com/">NPM</a></td>
<td><em>npm</em></td>
<td>EXHORT_NPM_PATH</td>
</tr>
<tr>
<td><a href="https://go.dev/blog/using-go-modules/">Go Modules</a></td>
<td><em>go</em></td>
<td>EXHORT_GO_PATH</td>
</tr>
<tr>
<td><a href="https://www.python.org/">Python programming language</a></td>
<td><em>python3</em></td>
<td>EXHORT_PYTHON3_PATH</td>
</tr>
<tr>
<td><a href="https://pypi.org/project/pip/">Python pip Package Installer</a></td>
<td><em>pip3</em></td>
<td>EXHORT_PIP3_PATH</td>
</tr>
<tr>
<td><a href="https://www.python.org/">Python programming language</a></td>
<td><em>python</em></td>
<td>EXHORT_PYTHON_PATH</td>
</tr>
<tr>
<td><a href="https://pypi.org/project/pip/">Python pip Package Installer</a></td>
<td><em>pip</em></td>
<td>EXHORT_PIP_PATH</td>
</tr>
</table>

####  Python Support

By default Python support assumes that the package is installed using the pip/pip3 binary on the system PATH, of in the customized
Binaries passed to environment variables. If the package is not installed , then an error will be thrown.

There is an experimental feature of installing the requirements.txt on a virtual env(only python3 or later is supported for this feature) - in this case,
it's important to pass in a path to python3 binary as `EXHORT_PYTHON3_PATH` or instead make sure that python3 is on the system path.
in such case, You can use that feature by setting environment variable `EXHORT_PYTHON_VIRTUAL_ENV` to true

<!-- Badge links -->
[0]: https://img.shields.io/github/v/release/RHEcosystemAppEng/exhort-javascript-api?color=green&label=latest
[1]: https://img.shields.io/github/v/release/RHEcosystemAppEng/exhort-javascript-api?color=yellow&include_prereleases&label=early-access
