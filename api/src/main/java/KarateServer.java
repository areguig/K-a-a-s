import com.intuit.karate.Results;
import com.intuit.karate.Runner;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.file.Paths;

public class KarateServer {
    public static void main(String[] args) {
        if (args.length > 0 && args[0].equals("--server")) {
            startServer();
        } else {
            // Fall back to normal Karate execution
            com.intuit.karate.Main.main(args);
        }
    }

    private static void startServer() {
        System.out.println("Karate server starting...");
        
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(System.in))) {
            System.out.println("Karate server ready");
            
            String line;
            while ((line = reader.readLine()) != null) {
                try {
                    // Parse the command
                    String[] parts = line.split(",");
                    String featurePath = parts[0].trim();
                    String configDir = parts.length > 1 ? parts[1].trim() : null;
                    String outputDir = parts.length > 2 ? parts[2].trim() : null;

                    // Execute the feature
                    Runner.Builder builder = Runner.path(featurePath);
                    
                    if (configDir != null) {
                        builder.configDir(configDir);
                    }
                    if (outputDir != null) {
                        builder.outputDir(outputDir);
                    }

                    Results results = builder
                        .parallel(1)
                        .build()
                        .run();
                    
                    // Output results
                    System.out.println("Feature: " + featurePath);
                    System.out.println("Scenarios: total: " + results.getScenarioCount() + 
                                     " | passed: " + (results.getScenarioCount() - results.getFailCount()) + 
                                     " | failed: " + results.getFailCount());
                    System.out.println("Features: " + results.getFeatureCount() + " | skipped: 0");
                    System.out.println("Time: " + results.getTime());
                    System.out.println("TEST_COMPLETE");
                } catch (Exception e) {
                    System.err.println("Error executing feature: " + e.getMessage());
                    e.printStackTrace();
                    System.out.println("TEST_COMPLETE");
                }
            }
        } catch (Exception e) {
            System.err.println("Server error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
