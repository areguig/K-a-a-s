package com.kaas.model;

public record KarateRequest(
    String feature,
    KarateConfig config
) {}
