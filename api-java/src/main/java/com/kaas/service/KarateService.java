package com.kaas.service;

import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import com.kaas.model.KarateRequest;
import com.kaas.model.KarateResponse;
import com.kaas.model.KarateResult;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import jakarta.enterprise.context.ApplicationScoped;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.UUID;
import java.util.stream.Collectors;

@ApplicationScoped
public class KarateService {
    private static final Logger LOG = Logger.getLogger(KarateService.class);
    private final ConcurrentHashMap<String, Process> runningTests = new ConcurrentHashMap<>();

    public KarateResponse executeKarateTest(KarateRequest request) {
        String executionId = generateExecutionId();
        LOG.info("Executing Karate test with ID: " + executionId);
        Path featureFile = null;

        try {
            // Create a temporary file with the feature content
            featureFile = createTempFile("karate-", ".feature", request.feature());
            LOG.info("Created temporary feature file: " + featureFile);

            // Execute the Karate test
            long startTime = System.currentTimeMillis();
            Results results = Runner.path(featureFile.toString())
                    .parallel(1);
            long executionTime = System.currentTimeMillis() - startTime;

            // Extract test statistics
            int totalScenarios = results.getScenariosTotal();
            int passedScenarios = results.getScenariosPassed();
            int failedScenarios = totalScenarios - passedScenarios;

            int totalFeatures = results.getFeaturesTotal();
            int passedFeatures = results.getFeaturesPassed();
            int failedFeatures = totalFeatures - passedFeatures;

            // Create stats objects
            KarateResult.ScenarioStats scenarioStats = new KarateResult.ScenarioStats(
                totalScenarios,
                passedScenarios,
                failedScenarios
            );

            KarateResult.FeatureStats featureStats = new KarateResult.FeatureStats(
                totalFeatures,
                passedFeatures,
                failedFeatures
            );

            // Extract scenarios and their steps
            List<KarateResult.ScenarioResult> scenarioResults = extractScenarios(results);

            // Build the result
            KarateResult result = new KarateResult(
                scenarioStats,
                featureStats,
                executionTime,
                request.feature(),
                scenarioResults
            );

            return new KarateResponse(
                results.getFailCount() == 0,
                result,
                results.getErrorMessages()
            );

        } catch (Exception e) {
            LOG.error("Error executing Karate test", e);
            throw new RuntimeException("Error executing Karate test", e);
        } finally {
            cleanup(featureFile);
        }
    }

    private List<KarateResult.ScenarioResult> extractScenarios(Results results) {
        List<KarateResult.ScenarioResult> scenarioResults = new ArrayList<>();
        
        results.getFeatureResults().forEach(feature -> {
            feature.getScenarioResults().forEach(scenario -> {
                String scenarioName = scenario.getScenario().getName();
                boolean scenarioPassed = scenario.isFailed();
                
                List<KarateResult.StepResult> steps = scenario.getStepResults().stream()
                    .map(step -> new KarateResult.StepResult(
                        step.getStep().getText(),
                        step.getResult().getStatus().equalsIgnoreCase("passed") ? "passed" : "failed",
                        step.getResult().getErrorMessage(),
                        Collections.emptyList(),
                        Collections.emptyMap(),
                        Collections.emptyMap()
                    ))
                    .collect(Collectors.toList());

                scenarioResults.add(new KarateResult.ScenarioResult(
                    scenarioName,
                    scenarioPassed ? "failed" : "passed",
                    steps
                ));
            });
        });

        return scenarioResults;
    }

    private void cleanup(Path... files) {
        if (files != null) {
            for (Path file : files) {
                if (file != null) {
                    try {
                        Files.deleteIfExists(file);
                    } catch (IOException e) {
                        LOG.warn("Failed to delete temporary file: " + file, e);
                    }
                }
            }
        }
    }

    public record Versions(String karate, String java) {}

    public Versions getVersions() {
        try {
            // Get Java version
            String javaVersion = System.getProperty("java.version");
            
            // Get Karate version from pom.xml dependency
            String karateVersion = "1.4.0";

            return new Versions(karateVersion, javaVersion);
        } catch (Exception e) {
            LOG.error("Error getting versions", e);
            throw new RuntimeException("Error getting versions", e);
        }
    }

    private String generateExecutionId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    private Path createTempFile(String prefix, String suffix, String content) throws IOException {
        Path tempFile = Files.createTempFile(prefix, suffix);
        Files.writeString(tempFile, content);
        return tempFile;
    }
}
