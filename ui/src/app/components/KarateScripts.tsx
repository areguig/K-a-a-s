"use client"

import React from 'react'
import Script from 'next/script'

export default function KarateScripts() {
  return (
    <React.Fragment>
      {/* jQuery and plugins */}
      <Script src="https://code.jquery.com/jquery-3.6.0.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.tablesorter/2.31.3/js/jquery.tablesorter.min.js" strategy="afterInteractive" />

      {/* Bootstrap CSS and JS */}
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
      <Script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js" strategy="afterInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js" strategy="afterInteractive" />

      {/* Custom Karate Report Script */}
      <Script id="karate-init" strategy="afterInteractive">
        {`
          function initKarateReportFeatures() {
            // Initialize tablesorter
            $('.table').tablesorter();

            // Initialize tooltips
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
              return new bootstrap.Tooltip(tooltipTriggerEl);
            });

            // Initialize tabs
            var tabTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tab"]'));
            var tabList = tabTriggerList.map(function (tabTriggerEl) {
              return new bootstrap.Tab(tabTriggerEl);
            });
          }

          // Initialize when document is ready
          $(document).ready(function() {
            initKarateReportFeatures();
          });

          // Re-initialize after dynamic content updates
          function reinitKarateReport() {
            setTimeout(initKarateReportFeatures, 100);
          }
        `}
      </Script>

      {/* Custom Karate Report Styles */}
      <style>
        {`
          /* Karate Report Styles */
          .nav-item { margin-right: 10px; }
          .nav-link { color: #007bff; }
          .nav-link:hover { color: #0056b3; }
          .failed { color: #dc3545; }
          .passed { color: #28a745; }
          .skipped { color: #6c757d; }
          .feature-heading { margin: 20px 0; }
          .scenario-heading { margin: 15px 0; }
          .step { margin: 5px 0; padding-left: 20px; }
          .error-message { color: #dc3545; margin: 10px 0; padding: 10px; background-color: #f8d7da; border-radius: 4px; }
          
          /* Additional Karate Report Styles */
          .container-fluid { padding: 20px; }
          .navbar { margin-bottom: 20px; }
          .nav-link.active { font-weight: bold; }
          pre { white-space: pre-wrap; }
          .scenario { margin-bottom: 30px; }
          .step-cell { padding: 8px; }
          .time-cell { text-align: right; }
          .data-cell { font-family: monospace; }
          .tag { margin-right: 5px; padding: 2px 6px; border-radius: 3px; background-color: #e9ecef; }
          
          /* Table Styles */
          .table { margin-bottom: 1rem; }
          .table th { background-color: #f8f9fa; }
          .table td, .table th { padding: .75rem; border-bottom: 1px solid #dee2e6; }
          
          /* Navigation Styles */
          #nav-data { margin-bottom: 20px; }
          .nav-tabs { border-bottom: 1px solid #dee2e6; }
          .nav-tabs .nav-link { border: 1px solid transparent; }
          .nav-tabs .nav-link.active { 
            color: #495057;
            background-color: #fff;
            border-color: #dee2e6 #dee2e6 #fff;
          }
        `}
      </style>
    </React.Fragment>
  )
}
