#!/bin/bash

JAVA_OPTS="--enable-preview \
    -XX:+UnlockExperimentalVMOptions \
    -XX:+EnableVectorSupport \
    -Djava.util.concurrent.ForkJoinPool.common.parallelism=32 \
    -XX:+UseG1GC \
    -XX:+UseStringDeduplication \
    -XX:MaxGCPauseMillis=100 \
    -Dfile.encoding=UTF-8 \
    -Djava.awt.headless=true"

echo "Running test with JVM options: $JAVA_OPTS"
java $JAVA_OPTS -jar lib/karate.jar src/test/jvm-options.test.feature
