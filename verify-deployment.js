#!/usr/bin/env node

/**
 * Pre-deployment verification script
 * Run this before deploying to catch common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying deployment readiness...\n');

const checks = [
  {
    name: 'Package.json exists',
    check: () => fs.existsSync('package.json'),
    fix: 'Ensure package.json is in the root directory'
  },
  {
    name: 'No canvas dependency',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return !pkg.dependencies?.canvas && !pkg.devDependencies?.canvas;
    },
    fix: 'Remove canvas from dependencies'
  },
  {
    name: 'React types v19',
    check: () => {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return pkg.devDependencies?.['@types/react']?.includes('19');
    },
    fix: 'Update @types/react to ^19.0.0'
  },
  {
    name: 'No pnpm lock file',
    check: () => !fs.existsSync('pnpm-lock.yaml'),
    fix: 'Remove pnpm-lock.yaml file'
  },
  {
    name: 'Next.js config exists',
    check: () => fs.existsSync('next.config.js'),
    fix: 'Ensure next.config.js exists'
  },
  {
    name: 'Vercel config exists',
    check: () => fs.existsSync('vercel.json'),
    fix: 'Create vercel.json configuration'
  },
  {
    name: 'Environment example exists',
    check: () => fs.existsSync('.env.example'),
    fix: 'Create .env.example with required variables'
  }
];

let allPassed = true;

checks.forEach(({ name, check, fix }) => {
  const passed = check();
  const status = passed ? '✅' : '❌';
  console.log(`${status} ${name}`);
  
  if (!passed) {
    console.log(`   Fix: ${fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for deployment.');
  console.log('\nNext steps:');
  console.log('1. Push code to GitHub');
  console.log('2. Connect to Vercel');
  console.log('3. Set environment variables');
  console.log('4. Deploy!');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n📖 See VERCEL_DEPLOY.md for detailed instructions.');