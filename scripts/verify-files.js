const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const productionBase = 'https://flow.trimpexstudio.com';

async function checkRemoteFile(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status === 200 || res.status === 206;
  } catch (err) {
    try {
      const res = await fetch(url, { headers: { 'Range': 'bytes=0-0' } });
      return res.status === 200 || res.status === 206;
    } catch (e) {
      return false;
    }
  }
}

async function verify() {
  console.log('Fetching render versions from database...');
  const versions = await prisma.renderVersion.findMany({
    select: {
      id: true,
      version_number: true,
      file_url: true,
      renderItem: {
        select: {
          name: true,
          sku_code: true
        }
      }
    }
  });

  console.log(`Found ${versions.length} versions in the database. Verifying file locations...\n`);

  const results = [];
  let index = 0;
  for (const v of versions) {
    index++;
    const fileUrl = v.file_url;
    if (!fileUrl.startsWith('/uploads/')) {
      results.push({
        name: v.renderItem?.name || 'Unknown',
        sku: v.renderItem?.sku_code || 'N/A',
        version: v.version_number,
        fileUrl,
        localPublic: false,
        localPublicHtml: false,
        remoteProduction: false,
        error: 'Invalid file_url format (does not start with /uploads/)'
      });
      continue;
    }

    const relativePath = fileUrl.replace(/^\/uploads\//, '');
    const localPublicPath = path.join(__dirname, '..', 'public', 'uploads', relativePath);
    const localPublicHtmlPath = path.resolve(__dirname, '..', '..', 'public_html', 'uploads', relativePath);
    const remoteUrl = `${productionBase}${fileUrl}`;

    const existsLocalPublic = fs.existsSync(localPublicPath);
    const existsLocalPublicHtml = fs.existsSync(localPublicHtmlPath);
    const existsRemote = await checkRemoteFile(remoteUrl);

    results.push({
      name: v.renderItem?.name || 'Unknown',
      sku: v.renderItem?.sku_code || 'N/A',
      version: v.version_number,
      fileUrl,
      localPublic: existsLocalPublic,
      localPublicHtml: existsLocalPublicHtml,
      remoteProduction: existsRemote
    });

    console.log(`[${index}/${versions.length}] Checked ${v.renderItem?.name || 'Unknown'} (V${v.version_number})`);
  }

  console.log('\n--- VERIFICATION REPORT ---');
  
  const okList = [];
  const missingList = [];
  const remoteOnlyList = [];

  for (const res of results) {
    const isLocal = res.localPublic || res.localPublicHtml;
    const isRemote = res.remoteProduction;
    
    if (res.error) {
      missingList.push(res);
    } else if (isLocal) {
      okList.push(res);
    } else if (isRemote) {
      remoteOnlyList.push(res);
    } else {
      missingList.push(res);
    }
  }

  console.log(`\nStatus Overview:`);
  console.log(`- Fully accessible (Local or Remote): ${okList.length + remoteOnlyList.length}`);
  console.log(`  - Local: ${okList.length}`);
  console.log(`  - Remote-only (will redirect): ${remoteOnlyList.length}`);
  console.log(`- Completely Missing / Broken URLs: ${missingList.length}`);

  if (remoteOnlyList.length > 0) {
    console.log('\nRemote-only files (will redirect to production):');
    remoteOnlyList.forEach(r => {
      console.log(`  - ${r.name} (SKU: ${r.sku}) V${r.version}: ${r.fileUrl}`);
    });
  }

  if (missingList.length > 0) {
    console.log('\nCOMPLETELY MISSING FILES (ACTION REQUIRED):');
    missingList.forEach(r => {
      console.log(`  ❌ ${r.name} (SKU: ${r.sku}) V${r.version}`);
      console.log(`     Path: ${r.fileUrl}`);
      if (r.error) console.log(`     Error: ${r.error}`);
    });
  } else {
    console.log('\n🎉 SUCCESS: No files are completely missing from both local and remote locations!');
  }
}

verify()
  .catch(err => console.error(err))
  .finally(() => prisma.$disconnect());
