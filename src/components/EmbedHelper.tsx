import React, { useState } from 'react';
import { Copy, Check, ExternalLink, HelpCircle, Laptop } from 'lucide-react';

interface EmbedHelperProps {
  appUrl: string;
}

export default function EmbedHelper({ appUrl }: EmbedHelperProps) {
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [embedHeight, setEmbedHeight] = useState('650');
  const [hideDefaultTab, setHideDefaultTab] = useState(false);
  
  // Clean fallback if appUrl is placeholder
  const actualUrl = appUrl && appUrl.startsWith('http') ? appUrl : window.location.href;

  const embedCode = `<iframe 
  src="${actualUrl}" 
  width="100%" 
  height="${embedHeight}px" 
  style="border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);" 
  allow="fullscreen"
  title="Newton's First Law of Motion Interactive Simulation">
</iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(actualUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      
      {/* Introduction */}
      <div>
        <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Laptop className="w-5 h-5 text-blue-600" />
          Google Sites Embed Assistant
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          This simulation is fully optimized to be embedded in your <strong>Google Site</strong>, canvas LMS, class portal, or educational presentation. Follow the simple methods below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Method 1: Google Sites Direct Link (Easiest) */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-3.5">
          <div className="flex justify-between items-start">
            <div>
              <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                Method A (Simplest)
              </span>
              <h4 className="font-bold text-sm text-slate-800 mt-1.5">
                Embed directly using the Web Address URL
              </h4>
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            Google Sites includes a native <strong>"Embed"</strong> tool. You can simply paste the live web link of this applet, and Google Sites will generate a secure, responsive box automatically.
          </p>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Your Google Sites Embed URL:
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={actualUrl}
                className="bg-white border border-slate-200 px-3 py-2 text-xs rounded-lg flex-grow font-mono text-slate-600 focus:outline-none"
              />
              <button
                onClick={copyUrlToClipboard}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-500 transition flex items-center gap-1.5 min-w-[90px] justify-center cursor-pointer"
              >
                {copiedUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" /> Copied!
                  </>
                ) : (
                  'Copy URL'
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200/50 pt-3 text-xs text-slate-600">
            <h5 className="font-bold text-[11px] text-slate-700">📋 Instructions:</h5>
            <ol className="list-decimal pl-4 space-y-1 text-slate-500">
              <li>Open your Google Site editor.</li>
              <li>In the right sidebar, click the <strong>Embed</strong> button (in the Insert panel).</li>
              <li>Choose the <strong>"By URL"</strong> tab.</li>
              <li>Paste the URL copied above. Click <strong>Insert</strong>.</li>
              <li>Resize the box handles on your site so it displays fully!</li>
            </ol>
          </div>
        </div>

        {/* Method 2: HTML Embed Code (Best customization) */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 space-y-4">
          <div>
            <span className="bg-blue-100 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
              Method B (Advanced)
            </span>
            <h4 className="font-bold text-sm text-slate-800 mt-1.5">
              Embed using customized HTML iFrame Code
            </h4>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            If you want to customize how the simulation behaves and look on your web page, use this custom HTML embed block.
          </p>

          {/* Options */}
          <div className="grid grid-cols-2 gap-3 bg-white p-3 border border-slate-200/60 rounded-xl">
            <div className="space-y-1">
              <label htmlFor="height-setting" className="text-[10px] font-bold text-slate-600 uppercase">
                Embed Height:
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  id="height-setting"
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-semibold"
                />
                <span className="text-[10px] text-slate-400">px</span>
              </div>
            </div>
            
            <div className="flex flex-col justify-end text-right">
              <a
                href={actualUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 justify-end"
              >
                Launch Live Link <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Code Render */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                HTML Code Block:
              </span>
              <button
                onClick={copyToClipboard}
                id="btn-copy-iframe-code"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Embed Code
                  </>
                )}
              </button>
            </div>
            
            <pre className="bg-slate-900 text-blue-300 text-[10px] font-mono p-3.5 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed select-all">
              {embedCode}
            </pre>
          </div>

          <div className="space-y-2 border-t border-slate-200/50 pt-3 text-xs text-slate-600">
            <h5 className="font-bold text-[11px] text-slate-700">📋 Instructions:</h5>
            <ol className="list-decimal pl-4 space-y-1 text-slate-500">
              <li>Click the <strong>Copy Embed Code</strong> button above.</li>
              <li>Go to your Google Site, double-click on the canvas, or select <strong>Embed</strong>.</li>
              <li>Select the <strong>"Embed code"</strong> tab.</li>
              <li>Paste the code, click <strong>Next</strong>, and click <strong>Insert</strong>.</li>
            </ol>
          </div>
        </div>

      </div>

      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold text-xs text-slate-800">Is the embed fully secure?</h5>
          <p className="text-xs text-slate-500 leading-relaxed">
            Yes! This app is compiled with native Web standards and served via secured HTTPS using Cloud Run. It does not require database cookies or logins, making it fully safe for standard student browsers and restricted school networks.
          </p>
        </div>
      </div>

    </div>
  );
}
