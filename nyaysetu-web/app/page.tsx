"use client";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: string, content: string, citations?: string[]}[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sending both just in case FastAPI expects 'query' or 'message'
        body: JSON.stringify({ query: input, message: input }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessages([...newMessages, { 
          role: "ai", 
          content: `🚨 FastAPI Error ${response.status}: ${JSON.stringify(data.detail || data)}` 
        }]);
        setIsLoading(false);
        return;
      }

      setMessages([...newMessages, { 
        role: "ai", 
        content: data.reply,
        citations: data.citations
      }]);
    } catch (error) {
      console.error("Error connecting to backend:", error);
      setMessages([...newMessages, { role: "ai", content: "Error connecting to the NyaySetu backend. Is FastAPI running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNotice = async (text: string) => {
    try {
      const res = await fetch("http://localhost:8000/api/generate-notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue_description: text })
      });
      
      if (!res.ok) throw new Error("Failed to generate PDF");
      
      // Force the browser to trigger a download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "NyaySetu_Demand_Notice.pdf";
      a.click();
    } catch (err) {
      console.error(err);
      alert("Error generating the legal notice.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 rounded-t-xl">
          <h1 className="text-2xl font-bold">NyaySetu</h1>
          <p className="text-sm text-slate-300">Your AI Legal Assistant</p>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <p className="text-gray-400 text-center mt-10">Ask a legal question to get started...</p>
          )}
          
          {messages.map((msg, index) => (
            <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`p-4 rounded-lg max-w-[80%] ${msg.role === "user" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              
              {/* Citations block */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-md">
                  <strong>Sources cited:</strong>
                  <ul className="list-disc pl-4 mt-1">
                    {msg.citations.map((cite, i) => (
                      <li key={i}>{cite.replace('data/', '')}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generate PDF Button (Only shows on AI messages) */}
              {msg.role === "ai" && !msg.content.includes("🚨") && (
                <button 
                  onClick={() => handleGenerateNotice(msg.content)}
                  className="mt-3 flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                  Generate Legal Notice
                </button>
              )}
            </div>
          ))}
          {isLoading && <div className="text-gray-400 text-sm italic">NyaySetu is reviewing the laws...</div>}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="E.g., My landlord won't return my deposit..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}