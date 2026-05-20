package com.aistudyhub.dto.document;

public record StorageStatusDto(
        String provider,
        String bucket,
        boolean configured,
        boolean bucketReachable
) {
}
