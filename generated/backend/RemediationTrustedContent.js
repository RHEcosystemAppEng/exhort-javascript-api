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
export class RemediationTrustedContent {
    /**
    * PackageURL used to identify a dependency artifact
    */
    'mavenPackage';
    'productStatus';
    static discriminator = undefined;
    static attributeTypeMap = [
        {
            "name": "mavenPackage",
            "baseName": "mavenPackage",
            "type": "string",
            "format": ""
        },
        {
            "name": "productStatus",
            "baseName": "productStatus",
            "type": "string",
            "format": ""
        }
    ];
    static getAttributeTypeMap() {
        return RemediationTrustedContent.attributeTypeMap;
    }
    constructor() {
    }
}
