// ========== REAL IPFS INTEGRATION FOR PRODUCTION ==========
// This file provides MULTIPLE IPFS upload methods
// Priority: Infura > Pinata > Web3.Storage > Mock

import { create } from 'ipfs-http-client';

// ========== ENVIRONMENT VARIABLES ==========
// Add these to your .env file:
// REACT_APP_INFURA_PROJECT_ID=your_project_id
// REACT_APP_INFURA_PROJECT_SECRET=your_project_secret
// REACT_APP_PINATA_API_KEY=your_api_key
// REACT_APP_PINATA_SECRET_KEY=your_secret
// REACT_APP_WEB3_STORAGE_TOKEN=your_token

const INFURA_PROJECT_ID = process.env.REACT_APP_INFURA_PROJECT_ID || '';
const INFURA_PROJECT_SECRET = process.env.REACT_APP_INFURA_PROJECT_SECRET || '';
const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY || '';
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY || '';
const WEB3_STORAGE_TOKEN = process.env.REACT_APP_WEB3_STORAGE_TOKEN || '';

// ========== METHOD 1: INFURA IPFS (RECOMMENDED) ==========
// Get credentials from: https://infura.io/

let infuraClient = null;

const getInfuraClient = () => {
  if (infuraClient) return infuraClient;
  
  if (!INFURA_PROJECT_ID || !INFURA_PROJECT_SECRET) return null;
  
  try {
    const auth = 'Basic ' + btoa(INFURA_PROJECT_ID + ':' + INFURA_PROJECT_SECRET);
    
    infuraClient = create({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
      headers: {
        authorization: auth,
      },
    });
    
    console.log('✅ Infura IPFS client initialized');
    return infuraClient;
  } catch (error) {
    console.error('Failed to initialize Infura client:', error);
    return null;
  }
};

export const uploadToInfura = async (file) => {
  const client = getInfuraClient();
  if (!client) throw new Error('Infura client not available');
  
  try {
    console.log(`📤 Uploading to Infura: ${file.name}`);
    
    const added = await client.add(file, {
      progress: (prog) => console.log(`Progress: ${prog}`),
    });

    const cid = added.cid.toString();
    const url = `https://infura-ipfs.io/ipfs/${cid}`;
    
    console.log(`✅ Infura upload successful: ${cid}`);
    
    return { success: true, ipfsHash: cid, url, gateway: 'infura', cid };
  } catch (error) {
    console.error('Infura upload failed:', error);
    throw error;
  }
};

// ========== METHOD 2: PINATA (ALTERNATIVE) ==========
// Get credentials from: https://pinata.cloud/

export const uploadToPinata = async (file) => {
  if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
    throw new Error('Pinata credentials not configured');
  }
  
  try {
    console.log(`📤 Uploading to Pinata: ${file.name}`);
    
    const formData = new FormData();
    formData.append('file', file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        project: 'MunicipalFund',
        timestamp: Date.now(),
      },
    });
    formData.append('pinataMetadata', metadata);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const cid = data.IpfsHash;
    const url = `https://gateway.pinata.cloud/ipfs/${cid}`;
    
    console.log(`✅ Pinata upload successful: ${cid}`);
    
    return { 
      success: true, 
      ipfsHash: cid, 
      url, 
      gateway: 'pinata', 
      cid,
      pinSize: data.PinSize,
    };
  } catch (error) {
    console.error('Pinata upload failed:', error);
    throw error;
  }
};

// ========== METHOD 3: WEB3.STORAGE ==========
// Get token from: https://web3.storage/

export const uploadToWeb3Storage = async (file) => {
  if (!WEB3_STORAGE_TOKEN) {
    throw new Error('Web3.Storage token not configured');
  }
  
  try {
    console.log(`📤 Uploading to Web3.Storage: ${file.name}`);
    
    const { Web3Storage } = await import('web3.storage');
    const client = new Web3Storage({ token: WEB3_STORAGE_TOKEN });

    const cid = await client.put([file], {
      name: file.name,
      maxRetries: 3,
    });

    const url = `https://${cid}.ipfs.w3s.link/${file.name}`;
    
    console.log(`✅ Web3.Storage upload successful: ${cid}`);
    
    return { success: true, ipfsHash: cid, url, gateway: 'web3storage', cid };
  } catch (error) {
    console.error('Web3.Storage upload failed:', error);
    throw error;
  }
};

// ========== SMART AUTO-SELECT BEST METHOD ==========

