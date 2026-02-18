import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccounts } from '../utils/AccountManager';
import { auth } from '../lib/supabase';
import { useAuth } from '../App';

// Helper function to get clean display name for account
const getAccountDisplayName = (account) => {
  if (!account) return 'Unknown';
  
  // If account_name exists and is NOT an email, use it
  if (account.account_name && !account.account_name.includes('@')) {
    return account.account_name;
  }
  
  // Extract name from email (e.g., "arla.ops@..." -> "Arla")
  const emailOrName = account.account_name || account.seller_id || '';
  if (emailOrName.includes('@')) {
    const namePart = emailOrName.split('@')[0]; // "arla.ops"
    const firstName = namePart.split('.')[0]; // "arla"
    return firstName.charAt(0).toUpperCase() + firstName.slice(1); // "Arla"
  }
  
  // Fallback to seller_id
  return account.seller_id || 'Account';
};

function Ffr({ apiUrl }) {
  const navigate = useNavigate();
  const { accounts, loading: accountsLoading } = useAccounts();
  const { isAdmin } = useAuth();
  
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [rawResponses, setRawResponses] = useState({});
  
  // Prevent multiple fetches
  const initialFetchDone = useRef(false);

  // Fetch performance data when accounts load
  useEffect(() => {
    if (accountsLoading) return;
    if (accounts.length === 0) return;
    if (initialFetchDone.current) return;
    
    initialFetchDone.current = true;
    fetchAllAccountsPerformance(accounts);
  }, [accounts, accountsLoading]);

  const fetchAllAccountsPerformance = async (accountsList) => {
    setLoading(true);
    setError(null);
    setPerformanceData([]);
    setRawResponses({});
    
    // Fetch all accounts in parallel for faster loading
    const promises = accountsList.map(account => 
      fetchAccountPerformance(account)
    );
    
    try {
      const results = await Promise.allSettled(promises);
      
      const allPerformance = [];
      const allRawResponses = {};
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          const account = accountsList[index];
          allPerformance.push({
            account_id: account.id,
            account_name: getAccountDisplayName(account),
            account_country: account.country,
            ...result.value.parsed
          });
          
          // Collect raw responses
          if (result.value.rawResponse) {
            allRawResponses[account.id] = result.value.rawResponse;
          }
        }
      });
      
      // Update state once with all data
      setPerformanceData(allPerformance);
      setRawResponses(allRawResponses);
    } catch (err) {
      setError('Failed to fetch performance data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountPerformance = async (account) => {
    try {
      // Get auth token for the API call
      const token = await auth.getAccessToken();
      
      // Use accountId query parameter (camelCase) - matches withLazadaToken middleware
      const response = await fetch(`${apiUrl}/lazada/seller/policy?accountId=${account.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const displayName = getAccountDisplayName(account);

      if (response.ok && (data.code === '0' || data.code === 0)) {
        let ffrRate = 'N/A';
        
        // FFR is nested inside the "logistic" policy's children array
        if (data.data && data.data.policyTree && Array.isArray(data.data.policyTree)) {
          // First find the logistic policy
          const logisticPolicy = data.data.policyTree.find(policy => 
            policy.uniqueKey === 'logistic'
          );
          
          if (logisticPolicy && logisticPolicy.children && Array.isArray(logisticPolicy.children)) {
            // Now find the FFR policy inside the children
            const ffrPolicy = logisticPolicy.children.find(child => 
              child.uniqueKey === 'fast_fulfilment'
            );
            
            if (ffrPolicy && ffrPolicy.score && ffrPolicy.score !== '-') {
              // Remove the % sign from the score (e.g., "95.87%" -> "95.87")
              ffrRate = ffrPolicy.score.toString().replace('%', '');
            }
          }
        }
        
        return { 
          parsed: { ffr: ffrRate },
          rawResponse: {
            account_name: displayName,
            account_country: account.country,
            status: response.status,
            statusText: response.statusText,
            headers: {
              'content-type': response.headers.get('content-type'),
              'date': response.headers.get('date')
            },
            fullResponse: data
          }
        };
      } else {
        return { 
          parsed: { ffr: 'Error' },
          rawResponse: {
            account_name: displayName,
            account_country: account.country,
            status: response.status,
            statusText: response.statusText,
            headers: {},
            fullResponse: data
          }
        };
      }
    } catch (err) {
      console.error(`Error fetching policy for ${getAccountDisplayName(account)}:`, err);
      return { 
        parsed: { ffr: 'Error' },
        rawResponse: {
          account_name: getAccountDisplayName(account),
          account_country: account.country,
          status: 'error',
          statusText: err.message,
          headers: {},
          fullResponse: { error: err.message }
        }
      };
    }
  };

  const handleRefresh = () => {
    setPerformanceData([]);
    setRawResponses({});
    initialFetchDone.current = false;
    fetchAllAccountsPerformance(accounts);
  };

  // Show loading while accounts are loading
  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Show message if no accounts
  if (accounts.length === 0) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Fast Fulfilment Rate (FFR)</h1>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">No Lazada accounts connected</p>
          {isAdmin ? (
            <button
              onClick={() => navigate('/lazada-auth')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              + Connect Lazada Account
            </button>
          ) : (
            <p className="text-gray-500 text-sm">Contact an admin to connect accounts.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fast Fulfilment Rate (FFR)</h1>
        <div className="flex gap-3">
          <button
            onClick={() => setShowRawData(!showRawData)}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {showRawData ? 'Hide' : 'Show'} Raw API Response
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Raw API Response Display */}
      {showRawData && Object.keys(rawResponses).length > 0 && (
        <div className="mb-6 bg-gray-900 text-green-400 rounded-lg p-6 overflow-auto max-h-[600px]">
          <h2 className="text-xl font-bold mb-4 text-white">Complete API Responses (All Data)</h2>
          {Object.entries(rawResponses).map(([accountId, data]) => (
            <div key={accountId} className="mb-8">
              <div className="bg-gray-800 p-3 rounded mb-2">
                <h3 className="text-lg font-semibold text-yellow-400">
                  Account: {data.account_name} ({data.account_country})
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  HTTP Status: {data.status} {data.statusText}
                </p>
              </div>
              <div className="bg-black p-4 rounded">
                <p className="text-cyan-400 mb-2 font-mono text-xs">COMPLETE RESPONSE BODY:</p>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(data.fullResponse, null, 2)}
                </pre>
              </div>
              <div className="border-t border-gray-700 my-6"></div>
            </div>
          ))}
          
          <div className="mt-4 p-4 bg-blue-900 rounded">
            <p className="text-blue-200 text-sm">
              💡 <strong>Tip:</strong> Check your browser console (F12) for the same data in a more readable format. 
              You can also right-click on the JSON above and copy it.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Account Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Fast Fulfilment Rate
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading && performanceData.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">Loading performance data...</p>
                  </div>
                </td>
              </tr>
            ) : performanceData.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-12 text-center text-gray-500">
                  No performance data available. Click Refresh to load data.
                </td>
              </tr>
            ) : (
              performanceData.map((data) => (
                <tr key={data.account_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                        {data.account_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{data.account_name}</div>
                        <div className="text-sm text-gray-500 uppercase">{data.account_country}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-2xl font-bold ${
                      data.ffr === 'N/A' || data.ffr === 'Error' 
                        ? 'text-gray-400' 
                        : parseFloat(data.ffr) >= 95 
                          ? 'text-green-600' 
                          : parseFloat(data.ffr) >= 90 
                            ? 'text-yellow-600' 
                            : 'text-red-600'
                    }`}>
                      {data.ffr !== 'N/A' && data.ffr !== 'Error' ? `${data.ffr}%` : data.ffr}
                    </span>
                    {data.ffr !== 'N/A' && data.ffr !== 'Error' && (
                      <div className="text-xs text-gray-500 mt-1">
                        {parseFloat(data.ffr) >= 95 ? '✓ Good' : parseFloat(data.ffr) >= 90 ? '⚠ Needs improvement' : '✗ Below target'}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      {performanceData.length > 0 && (
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>≥95% Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
            <span>90-95% Needs improvement</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span>&lt;90% Below target</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ffr;