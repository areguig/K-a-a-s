package com.kaas.model;

import java.util.Map;

public record KarateConfig(
    Map<String, String> env,
    String configDir,
    Integer threads,
    Boolean threadMonitoring
) {}
