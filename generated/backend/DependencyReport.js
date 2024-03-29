/**
 * Exhort API
 * Vulnerability analysis with Red Hat Trusted Profile Analyzer
 *
 * OpenAPI spec version: 4.0.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
export class DependencyReport {
    /**
    * PackageURL used to identify a dependency artifact
    */
    'ref';
    'issues';
    'transitive';
    /**
    * PackageURL used to identify a dependency artifact
    */
    'recommendation';
    'highestVulnerability';
    static discriminator = undefined;
    static attributeTypeMap = [
        {
            "name": "ref",
            "baseName": "ref",
            "type": "string",
            "format": ""
        },
        {
            "name": "issues",
            "baseName": "issues",
            "type": "Array<Issue>",
            "format": ""
        },
        {
            "name": "transitive",
            "baseName": "transitive",
            "type": "Array<TransitiveDependencyReport>",
            "format": ""
        },
        {
            "name": "recommendation",
            "baseName": "recommendation",
            "type": "string",
            "format": ""
        },
        {
            "name": "highestVulnerability",
            "baseName": "highestVulnerability",
            "type": "Issue",
            "format": ""
        }
    ];
    static getAttributeTypeMap() {
        return DependencyReport.attributeTypeMap;
    }
    constructor() {
    }
}
