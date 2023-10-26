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

import { RemediationTrustedContent } from '../backend/RemediationTrustedContent';

export class Remediation {
    'fixedIn'?: Array<string>;
    'trustedContent'?: RemediationTrustedContent;

    static readonly discriminator: string | undefined = undefined;

    static readonly attributeTypeMap: Array<{name: string, baseName: string, type: string, format: string}> = [
        {
            "name": "fixedIn",
            "baseName": "fixedIn",
            "type": "Array<string>",
            "format": ""
        },
        {
            "name": "trustedContent",
            "baseName": "trustedContent",
            "type": "RemediationTrustedContent",
            "format": ""
        }    ];

    static getAttributeTypeMap() {
        return Remediation.attributeTypeMap;
    }

    public constructor() {
    }
}

