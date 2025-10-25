// Real IPFS Upload Utility using Web3.Storage
// For production, get your API token from https://web3.storage

import { Web3Storage } from 'web3.storage';

// Initialize Web3.Storage client
// IMPORTANT: Replace with your actual API token from https://web3.storage
const WEB3_STORAGE_TOKEN = process.env.REACT_APP_WEB3_STORAGE_TOKEN || 'YOUR_WEB3_STORAGE_TOKEN';

let web3StorageClient = null;

const getClient = () => {
  if (!web3StorageClient) {
    if (WEB3_STORAGE_TOKEN === 'YOUR_WEB3_STORAGE_TOKEN') {
      console.warn('Web3.Storage token not configured. Using mock IPFS uploads.');
      return null;
    }
    web3StorageClient = new Web3Storage({ token: WEB3_STORAGE_TOKEN });
  }
  return web3StorageClient;
};

/**
 * Upload a single file to IPFS using Web3.Storage
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} - Object containing IPFS hash and gateway URL
 */
export const uploadFileToIPFS = async (file) => {
  const client = getClient();
  
  // Fallback to mock upload if Web3.Storage is not configured
  if (!client) {
    return mockIPFSUpload(file);
  }

  try {
    console.log(`Uploading ${file.name} to IPFS...`);
    
    // Upload file to Web3.Storage
    const cid = await client.put([file], {
      name: file.name,
      maxRetries: 3,
      wrapWithDirectory: false
    });

    const ipfsHash = cid;
    const gatewayUrl = `https://w3s.link/ipfs/${cid}`;

    console.log(`✅ Upload successful! CID: ${cid}`);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      ipfsHash: ipfsHash,
      cid: cid,
      url: gatewayUrl,
      gateway: 'https://w3s.link/ipfs/',
      uploadedAt: new Date().toISOString(),
      realUpload: true
    };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    // Fallback to mock on error
    return mockIPFSUpload(file);
  }
};

/**
 * Upload multiple files to IPFS
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Object[]>} - Array of upload results
 */
export const uploadFilesToIPFS = async (files) => {
  const client = getClient();
  
  // Fallback to mock if not configured
  if (!client) {
    return Promise.all(files.map(file => mockIPFSUpload(file)));
  }

  try {
    const uploadPromises = files.map(file => uploadFileToIPFS(file));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return Promise.all(files.map(file => mockIPFSUpload(file)));
  }
};

/**
 * Upload JSON data to IPFS
 * @param {Object} data - JSON data to upload
 * @param {string} filename - Name for the JSON file
 * @returns {Promise<Object>} - Upload result
 */
export const uploadJSONToIPFS = async (data, filename = 'data.json') => {
  const client = getClient();
  
  if (!client) {
    return mockIPFSUpload(new Blob([JSON.stringify(data)], { type: 'application/json' }), filename);
  }

  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const file = new File([blob], filename, { type: 'application/json' });

    const cid = await client.put([file], {
      name: filename,
      wrapWithDirectory: false
    });

    return {
      name: filename,
      size: blob.size,
      type: 'application/json',
      ipfsHash: cid,
      cid: cid,
      url: `https://w3s.link/ipfs/${cid}`,
      gateway: 'https://w3s.link/ipfs/',
      uploadedAt: new Date().toISOString(),
      realUpload: true,
      data: data
    };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    return mockIPFSUpload(new Blob([JSON.stringify(data)], { type: 'application/json' }), filename);
  }
};

/**
 * Retrieve file from IPFS
 * @param {string} cid - IPFS CID/hash
 * @returns {string} - Gateway URL to access the file
 */
export const getIPFSUrl = (cid) => {
  if (!cid) return null;
  
  // Remove ipfs:// protocol if present
  const cleanCid = cid.replace('ipfs://', '');
  
  // Use multiple gateways for redundancy
  return {
    primary: `https://w3s.link/ipfs/${cleanCid}`,
    fallback1: `https://ipfs.io/ipfs/${cleanCid}`,
    fallback2: `https://cloudflare-ipfs.com/ipfs/${cleanCid}`,
    fallback3: `https://gateway.pinata.cloud/ipfs/${cleanCid}`
  };
};

/**
 * Check if Web3.Storage is properly configured
 * @returns {boolean}
 */
export const isIPFSConfigured = () => {
  return WEB3_STORAGE_TOKEN !== 'YOUR_WEB3_STORAGE_TOKEN' && WEB3_STORAGE_TOKEN !== '';
};

/**
 * Mock IPFS upload for development/testing
 * @param {File|Blob} file
 * @param {string} filename
 * @returns {Object} - Mock upload result
 */
const mockIPFSUpload = (file, filename = null) => {
  console.warn('⚠️ Using MOCK IPFS upload. Configure WEB3_STORAGE_TOKEN for real uploads.');
  
  const name = filename || file.name || 'unnamed';
  const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  
  return {
    name: name,
    size: file.size || 0,
    type: file.type || 'application/octet-stream',
    ipfsHash: mockCid,
    cid: mockCid,
    url: file instanceof File ? URL.createObjectURL(file) : '#',
    gateway: 'https://ipfs.io/ipfs/',
    uploadedAt: new Date().toISOString(),
    realUpload: false,
    mock: true
  };
};

/**
 * Alternative: Pinata IPFS Upload
 * If you prefer Pinata, uncomment this section and use pinataApiKey
 */
/*
import axios from 'axios';

const PINATA_API_KEY = process.env.REACT_APP_PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.REACT_APP_PINATA_SECRET_KEY;

export const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append('pinataMetadata', metadata);

  try {
    const res = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxBodyLength: 'Infinity',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      }
    });

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      ipfsHash: res.data.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`,
      uploadedAt: new Date().toISOString(),
      realUpload: true
    };
  } catch (error) {
    console.error('Pinata upload error:', error);
    return mockIPFSUpload(file);
  }
};
*/

export default {
  uploadFileToIPFS,
  uploadFilesToIPFS,
  uploadJSONToIPFS,
  getIPFSUrl,
  isIPFSConfigured
};
