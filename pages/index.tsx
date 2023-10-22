import React, { useState, useEffect } from 'react';
import '../styles/globals.css';
import { ethers } from 'ethers';


const PERMIT_TYPEHASH="0xea2aa0a1be11a07ed86d755c93467f4f82362b452371d1ba94d1715123511acb";

const DOMAIN_SEPARATOR="0xdbb8cf42e1ecb028be3f3dbc922e1d878b963f411dc388ced501601c60f7c6f7";

let provider_common;
let signer_common;

let nonce;

let expiry;



const getexpiry = async() => {
    const now = Math.floor(Date.now() / 1000);  // Get current UNIX timestamp in seconds
    expiry = now + 5 * 60;
    return expiry;
}
// ... rest of the code
const connectToMetaMask = async () => {
    if (!window.ethereum) {
        alert('Please install MetaMask to use this feature.');
        return;
    }

    try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
            setIsConnected(true);
        }
    } catch (error) {
        console.error('User denied account access.');
    }
}


const generatePermitDigest = async (holder, spender, nonce, expiry, allowed) => {

    const nonceBigNumber = ethers.BigNumber.from(nonce);
    const expiryBigNumber = ethers.BigNumber.from(expiry);
    // console.log({
    //     PERMIT_TYPEHASH,
    //     holder,
    //     spender,
    //     nonce,
    //     expiry,
    //     allowed
    //   });
      
    // Assuming you have DOMAIN_SEPARATOR and PERMIT_TYPEHASH constants
    const encodedMessage = ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'address', 'uint256', 'uint256', 'bool'],
      [PERMIT_TYPEHASH, holder, spender, nonce, expiry, allowed]
    );
  
    const messageHash = ethers.utils.keccak256(encodedMessage);
  
    const packedData = ethers.utils.solidityPack(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', DOMAIN_SEPARATOR, messageHash]
    );
  
    const digest = ethers.utils.keccak256(packedData);
    
    return digest;
  };

  const digest_value = async () => { 
    provider_common = new ethers.providers.Web3Provider(window.ethereum);
    signer_common = provider_common.getSigner();
    const address = await signer_common.getAddress();
    // console.info("check");
    // console.log(address);
    nonce = await provider_common.getTransactionCount(await signer_common.getAddress());

    // console.log(signer_common);
    const valu=await generatePermitDigest(address,ethers.utils.getAddress("0xeA81ba32E064EFB6d4BdCb24b457d963c398fb6c"),nonce,await getexpiry(),true);
    
    return  valu;
};
  



const Home: React.FC = () => {
const [isConnected, setIsConnected] = useState(false);
  const [fromToken, setFromToken] = useState('');  // Ensure this is defined in the component
  const [toToken, setToToken] = useState('');     // Ensure this is defined in the component
  const [amount, setAmount] = useState(''); 

//   const signData = async () => {
//     if (!window.ethereum) {
//       alert('Please install MetaMask to use this feature.');
//       return;
//     }
  
//     const provider = new ethers.providers.Web3Provider(window.ethereum);
//     const signer = provider.getSigner();
  
//     const dataToSign = `${fromToken}-${toToken}-${amount}-0xAc4b3DacB91461209Ae9d41EC517c2B9Cb1B7DAF`;
  
//     try {
//       const signature = await signer.signMessage(dataToSign);
      
//       // Extracting the VRS parameters from the signature
//       const { r, s, v } = ethers.utils.splitSignature(signature);
      
//       console.log('VRS:', v, r, s);
//     } catch (error) {
//       console.error('Error signing data:', error);
//     }
//   };

  const signDigest = async () => {

   let digest= await digest_value();

   console.error(digest);
    if (!window.ethereum) {
        alert('Please install MetaMask to use this feature.');
        return;
      }
    
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      try {

        if (digest =='0x') {
            return;
          }
    const signature = await signer.signMessage(ethers.utils.arrayify(digest));
    
    const { r, s, v } = ethers.utils.splitSignature(signature);
    console.log('VRS:', v, r, s);
    return { v, r, s };
    } catch (error) {
      console.error('Error signing data:', error);
    }
  };
  
  

    useEffect(() => {
        const checkConnection = async () => {
            if (window.ethereum) {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts.length > 0) {
                    setIsConnected(true);
                }
            }
        };

        checkConnection();
    }, []);

    const disconnectMetaMask = () => {
        if (window.ethereum) {
            window.ethereum.request({ method: 'eth_accounts' }).then(accounts => {
                if (accounts.length > 0) {
                    setIsConnected(false);
                    // Other logic to handle the disconnection (if required)
                }
            });
        }
    }

 

    // console.log(digest);
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
                {
                    isConnected ? (
                        <button onClick={disconnectMetaMask} className="mb-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                            Disconnect from MetaMask
                        </button>
                    ) : (
                        <button onClick={connectToMetaMask} className="mb-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            Connect with MetaMask
                        </button>
                    )
                }



                <div className="grid grid-cols-1 gap-4">
                    <input className="border p-2 rounded" placeholder="From Token Address" value={fromToken} onChange={(e) => setFromToken(e.target.value)}/>
                    <input className="border p-2 rounded" placeholder="To Token Address" value={toToken} onChange={(e) => setToToken(e.target.value)}/>
                    <input className="border p-2 rounded" placeholder="Amount to Swap" type="number" value={amount} onChange={(e) => setAmount(e.target.value)}/>

                    <button onClick={signDigest} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Sign & Generate VRS Hash
                    </button>

                </div>
            </div>

            <div className="mt-8 w-full max-w-2xl">
                <table className="min-w-full bg-white shadow-md rounded">
                    <thead>
                        <tr>
                            <th className="py-2 px-4 border-b">From Token</th>
                            <th className="py-2 px-4 border-b">To Token</th>
                            <th className="py-2 px-4 border-b">Amount</th>
                            <th className="py-2 px-4 border-b">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Map over your transactions and display them here */}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Home;
