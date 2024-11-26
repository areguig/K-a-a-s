Feature: JVM Options Test

Scenario: Verify JVM Options
    * def System = Java.type('java.lang.System')
    * def Runtime = Java.type('java.lang.Runtime')
    * def Thread = Java.type('java.lang.Thread')
    
    # Print JVM properties
    * print '=== JVM Properties ==='
    * print 'Java Version:', System.getProperty('java.version')
    * print 'Java VM Name:', System.getProperty('java.vm.name')
    * print 'Java VM Version:', System.getProperty('java.vm.version')
    * print 'Available Processors:', Runtime.getRuntime().availableProcessors()
    * print 'Max Memory:', Runtime.getRuntime().maxMemory()
    
    # Test Virtual Threads
    * def javaRunnable = 
    """
    new java.lang.Runnable({
        run: function() {
            java.lang.System.out.println('Virtual Thread Test: Success');
        }
    })
    """
    * def virtualThread = Thread.startVirtualThread(eval(javaRunnable))
    * eval virtualThread.join()
    
    # Print Thread Info
    * print '=== Thread Info ==='
    * print 'Active Thread Count:', Thread.activeCount()
    * def hasVirtualThreads = Thread.class.getMethod('startVirtualThread', Java.type('java.lang.Runnable')).getName() == 'startVirtualThread'
    * print 'Is Virtual Thread Support Enabled:', hasVirtualThreads
