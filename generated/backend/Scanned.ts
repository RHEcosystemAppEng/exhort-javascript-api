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


/**
* Number of dependencies scanned
*/
export class Scanned {
    'total'?: number;
    'direct'?: number;
    'transitive'?: number;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "total",
            "baseName": "total",
            "type": "number",
            "format": ""
        },
        {
            "name": "direct",
            "baseName": "direct",
            "type": "number",
            "format": ""
        },
        {
            "name": "transitive",
            "baseName": "transitive",
            "type": "number",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Scanned.attributeTypeMap;
    }

    public constructor() {
    }
}

