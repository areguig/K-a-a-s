package com.kaas.model;

public record KarateResponse(
    boolean success,
    KarateResult output,
    String rawOutput
) {}
