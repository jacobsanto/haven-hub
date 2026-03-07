import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Bot, User } from 'lucide-react';
import { useBrand } from '@/contexts/BrandContext';
import { useNavigationItems } from '@/hooks/useNavigationItems';
import { Input } from '@/components/ui/input';

export function FooterChatFirst() {
  const { brandName, brandTagline, contactEmail } = useBrand();
  const { data: exploreLinks = [] } = useNavigationItems('footer_explore');
  const { data: companyLinks = [] } = useNavigationItems('footer_company');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'bot', text: `Welcome to ${brandName}! I can help you find the perfect villa, check availability, or answer any questions.` },
  ]);

  const nameParts = brandName.split(' ');
  const primaryPart = nameParts[0] || brandName;

  const handleSend = () => {
    if (!chatInput.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text: chatInput }, { role: 'bot', text: `Thanks for your message! For detailed assistance, please contact us at ${contactEmail}.` }]);
    setChatInput('');
  };

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Chat panel */}
          <div className="bg-background/5 border border-background/10 rounded-3xl overflow-hidden">
            <div className="px-6 py-4 border-b border-background/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-background">{primaryPart} Concierge</p>
                <p className="text-[10px] text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />Online now
                </p>
              </div>
            </div>

            <div className="p-6 space-y-4 max-h-[300px] overflow-y-auto">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-accent/20' : 'bg-primary/20'}`}>
                    {msg.role === 'bot' ? <Bot className="h-3.5 w-3.5 text-accent" /> : <User className="h-3.5 w-3.5 text-primary" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl text-sm max-w-[80%] ${msg.role === 'bot' ? 'bg-background/5 text-background/80' : 'bg-accent/20 text-background'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-background/10 flex gap-2">
              <Input
                placeholder="Ask anything..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                className="bg-background/5 border-background/10 text-background placeholder:text-background/40 h-10"
              />
              <button onClick={handleSend} className="w-10 h-10 bg-accent text-accent-foreground rounded-xl flex items-center justify-center shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Links side */}
          <div className="space-y-10">
            <div>
              <span className="font-serif text-2xl font-bold text-background">{primaryPart}<span className="text-accent">.</span></span>
              {brandTagline && <p className="text-sm text-background/50 mt-2">{brandTagline}</p>}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-4">Explore</p>
                {exploreLinks.map(l => (
                  <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-1.5 hover:text-background transition-colors">{l.label}</Link>
                ))}
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-[.2em] text-accent mb-4">Company</p>
                {companyLinks.map(l => (
                  <Link key={l.path} to={l.path} className="block text-sm text-background/50 py-1.5 hover:text-background transition-colors">{l.label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-background/10 text-center">
          <p className="text-xs font-mono text-background/30">© {new Date().getFullYear()} {brandName}</p>
        </div>
      </div>
    </footer>
  );
}
