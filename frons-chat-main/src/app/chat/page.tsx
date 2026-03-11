"use client";

import { useState, useEffect } from "react";
import { Send, Key, Database, Sparkles, Loader2, Lock, FileUp, ShieldCheck, Download, Search, X, Paperclip, Shield, Library, BookOpen, Coins, LogOut } from "lucide-react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWalletBalances } from "@/hooks/useWalletBalances";

interface Message {
  role: "user" | "ai";
  content: string;
}

export default function EvidenceCascadeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello. I am the Evidence Cascade AI. I am natively connected to the **Fronsciers Global Library** and **FRONS-J Journals** to provide hallucination-free, evidence-based citations.\n\nAsk me to summarize research, find relevant insights, or attach encrypted files from your **Vault** to cross-analyze your private data against published literature."
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // Privy Auth & Wallet State
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const activeWallet = user?.wallet?.address || wallets[0]?.address;
  
  // Cross-Platform USDC Credit Balance
  const { tokens, isLoading: isBalanceLoading } = useWalletBalances(activeWallet);
  const usdcBalance = tokens.find(t => t.symbol === "USDC")?.uiAmount || 0;
  
  // Vault & Context State
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [isKeyValid, setIsKeyValid] = useState(false);
  
  const [blobs, setBlobs] = useState<{ id: string; name: string }[]>([
    { id: "walrus-blob-1", name: "Q3_Cell_Assay_Results.csv" },
    { id: "walrus-blob-2", name: "Draft_Methods_Section.docx" }
  ]);
  const [selectedBlobs, setSelectedBlobs] = useState<string[]>([]);
  
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceContent, setEvidenceContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsTyping(true);

    setTimeout(async () => {
      let aiResponse = "I have analyzed your query.";
      
      // [TODO: FUTURE API CALL FOR AI MODEL HERE WITH X402 FRAMEWORK]
      // Replace the logic below with the actual fetch to your LLM API endpoint.
      const futureAiModelApiCall: any[] = []; // Explicitly defined array representation for API extension
      
      // example x402 implementation block:
      // const response = await fetch('https://your-api.com/v1/chat', { 
      //    method: 'POST', 
      //    headers: {
      //       'Content-Type': 'application/json',
      //       'X-402-Payment-Address': 'user_wallet_address_here', // For x402 L402/Paywall Protocol
      //       'Authorization': `Bearer ${userToken}`
      //    },
      //    body: JSON.stringify({ 
      //      messages: [...messages, { role: "user", content: userMessage }], 
      //      contextBlobs: selectedBlobs 
      //    }) 
      // });
      // 
      // if (response.status === 402) {
      //    // Handle x402 Payment Required
      //    const invoice = await response.json();
      //    // trigger solana wallet payment for the citation fee...
      // }

      if (selectedBlobs.length > 0) {
         aiResponse = `Based on the ${selectedBlobs.length} secure evidence blobs loaded into context, and cross-referencing against the Fronsciers Library, I can confirm your hypothesis holds weight.\n\n[Citation Fee Applied: 0.1 USDC]`;
      } else {
         aiResponse = `According to the latest FRONS-J journals and the Fronsciers Library, the leading research points toward significant breakthroughs in this field. I've aggregated the top 3 contextual findings for you.\n\n*Reminder: You will be charged a standard citation protocol fee for these authenticated references.*\n\n[Citation Fee Applied: 0.1 USDC]`;
      }

      setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleUnlockVault = () => {
    if (secretKey.length > 3) {
      setIsKeyValid(true);
    }
  };

  const handleEncryptAndUpload = async () => {
    if (!evidenceName || !evidenceContent || !isKeyValid) return;
    setIsUploading(true);
    
    setTimeout(() => {
      const newBlob = { id: `walrus-blob-${Date.now()}`, name: evidenceName };
      setBlobs(prev => [newBlob, ...prev]);
      setEvidenceName("");
      setEvidenceContent("");
      setIsUploading(false);
    }, 1500);
  };

  const toggleBlobSelection = (id: string) => {
    setSelectedBlobs(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header Context Bar */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between shadow-sm z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[#2C337A] font-bold">
            <Shield className="w-5 h-5" />
            <span>FRONS Vault Chat</span>
          </div>
          <div className="h-4 w-px bg-gray-300 mx-2"></div>
          
          {/* Default Knowledge Bases */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#2C337A]/10 text-[#2C337A] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#2C337A]/20">
              <Library className="w-3.5 h-3.5" />
              Fronsciers Library
            </div>
            <div className="flex items-center gap-1.5 bg-[#2C337A]/10 text-[#2C337A] px-2.5 py-1 rounded-md text-xs font-semibold border border-[#2C337A]/20">
              <BookOpen className="w-3.5 h-3.5" />
              FRONS-J Journals
            </div>
          </div>
          
          <div className="h-4 w-px bg-gray-300 mx-2"></div>

          {/* Vault Integration */}
          <button 
            onClick={() => setIsVaultOpen(true)}
            className="flex items-center gap-2 bg-[#F3F4F6] hover:bg-[#E5E7EB] text-gray-700 px-3 py-1.5 rounded-lg border border-gray-200 transition-colors text-sm font-medium"
          >
            <Lock className="w-4 h-4 text-[#FB7720]" />
            {isKeyValid ? "My Vault" : "Unlock Vault"}
          </button>

          {/* Credit Balance & Auth */}
          <div className="flex items-center gap-4 ml-6 mr-2">
             {ready && authenticated ? (
               <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2 bg-[#FB7720]/10 text-[#FB7720] px-4 py-2 rounded-lg text-sm font-bold border border-[#FB7720]/20 shadow-sm">
                   {isBalanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                   {isBalanceLoading ? "..." : `${usdcBalance.toFixed(2)}`} USDC
                 </div>
                 <button onClick={logout} className="text-gray-400 hover:text-red-500 bg-gray-100 hover:bg-red-50 p-2.5 rounded-lg transition-colors border border-gray-200" title="Disconnect Privy">
                   <LogOut className="w-4 h-4" />
                 </button>
               </div>
             ) : (
               <button 
                 onClick={login}
                 className="bg-[#2C337A] hover:bg-[#1E245A] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
               >
                 Connect Wallet
               </button>
             )}
          </div>

          {selectedBlobs.length > 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">
               <Database className="w-4 h-4" />
               <span className="text-xs font-bold">{selectedBlobs.length} Blobs Attached</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-[#2C337A]">
          <Sparkles className="w-4 h-4 text-[#FB7720]" />
          <span className="text-xs font-bold uppercase tracking-wider">Evidence Cascade Engine</span>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 w-full">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-xl p-5 rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-[#2C337A] text-white rounded-tr-sm shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm rounded-tl-sm'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mb-3 text-[#2C337A]">
                    <Sparkles className="w-4 h-4 text-[#FB7720]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Cascade AI</span>
                  </div>
                )}
                <p className="leading-relaxed text-[15px] whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {/* Quick Suggestions for Empty/Initial State */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              <button 
                onClick={() => setInput("Can you summarize the top 3 papers on CRISPR-Cas9 published in FRONS-J this month?")}
                className="text-left bg-white border border-gray-200 hover:border-[#2C337A] hover:bg-[#2C337A]/5 p-4 rounded-xl transition-all"
              >
                <BookOpen className="w-5 h-5 text-[#2C337A] mb-2" />
                <p className="text-sm font-medium text-gray-800">Summarize recent journals</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">"Find the top 3 papers on CRISPR-Cas9 in FRONS-J..."</p>
              </button>
              
              <button 
                onClick={() => setInput("I need an evidence-based citation for the neural network architecture discussed in Smith et al. (2025).")}
                className="text-left bg-white border border-gray-200 hover:border-[#2C337A] hover:bg-[#2C337A]/5 p-4 rounded-xl transition-all"
              >
                <Library className="w-5 h-5 text-[#2C337A] mb-2" />
                <p className="text-sm font-medium text-gray-800">Find a specific citation</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">"Get a citation for the architecture in Smith (2025)..."</p>
              </button>

              <button 
                onClick={() => {
                   if (!isVaultOpen && selectedBlobs.length === 0) {
                     setIsVaultOpen(true);
                   } else {
                     setInput("Cross-analyze my attached Vault evidence against the latest Fronsciers Library publications on this topic.");
                   }
                }}
                className="text-left bg-white border border-gray-200 hover:border-[#2C337A] hover:bg-[#2C337A]/5 p-4 rounded-xl transition-all"
              >
                <ShieldCheck className="w-5 h-5 text-[#FB7720] mb-2" />
                <p className="text-sm font-medium text-gray-800">Cross-analyze with Vault</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">Attach encrypted private data to ground public insights.</p>
              </button>
            </div>
          )}
          
          {isTyping && (
            <div className="flex justify-start mt-6">
              <div className="bg-white border border-gray-200 p-5 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-3 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin text-[#FB7720]" />
                <span className="text-sm font-medium">Synthesizing evidence...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 md:p-6 bg-white w-full border-t border-gray-100">
          <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-[#E5E0FE] focus-within:border-[#2C337A] transition-all">
            <button 
              onClick={() => setIsVaultOpen(true)}
              className="absolute left-3 text-gray-400 hover:text-[#2C337A] transition-colors p-2"
              title="Attach File from Vault"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Query the Cascade AI about your Vault context..."
              className="w-full bg-transparent text-gray-800 text-lg pl-14 pr-16 py-4 focus:outline-none"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 bg-[#2C337A] hover:bg-[#1E245A] disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {selectedBlobs.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
               {selectedBlobs.map(id => {
                 const blob = blobs.find(b => b.id === id);
                 if (!blob) return null;
                 return (
                   <div key={id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                     <FileUp className="w-3 h-3" />
                     {blob.name}
                     <button onClick={() => toggleBlobSelection(id)} className="ml-1 hover:text-emerald-900">
                        <X className="w-3 h-3" />
                     </button>
                   </div>
                 );
               })}
            </div>
          )}

          {/* Pricing Disclaimer */}
          <div className="mt-4 text-center text-xs text-gray-400 font-medium">
             ⚡ Library Queries are free. Authenticated evidence-based citations cost <span className="text-[#FB7720] font-bold">0.1 USDC</span> per citation via the x402 protocol.
          </div>
        </div>
      </div>

      {/* Vault Modal Overlay */}
      {isVaultOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-bold text-[#2C337A] flex items-center gap-3">
                  <Lock className="w-6 h-6 text-[#FB7720]" />
                  My Vault File Manager
                </h2>
                <p className="text-sm text-gray-500 mt-1">Select encrypted blobs to add as AI context, or upload new evidence to Walrus.</p>
              </div>
              <button onClick={() => setIsVaultOpen(false)} className="text-gray-400 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col gap-6">
              {!isKeyValid ? (
                /* Unlock State */
                <div className="bg-gray-50 border border-gray-200 p-8 rounded-2xl flex flex-col items-center justify-center text-center max-w-lg mx-auto w-full my-8">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                     <Lock className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Vault is Locked</h3>
                  <p className="text-gray-500 text-sm mb-6">Enter your master decryption key to access your secure evidence blobs.</p>
                  
                  <div className="w-full flex gap-2">
                    <input 
                      type="password"
                      placeholder="Enter Vault Master Key..."
                      value={secretKey}
                      onChange={e => setSecretKey(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUnlockVault()}
                      className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#E5E0FE] focus:border-[#2C337A]"
                    />
                    <button 
                      onClick={handleUnlockVault} 
                      disabled={secretKey.length < 4}
                      className="bg-[#2C337A] text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 hover:bg-[#1E245A] transition-colors"
                    >
                      Unlock
                    </button>
                  </div>
                </div>
              ) : (
                /* Unlocked State */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Select Context */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                        <Database className="w-5 h-5 text-[#2C337A]" />
                        Select Evidence Context
                      </h3>
                      <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                        <input 
                          type="text" 
                          placeholder="Search..." 
                          className="bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#2C337A]" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {blobs.map((blob, idx) => {
                        const isSelected = selectedBlobs.includes(blob.id);
                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleBlobSelection(blob.id)}
                            className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                              isSelected ? 'border-[#2C337A] bg-[#2C337A]/5' : 'border-gray-200 hover:border-[#E5E0FE] bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-[#2C337A] text-white' : 'bg-gray-100 text-gray-500'}`}>
                                <FileUp className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className={`font-semibold text-sm line-clamp-1 ${isSelected ? 'text-[#2C337A]' : 'text-gray-800'}`}>{blob.name}</h4>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{blob.id.substring(0,12)}...</p>
                              </div>
                            </div>
                            <div>
                               <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                 isSelected ? 'bg-[#2C337A] border-[#2C337A]' : 'border-gray-300'
                               }`}>
                                  {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                               </div>
                            </div>
                          </div>
                        );
                      })}
                      {blobs.length === 0 && (
                        <div className="text-center p-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed text-gray-500">
                          No blobs in vault. Upload new evidence.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload New Data */}
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 h-fit">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-emerald-600" />
                       Encrypt & Upload New Data
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <input
                          type="text"
                          value={evidenceName}
                          onChange={e => setEvidenceName(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5E0FE]"
                          placeholder="Dataset Name (e.g. Trial_Data.csv)"
                        />
                      </div>
                      <div>
                        <textarea
                          value={evidenceContent}
                          onChange={e => setEvidenceContent(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5E0FE] h-32 resize-none"
                          placeholder="Paste raw content here to encrypt..."
                        />
                      </div>
                      <button 
                        onClick={handleEncryptAndUpload}
                        disabled={isUploading || !evidenceName || !evidenceContent}
                        className="w-full bg-[#FB7720] hover:bg-[#E86A1D] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                        {isUploading ? "Encrypting to Walrus..." : "Secure Upload"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {isKeyValid && (
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                 <button 
                   onClick={() => setIsVaultOpen(false)}
                   className="bg-[#2C337A] hover:bg-[#1E245A] text-white px-8 py-3 rounded-xl font-medium transition-colors"
                 >
                   Confirm Context ({selectedBlobs.length})
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
