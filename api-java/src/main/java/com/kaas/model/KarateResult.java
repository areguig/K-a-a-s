package com.kaas.model;

import java.util.List;
import java.util.Map;

public record KarateResult(
    ScenarioStats scenarios,
    FeatureStats features,
    double time,
    String featureContent,
    List<ScenarioResult> scenarioResults
) {
    public record ScenarioStats(
        int total,
        int passed,
        int failed
    ) {}

    public record FeatureStats(
        int total,
        int passed,
        int failed
    ) {}

    public record StepResult(
        String name,
        String status,
        String errorMessage,
        List<String> logs,
        Map<String, Object> request,
        Map<String, Object> response
    ) {}

    public record ScenarioResult(
        String name,
        String status,
        List<StepResult> steps
    ) {}
}