export const uploadFileToIPFS = async (file) => {
  console.log(`\n🚀 IPFS Upload Started: ${file.name} (${(file.size / 1024).toFixed(2)} KB)\n`);
  
  const methods = [
    { name: 'Infura', fn: uploadToInfura, available: !!getInfuraClient() },
    { name: 'Pinata', fn: uploadToPinata, available: !!(PINATA_API_KEY && PINATA_SECRET_KEY) },
    { name: 'Web3.Storage', fn: uploadToWeb3Storage, available: !!WEB3_STORAGE_TOKEN },
  ];
  
  const availableMethods = methods.filter(m => m.available);
  
  if (availableMethods.length === 0) {
    console.warn('⚠️  NO IPFS PROVIDERS CONFIGURED!');
    console.warn('Add credentials to .env for production use.');
    console.warn('Using MOCK upload for development...\n');
    return mockIPFSUpload(file);
  }
  
  // Try each available method
  for (const method of availableMethods) {
    try {
      console.log(`Trying ${method.name}...`);
      const result = await method.fn(file);
      console.log(`\n✅ SUCCESS: ${method.name} uploaded ${file.name}\n`);
      return result;
    } catch (error) {
      console.error(`❌ ${method.name} failed: ${error.message}`);
      continue;
    }
  }
  
  throw new Error('All IPFS upload methods failed');
};

// ========== BATCH UPLOADS ==========

export const uploadFilesToIPFS = async (files) => {
  console.log(`\n📦 Batch Upload: ${files.length} files\n`);
  
  const results = [];
  let successCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Uploading: ${file.name}`);
    
    try {
      const result = await uploadFileToIPFS(file);
      results.push({ ...result, fileName: file.name, index: i });
      successCount++;
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
      results.push({ 
        success: false, 
        error: error.message, 
        fileName: file.name, 
        index: i 
      });
    }
  }
  
  console.log(`\n✅ Batch Complete: ${successCount}/${files.length} successful\n`);
  return results;
};

// ========== JSON UPLOADS ==========

export const uploadJSONToIPFS = async (jsonData, filename = 'data.json') => {
  const jsonString = JSON.stringify(jsonData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const file = new File([blob], filename);
  
  return await uploadFileToIPFS(file);
};

// ========== MOCK IPFS (Development Only) ==========

const mockIPFSUpload = async (file) => {
  console.log('🔶 MOCK MODE: Simulating IPFS upload...');
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1500));
  
  // Generate realistic CID
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomCid = 'Qm' + Array.from({ length: 44 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  
  console.log(`✅ Mock upload complete: ${randomCid}\n`);
  console.warn('⚠️  WARNING: This is a MOCK upload!');
  console.warn('File is NOT actually stored on IPFS.');
  console.warn('Configure IPFS credentials for production.\n');
  
  return {
    success: true,
    ipfsHash: randomCid,
    url: `https://ipfs.io/ipfs/${randomCid}`,
    gateway: 'mock',
    cid: randomCid,
    isMock: true,
    warning: 'Mock upload - file not on IPFS',
  };
};

// ========== RETRIEVE FROM IPFS ==========

export const getFromIPFS = async (cid, preferredGateway = 'infura') => {
  const gateways = {
    infura: `https://infura-ipfs.io/ipfs/${cid}`,
    pinata: `https://gateway.pinata.cloud/ipfs/${cid}`,
    cloudflare: `https://cloudflare-ipfs.com/ipfs/${cid}`,
    ipfs: `https://ipfs.io/ipfs/${cid}`,
    w3s: `https://w3s.link/ipfs/${cid}`,
  };
  
  const tryGateway = async (url) => {
    const response = await fetch(url, { method: 'GET' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.blob();
  };
  
  // Try preferred gateway first
  try {
    return await tryGateway(gateways[preferredGateway] || gateways.ipfs);
  } catch (error) {
    console.error(`${preferredGateway} gateway failed, trying alternatives...`);
  }
  
  // Try all other gateways
  for (const [name, url] of Object.entries(gateways)) {
    if (name === preferredGateway) continue;
    try {
      return await tryGateway(url);
    } catch (error) {
      continue;
    }
  }
  
  throw new Error('All IPFS gateways failed');
};

// ========== UTILITY: CHECK IF CONFIGURED ==========

export const isIPFSConfigured = () => {
  return !!(
    (INFURA_PROJECT_ID && INFURA_PROJECT_SECRET) ||
    (PINATA_API_KEY && PINATA_SECRET_KEY) ||
    WEB3_STORAGE_TOKEN
  );
};

export const getConfiguredProviders = () => {
  const providers = [];
  if (INFURA_PROJECT_ID && INFURA_PROJECT_SECRET) providers.push('Infura');
  if (PINATA_API_KEY && PINATA_SECRET_KEY) providers.push('Pinata');
  if (WEB3_STORAGE_TOKEN) providers.push('Web3.Storage');
  return providers;
};

// ========== EXPORT ==========

export default {
  uploadFileToIPFS,
  uploadFilesToIPFS,
  uploadJSONToIPFS,
  getFromIPFS,
  uploadToInfura,
  uploadToPinata,
  uploadToWeb3Storage,
  isIPFSConfigured,
  getConfiguredProviders,
};
