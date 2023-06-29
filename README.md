# CodeReady Dependency Analytics JavaScript API<br/>![latest-no-snapshot][0] ![latest-snapshot][1]

> This project is still a WIP. Currently, only Java's Maven ecosystem is implemented.

The _Crda JavaScript API_ module is deployed to _GitHub Package Registry_.

* Looking for our Java API? Try [Crda Java API](https://github.com/RHEcosystemAppEng/crda-java-api).
* Looking for our Backend implementation? Try [Crda Backend](https://github.com/RHEcosystemAppEng/crda-backend).

<details>
<summary>Click here for configuring <em>GHPR</em> and gaining access to the <em>crda-javascript-api</em> module.</summary>

<h3>Create your token</h3>
<p>
Create a
<a href="https://docs.github.com/en/packages/learn-github-packages/introduction-to-github-packages#authenticating-to-github-packages">token</a>
with the <strong>read:packages</strong> scope<br/>

> Based on
> <a href="https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages">GitHub documentation</a>,
> In <em>Actions</em> you can use <em>GITHUB_TOKEN</em>

</p>

<h3>Configure <em>GHPR</em> access for <em>NPM</em></h3>

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
Instruct <em>NPM</em> to look in <em>GHPR</em> for the <em>RHEcosystemAppEng</em> namespace.<br/>
Add <code>@RHEcosystemAppEng:registry=https://npm.pkg.github.com</code> to <em>.npmrc</em> in the project root or user home:

```shell
echo "@RHEcosystemAppEng:registry=https://npm.pkg.github.com" >> .npmrc
```

</p>

<ul>

<li>Use as ESM Module</li>
<p>

```shell
npm install @RHEcosystemAppEng/crda-javascript-api
```

```javascript
import crda from '@RHEcosystemAppEng/crda-javascript-api'
import fs from 'node:fs'

// Get stack analysis in JSON format
let stackAnalysis = await crda.stackAnalysis('/path/to/pom.xml')
// Get stack analysis in HTML format (string)
let stackAnalysisHtml = await crda.stackAnalysis('/path/to/pom.xml', true)

// Get component analysis in JSON format
let buffer = fs.readFileSync('/path/to/pom.xml')
let componentAnalysis = await crda.componentAnalysis('pom.xml', buffer.toString())
```

</p>

<li>Use as CLI Script</li>
<p>

```shell
$ npx @RHEcosystemAppEng/crda-javascript-api help

Usage: crda-javascript-api {component|stack}

Commands:
  crda-javascript-api stack </path/to/manifest> [--html|--summary]               produce stack report for manifest path
  crda-javascript-api component <manifest-name> <manifest-content> [--summary]   produce component report for a manifest type and content

Options:
  --help  Show help                                                    [boolean]
```

```shell
# get stack analysis in json format
$ npx @RHEcosystemAppEng/crda-javascript-api stack /path/to/pom.xml

# get stack analysis in json format (summary only)
$ npx @RHEcosystemAppEng/crda-javascript-api stack /path/to/pom.xml --summary

# get stack analysis in html format format
$ npx @RHEcosystemAppEng/crda-javascript-api stack /path/to/pom.xml --html

# get component analysis
$ npx @RHEcosystemAppEng/crda-javascript-api component pom.xml "$(</path/to/pom.xml)"
```

</p>

<li>Use as Global Binary</li>

<p>

```shell
npm install --global @RHEcosystemAppEng/crda-javascript-api
```

```shell
# get stack analysis in json format
$ crda-javascript-api stack /path/to/pom.xml

# get stack analysis in json format (summary only)
$ crda-javascript-api stack /path/to/pom.xml --summary

# get stack analysis in html format format
$ crda-javascript-api stack /path/to/pom.xml --html

# get component analysis
$ crda-javascript-api component pom.xml "$(</path/to/pom.xml)"
```

</p>

</ul>

<h3>Excluding Packages</h3>
<p>
Excluding a package from any analysis can be achieved by marking the package for exclusion.
</p>

<ul>
<li>Java Maven (pom.xml)</li>

```xml
<dependency> <!--crdaignore-->
  <groupId>...</groupId>
  <artifactId>...</artifactId>
  <version>...</version>
</dependency>
```

</ul>

<h3>Customizing</h3>
<p>
There are 2 approaches for customizing <em>Crda JavaScript API</em>. Whether you're using this API as a
<em>Global Module</em>, a <em>Remote Script</em>, or an <em>ESM Module</em>, you can use <em>Environment Variables</em>
for various customization.

However, <em>ESM Module</em> users, can opt for customizing programmatically:

```javascript
import crda from '@RHEcosystemAppEng/crda-javascript-api'
import fs from 'node:fs'

let options = {
    "CRDA_SNYK_TOKEN": "my-secret-snyk-token",
    "CRDA_MVN_PATH": "/path/to/my/mvn"
}

// Get stack analysis in JSON format
let stackAnalysis = await crda.stackAnalysis('/path/to/pom.xml', false, options)
// Get stack analysis in HTML format (string)
let stackAnalysisHtml = await crda.stackAnalysis('/path/to/pom.xml', true, options)

// Get component analysis in JSON format
let buffer = fs.readFileSync('/path/to/pom.xml')
let componentAnalysis = await crda.componentAnalysis('pom.xml', buffer.toString(), options)
```

> NOTE: If setting the same key in both environment variables and options, the environment variable will take
> precedence.

Keep scrolling down for the available customizable keys.

</p>

<h4>Customizing Tokens</h4>
<p>
For including extra vulnerability data and resolutions, otherwise only available to vendor registered users. You can
set the various vendor tokens as environment variables.

Available token environment variables:
</p>

<table>
<tr>
<th>Vendor</th>
<th>Token Key</th>
</tr>
<tr>
<td><a href="https://app.snyk.io/redhat/snyk-token">Snyk</a></td>
<td>CRDA_SNYK_TOKEN</td>
</tr>
</table>

<h4>Customizing Executables</h4>
<p>
This project uses each ecosystem's executable for creating dependency trees. These executables are expected to be
present on the system PATH. If they are not, or perhaps you want to use custom ones. Use can use the following
environment variables for setting custom paths for the said executables.
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
<td>CRDA_MVN_PATH</td>
</tr>
</table>

<!-- Badge links -->
[0]: https://img.shields.io/github/v/release/RHEcosystemAppEng/crda-javascript-api?color=green&label=latest
[1]: https://img.shields.io/github/v/release/RHEcosystemAppEng/crda-javascript-api?color=yellow&include_prereleases&label=early-access
