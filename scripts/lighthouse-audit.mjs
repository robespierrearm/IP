#!/usr/bin/env node
/**
 * Lighthouse Performance Audit Script
 * Runs Lighthouse against the production build
 */

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const urls = [
  { name: 'Home', url: 'http://localhost:3000' },
  { name: 'Dashboard', url: 'http://localhost:3000/dashboard' },
  { name: 'Tenders', url: 'http://localhost:3000/tenders' },
  { name: 'Accounting', url: 'http://localhost:3000/accounting' },
];

const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
    },
  },
};

async function runLighthouse() {
  console.log('🚀 Starting Lighthouse Audit...\n');
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    port: chrome.port,
  };

  const results = {};

  for (const { name, url } of urls) {
    console.log(`📊 Auditing: ${name} (${url})`);
    
    try {
      const runnerResult = await lighthouse(url, options, config);
      
      // Extract scores
      const { lhr } = runnerResult;
      results[name] = {
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        metrics: {
          fcp: lhr.audits['first-contentful-paint'].numericValue,
          lcp: lhr.audits['largest-contentful-paint'].numericValue,
          tti: lhr.audits.interactive.numericValue,
          tbt: lhr.audits['total-blocking-time'].numericValue,
          cls: lhr.audits['cumulative-layout-shift'].numericValue,
        },
      };

      // Save HTML report
      const reportPath = path.join(process.cwd(), 'lighthouse-reports', `${name.toLowerCase()}-report.html`);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, runnerResult.report);
      
      console.log(`✅ ${name}: Performance ${results[name].performance}/100`);
      console.log(`   📄 Report: ${reportPath}\n`);
    } catch (error) {
      console.error(`❌ Error auditing ${name}:`, error.message);
    }
  }

  await chrome.kill();

  // Generate summary
  console.log('\n📊 === LIGHTHOUSE AUDIT SUMMARY ===\n');
  
  Object.entries(results).forEach(([page, scores]) => {
    console.log(`${page}:`);
    console.log(`  Performance:    ${scores.performance}/100 ${getEmoji(scores.performance)}`);
    console.log(`  Accessibility:  ${scores.accessibility}/100 ${getEmoji(scores.accessibility)}`);
    console.log(`  Best Practices: ${scores.bestPractices}/100 ${getEmoji(scores.bestPractices)}`);
    console.log(`  SEO:            ${scores.seo}/100 ${getEmoji(scores.seo)}`);
    console.log(`  Metrics:`);
    console.log(`    FCP: ${(scores.metrics.fcp / 1000).toFixed(2)}s`);
    console.log(`    LCP: ${(scores.metrics.lcp / 1000).toFixed(2)}s`);
    console.log(`    TTI: ${(scores.metrics.tti / 1000).toFixed(2)}s`);
    console.log(`    TBT: ${Math.round(scores.metrics.tbt)}ms`);
    console.log(`    CLS: ${scores.metrics.cls.toFixed(3)}`);
    console.log('');
  });

  // Save JSON summary
  const summaryPath = path.join(process.cwd(), 'lighthouse-reports', 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`💾 Summary saved: ${summaryPath}`);
}

function getEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

runLighthouse().catch(console.error);
