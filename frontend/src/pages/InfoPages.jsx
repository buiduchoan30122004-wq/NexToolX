import React from 'react';
import { Mail, ShieldCheck, FileText, Sparkles } from 'lucide-react';

export function About() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px' }}><span className="gradient-text">About NexToolX</span></h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.8' }}>
        NexToolX is a premium global platform dedicated to indexing, reviewing, and analyzing artificial intelligence software. Our goal is to build the most comprehensive, structured, and developer-friendly AI tool directory in the world.
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: '16px', lineHeight: '1.8' }}>
        With tens of thousands of AI projects launching monthly, finding the right tool is a daunting task. NexToolX simplifies this process by providing a clean taxonomy, nesting category structures, verified badges, and discount opportunities.
      </p>
    </div>
  );
}

export function Contact() {
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px' }}>Contact Us</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Have questions, partnership inquiries, or need support? Drop us a message!</p>
      
      <form className="detail-card" style={{ padding: '24px' }} onSubmit={(e) => { e.preventDefault(); alert('Message sent!'); }}>
        <div className="form-group">
          <label>Email Address</label>
          <input type="email" className="form-control" placeholder="you@example.com" required />
        </div>
        <div className="form-group">
          <label>Subject</label>
          <input type="text" className="form-control" placeholder="e.g. Advertising Options" required />
        </div>
        <div className="form-group">
          <label>Message</label>
          <textarea className="form-control" rows="5" placeholder="Write your message here..." required></textarea>
        </div>
        <button type="submit" className="submit-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <Mail size={16} /> Send Message
        </button>
      </form>
    </div>
  );
}

export function Privacy() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <ShieldCheck size={28} style={{ color: 'var(--accent-emerald)' }} /> Privacy Policy
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>
        At NexToolX, accessible from nextoolx.com, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by NexToolX and how we use it.
      </p>
      <h2 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>Log Files</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>
        NexToolX follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics.
      </p>
    </div>
  );
}

export function Terms() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <h1 style={{ fontSize: '36px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <FileText size={28} style={{ color: 'var(--primary)' }} /> Terms of Service
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>
        Welcome to NexToolX! These terms and conditions outline the rules and regulations for the use of NexToolX's Website, located at nextoolx.com.
      </p>
      <h2 style={{ fontSize: '20px', color: 'var(--text-primary)' }}>Intellectual Property Rights</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.8' }}>
        Other than the content you own, under these Terms, NexToolX and/or its licensors own all the intellectual property rights and materials contained in this Website.
      </p>
    </div>
  );
}
