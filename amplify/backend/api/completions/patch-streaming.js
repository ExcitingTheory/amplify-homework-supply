#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'build', 'completions-cloudformation-template.json');

console.log('Patching API Gateway template for response streaming...');

try {
  const template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  
  // Patch /chat endpoint
  if (template.Resources?.completions?.Properties?.Body?.paths?.['/chat']?.['x-amazon-apigateway-any-method']?.['x-amazon-apigateway-integration']) {
    const chatIntegration = template.Resources.completions.Properties.Body.paths['/chat']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'];
    chatIntegration.invokeMode = 'RESPONSE_STREAM';
    chatIntegration.responseMode = 'STREAM';
    console.log('✓ Patched /chat endpoint');
  }
  
  // Patch /chat/{proxy+} endpoint
  if (template.Resources?.completions?.Properties?.Body?.paths?.['/chat/{proxy+}']?.['x-amazon-apigateway-any-method']?.['x-amazon-apigateway-integration']) {
    const chatProxyIntegration = template.Resources.completions.Properties.Body.paths['/chat/{proxy+}']['x-amazon-apigateway-any-method']['x-amazon-apigateway-integration'];
    chatProxyIntegration.invokeMode = 'RESPONSE_STREAM';
    chatProxyIntegration.responseMode = 'STREAM';
    console.log('✓ Patched /chat/{proxy+} endpoint');
  }
  
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
  console.log('✓ Template patched successfully');
} catch (error) {
  console.error('Error patching template:', error.message);
  process.exit(1);
}
