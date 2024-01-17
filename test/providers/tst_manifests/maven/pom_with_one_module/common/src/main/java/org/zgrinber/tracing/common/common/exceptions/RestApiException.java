package org.zgrinber.tracing.common.exceptions;



public class RestApiException extends Exception
{

    private Integer httpStatusCode;
    private String originalMessage;


    public RestApiException(String message, Integer httpStatusCode, String originalMessage) {
        super(message);
        this.httpStatusCode = httpStatusCode;
        this.originalMessage = originalMessage;
    }

    public Integer getHttpStatusCode() {
        return httpStatusCode;
    }

    public String getOriginalMessage() {
        return originalMessage;
    }
}

